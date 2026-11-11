import express, { type ErrorRequestHandler } from 'express';
import { InvokeCommand, LambdaClient, type InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { isOrderResult, validateEvent, ValidationError } from '../shared/domain';
type InvocationOutput = Omit<InvokeCommandOutput, 'Payload'> & { Payload?: Uint8Array };
interface Config { region?: string; functionName?: string; invoke?: (command: InvokeCommand) => Promise<InvocationOutput> }
export function createApp(config: Config = {}) {
  const app = express();
  const configured = !!(config.region && config.functionName);
  let client: LambdaClient | undefined;
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => res.json({ configured, region: config.region || null, connection: 'not-verified' }));
  app.post('/api/execute', async (req, res) => {
    const started = performance.now();
    try {
      validateEvent(req.body);
      if (!configured) { res.status(503).json({ errorStage: 'request', error: 'Configure AWS_REGION e LAMBDA_FUNCTION_NAME no backend para usar a AWS.' }); return; }
      const command = new InvokeCommand({ FunctionName: config.functionName, InvocationType: 'RequestResponse', LogType: 'Tail', Payload: Buffer.from(JSON.stringify(req.body)) });
      client ??= config.invoke ? undefined : new LambdaClient({ region: config.region, maxAttempts: 1 });
      const output = await (config.invoke ? config.invoke(command) : client!.send(command, { abortSignal: AbortSignal.timeout(30_000) }));
      const logs = output.LogResult ? Buffer.from(output.LogResult, 'base64').toString('utf8').split('\n').filter(Boolean) : [];
      const requestId = logs.map(line => line.match(/START RequestId: ([\w-]+)/)?.[1]).find(Boolean);
      const metadata = { durationMs: Math.round(performance.now() - started), requestId, apiRequestId: output.$metadata.requestId, logs };
      let payload: unknown;
      try { payload = JSON.parse(Buffer.from(output.Payload ?? []).toString('utf8')); }
      catch { res.status(502).json({ ...metadata, errorStage: 'lambda', error: 'A Lambda retornou um payload que não é JSON válido.' }); return; }
      if (output.FunctionError) {
        const message = typeof payload === 'object' && payload !== null && 'errorMessage' in payload ? String(payload.errorMessage) : output.FunctionError;
        res.status(502).json({ ...metadata, errorStage: 'lambda', error: message, payload }); return;
      }
      if (!isOrderResult(payload)) { res.status(502).json({ ...metadata, errorStage: 'lambda', error: 'A resposta da Lambda não segue o contrato OrderResult.', payload }); return; }
      res.json({ ...metadata, result: payload });
    } catch (error) {
      if (error instanceof ValidationError) { res.status(400).json({ errorStage: 'event', error: error.message }); return; }
      console.error('Falha ao invocar Lambda:', error instanceof Error ? error.name : 'Erro desconhecido');
      res.status(502).json({ errorStage: 'request', error: 'Não foi possível executar a Lambda. Verifique credenciais, região, permissão lambda:InvokeFunction e os logs do backend.', durationMs: Math.round(performance.now() - started) });
    }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }));
  const handleError: ErrorRequestHandler = (error, _req, res, _next) => { res.status(error.status === 413 ? 413 : 400).json({ error: error.status === 413 ? 'O evento excede o limite de 32 KB.' : 'O corpo da requisição deve conter JSON válido.' }); };
  app.use(handleError);
  return app;
}
