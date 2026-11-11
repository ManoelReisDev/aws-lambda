import { test, type TestContext } from 'node:test';
import type { AddressInfo } from 'node:net';
import assert from 'node:assert/strict';
import { createApp } from '../server/app';
const event = { id: 'evt-001', type: 'PedidoCriado', source: 'loja.checkout', data: { pedidoId: 'P-001', total: 300 } };
const result = { pedidoId: 'P-001', status: 'processado', desconto: '10%', totalFinal: 270 };
// Use real HTTP when the environment allows loopback sockets.
async function withApi(t: TestContext, app: ReturnType<typeof createApp>, callback: (url: string) => Promise<void>) {
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EPERM') { t.skip('O sandbox bloqueia sockets locais. Execute em um ambiente que permita loopback.'); return; }
    throw error;
  }
  try { await callback(`http://127.0.0.1:${(server.address() as AddressInfo).port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
async function inject(url: string, options: string | { method: string; url: string; headers: Record<string,string>; payload: string }) {
  const response = await fetch(url + (typeof options === 'string' ? options : options.url), typeof options === 'string' ? {} : { method: options.method, headers: options.headers, body: options.payload });
  return { statusCode: response.status, payload: await response.text() };
}
const post = (url: string, payload: unknown) => inject(url, { method: 'POST', url: '/api/execute', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
test('API não configurada continua disponível e não chama AWS', async (t) => {
  const app = createApp({});
  await withApi(t, app, async url => {
  assert.equal(JSON.parse((await inject(url, '/api/health')).payload).configured, false);
  assert.equal((await post(url, event)).statusCode, 503);
  });
});
test('API valida antes de invocar e trata JSON malformado', async (t) => {
  let calls = 0;
  const app = createApp({ region: 'us-east-1', functionName: 'fixed', invoke: async () => { calls++; throw Error(); } });
  await withApi(t, app, async url => {
  assert.equal((await post(url, {})).statusCode, 400);
  assert.equal(calls, 0);
  const response = await inject(url, { method: 'POST', url: '/api/execute', headers: { 'content-type': 'application/json' }, payload: '{' });
  assert.equal(response.statusCode, 400);
  assert.match(JSON.parse(response.payload).error, /JSON/);
  });
});
test('invocação síncrona usa função fixa e decodifica resposta e logs', async (t) => {
  const app = createApp({ region: 'us-east-1', functionName: 'fixed', invoke: async command => {
    assert.equal(command.input.FunctionName, 'fixed');
    assert.equal(command.input.InvocationType, 'RequestResponse');
    assert.deepEqual(JSON.parse(Buffer.from(command.input.Payload as Uint8Array).toString()), event);
    return { $metadata: { requestId: 'api-id' }, Payload: Buffer.from(JSON.stringify(result)), LogResult: Buffer.from('START RequestId: lambda-id Version: $LATEST\nProcessado').toString('base64') };
  } });
  await withApi(t, app, async url => {
  const response = await post(url, event);
  const body = JSON.parse(response.payload);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(body.result, result);
  assert.equal(body.requestId, 'lambda-id');
  assert.equal(body.apiRequestId, 'api-id');
  assert.equal(body.logs.length, 2);
  });
});
for (const [name, output, expected] of [
  ['erro da função', { FunctionError: 'Unhandled', Payload: Buffer.from(JSON.stringify({ errorMessage: 'Falha de negócio' })) }, /Falha de negócio/],
  ['payload inválido', { Payload: Buffer.from('invalid') }, /JSON/],
  ['contrato incompatível', { Payload: Buffer.from('{}') }, /contrato/],
] as const) test(name, async (t) => {
  const app = createApp({ region: 'us-east-1', functionName: 'fixed', invoke: async () => ({ $metadata: {}, ...output }) });
  await withApi(t, app, async url => {
  const response = await post(url, event);
  assert.equal(response.statusCode, 502);
  assert.match(JSON.parse(response.payload).error, expected);
  });
});
test('falha de credenciais é tratada sem expor detalhes', async (t) => {
  const app = createApp({ region: 'us-east-1', functionName: 'fixed', invoke: async () => { throw new Error('secret-details'); } });
  await withApi(t, app, async url => {
  const response = await post(url, event);
  assert.equal(response.statusCode, 502);
  assert.doesNotMatch(response.payload, /secret-details/);
  });
});
test('corpo excessivo é rejeitado sem invocação', async (t) => {
  await withApi(t, createApp({}), async url => {
  const response = await post(url, { ...event, extra: 'x'.repeat(33_000) });
  assert.equal(response.statusCode, 413);
  });
});
