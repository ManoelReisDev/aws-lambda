# AWS Lambda Event Lab

Laboratório didático para um seminário sobre arquitetura orientada a eventos. Crie eventos de pedidos, edite o JSON e acompanhe resultados, erros e histórico em uma única tela.

## Executar localmente

Requer Node.js 22.12 ou superior e npm.

```sh
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente http://127.0.0.1:5173). O comando inicia também a API em http://127.0.0.1:3001. Para encerrar os dois processos, use Ctrl+C. Se a porta 5173 estiver ocupada, use a porta alternativa exibida pelo Vite.

O modo **Simulação** funciona sem credenciais e sem chamadas à AWS. As etapas têm pausas ilustrativas para facilitar a apresentação; o tempo exibido mede somente a lógica local. O editor JSON é a fonte do evento enviado. Depois de alterar os campos do formulário, clique em **Gerar JSON com os campos** para atualizar o editor.

## Roteiro do seminário

1. Selecione **Pedido simples** e envie: P-001, R$ 150,00, sem desconto.
2. Selecione **Com desconto**: P-002, R$ 300,00, resultado R$ 270,00.
3. Selecione **Pedido inválido**: o campo `data.pedidoId` ausente gera um erro explicativo.
4. Edite livremente o evento: tente outro tipo, valor negativo ou JSON malformado.
5. Explore as abas Resultado, Payload enviado e Registros. Reabra execuções pelo histórico.
6. Se houver configuração AWS, compare os mesmos cenários no modo AWS real.

O histórico fica em memória na aba, com limite de 50 execuções, e é apagado ao recarregar a página. Os registros simulados são identificados como locais. No modo AWS, os registros exibidos são exclusivamente o trecho real retornado pela invocação; não há leitura adicional do CloudWatch.

## Configurar AWS real

O projeto não cria infraestrutura nem publica funções automaticamente.

1. Gere o pacote da função:

   ```sh
   npm run build:lambda
   cd dist/lambda
   zip function.zip index.cjs
   ```

2. Crie ou atualize uma função Lambda com runtime Node.js 22.x, faça upload de `function.zip` e configure o handler como **`index.handler`**. O arquivo `index.cjs` é CommonJS e não depende de `node_modules`. Defina timeout adequado ao exemplo (por exemplo, 10 segundos).
3. A role de execução da Lambda precisa de permissões de gravação de logs, como as da política `AWSLambdaBasicExecutionRole`.
4. Configure credenciais no ambiente do backend, usando um perfil AWS local (inclusive SSO) ou uma role IAM. O SDK utiliza sua cadeia padrão de credenciais. Credenciais nunca são enviadas ao frontend.
5. Na raiz do projeto:

   ```sh
   cp .env.example .env
   ```

   Preencha:

   ```dotenv
   AWS_REGION=us-east-1
   LAMBDA_FUNCTION_NAME=nome-da-sua-funcao
   # AWS_PROFILE=meu-perfil
   ```

6. Reinicie `npm run dev` e selecione **AWS real**. O indicador “Configurada” confirma apenas a presença das variáveis. A primeira execução verifica efetivamente credenciais, conectividade e permissão.

O principal usado pelo backend deve possuir `lambda:InvokeFunction` apenas para a função configurada. Exemplo de política, substituindo os valores:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "lambda:InvokeFunction",
    "Resource": "arn:aws:lambda:us-east-1:123456789012:function:minha-funcao"
  }]
}
```

A função é escolhida exclusivamente por variável do backend. O corpo da requisição não permite selecionar outro destino. O SDK não faz novas tentativas automáticas neste laboratório para evitar invocações duplicadas em falhas de transporte.

### Configurações personalizadas da Lambda

O painel **Configurações personalizadas** define como a função executa o código, acessa recursos e protege a aplicação. Para este laboratório, as opções podem permanecer nos padrões: a função valida o pedido, calcula o desconto e retorna o resultado.

| Configuração | Para que serve | No nosso laboratório |
| --- | --- | --- |
| **Execução durável** | Permite criar processos com etapas, esperas e retomada de estado. Exemplo: aguardar a confirmação de um pagamento antes de continuar. Requer código preparado para esse modelo. | Desativada: processamos cada pedido em uma chamada curta. |
| **Provedor de capacidade do EC2** | Executa funções em instâncias EC2 gerenciadas pelo Lambda, com configuração de capacidade e infraestrutura. | Desativado: usamos a capacidade padrão do Lambda. |
| **Arquitetura ARM64** | Escolhe o tipo de processador. ARM64 usa processadores AWS Graviton; dependências nativas precisam ser compatíveis. | Desativada significa usar **x86_64**. Nosso JavaScript puro também pode funcionar em ARM64. |
| **Personalizar perfil de execução** | Permite escolher a **role IAM da função**, definindo quais serviços ela pode acessar. | Usamos a role básica criada pela AWS para gravar logs. |
| **URL da função** | Cria um endereço HTTPS para chamar a função diretamente, com autenticação configurável. | Desativada: o backend chama a API do Lambda usando o SDK. |
| **Modo de isolamento de locatário** | Separa ambientes de execução por cliente de uma aplicação com múltiplos clientes, usando um identificador de tenant. | Desativado: o laboratório não precisa dessa separação. |
| **VPC** | Conecta a função à sua rede privada AWS, por exemplo para acessar um banco de dados privado. | Desativada: não acessamos recursos de uma rede privada. |
| **Assinatura de código** | Verifica a assinatura dos pacotes publicados, podendo alertar ou bloquear pacotes que não atendam à política. | Desativada: não configuramos um fluxo de assinatura. |
| **Criptografia com AWS KMS** | Permite escolher uma chave gerenciada por você para proteger o pacote de código. | Mantemos a criptografia padrão da AWS. |
| **Tags** | Adiciona etiquetas para organização, como `Projeto=LambdaEventLab` e `Ambiente=Demo`. | Opcionais; ajudam a identificar os recursos. |

**Permissões de invocação e de execução são diferentes:** o usuário `lambda-lab-local`, utilizado pelo backend local, pode invocar a função. A role de execução da Lambda permite que a própria função grave logs no CloudWatch. Se futuramente a função precisar salvar pedidos no DynamoDB, essa permissão será adicionada à role da Lambda.

**Desativar a opção personalizada de KMS não desativa a criptografia.** O pacote continua protegido pela criptografia padrão da AWS.

Documentação AWS: [execução durável](https://docs.aws.amazon.com/lambda/latest/dg/durable-configuration.html), [capacidade EC2](https://docs.aws.amazon.com/lambda/latest/dg/lambda-managed-instances.html), [arquitetura](https://docs.aws.amazon.com/lambda/latest/dg/foundation-arch.html), [role de execução](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html), [URL da função](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html), [isolamento por cliente](https://docs.aws.amazon.com/lambda/latest/dg/tenant-isolation.html), [VPC](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html), [assinatura de código](https://docs.aws.amazon.com/lambda/latest/dg/configuration-codesigning-create.html), [criptografia](https://docs.aws.amazon.com/lambda/latest/dg/encrypt-zip-package.html) e [tags](https://docs.aws.amazon.com/lambda/latest/dg/configuration-tags.html).

### O que a integração demonstra

`Navegador → Express → Lambda (RequestResponse) → Express → Navegador`

A invocação é **síncrona**: demonstra o processamento real da função, sem fila, SNS ou EventBridge. A interface não afirma observar etapas internas da Lambda. Durante a chamada, o estado “Processando” significa que a resposta está pendente.

Erros de validação são rejeitados pela API antes da invocação. Para observar um erro de validação diretamente na Lambda e seus logs, execute o cenário inválido no console de testes da própria função. Erros da função (`FunctionError`), respostas fora do contrato e falhas do SDK são tratados pela API. A chamada AWS tem timeout de 30 segundos; uma função remota pode continuar executando mesmo se o cliente deixar de aguardar.

A duração AWS inclui a ida e volta do backend, não apenas o tempo de CPU da função. `Lambda RequestId` é extraído dos logs quando presente; `API RequestId` identifica a requisição ao serviço AWS e é exibido separadamente. `LogType: Tail` retorna até 4 KB de logs da execução.

## Exemplos com SQS, SNS e EventBridge

Os exemplos desta seção são evoluções possíveis do e-commerce fictício. **A implementação atual não utiliza SQS, SNS ou EventBridge:** o backend invoca a Lambda diretamente e aguarda a resposta.

| Serviço | Conceito principal | Exemplo no laboratório |
| --- | --- | --- |
| **SQS** | Fila: guarda mensagens até serem consumidas, dentro do período de retenção configurado. | Acumular pedidos e processá-los conforme a capacidade disponível. |
| **SNS** | Publicação e assinatura: distribui uma mensagem para vários interessados. | Avisar estoque, faturamento e notificações sobre o mesmo pedido. |
| **EventBridge** | Barramento de eventos: encaminha eventos por regras de conteúdo. | Direcionar pedidos de valor elevado para análise e pagamentos aprovados para expedição. |

### SQS: processar pedidos sem fazer o cliente esperar

Imagine uma promoção que gera milhares de pedidos em poucos segundos:

```text
Checkout → Backend → Fila SQS → Lambda de pedidos
```

O backend coloca cada pedido na fila e responde **“pedido recebido para processamento”**. A Lambda processa as mensagens depois, aplicando a mesma regra de desconto do laboratório. A confirmação de envio à fila não significa que o pedido já foi processado.

- **Desacoplamento temporal:** produtor e consumidor não precisam executar ao mesmo tempo.
- **Buffer:** a fila absorve o acúmulo de mensagens durante picos.
- **Novas tentativas:** mensagens que falham podem voltar a ficar disponíveis para processamento.
- **Idempotência:** processar novamente o mesmo evento deve evitar efeitos duplicados, como cobrar duas vezes. O identificador do evento pode ser usado para registrar quais eventos já foram processados.

Na integração com Lambda, o mapeamento de origem de eventos consulta a fila e invoca a função com lotes de mensagens. Apesar de essa invocação interna ser síncrona, o fluxo é assíncrono do ponto de vista do checkout, que não aguarda a conclusão. Pode haver processamento repetido. Uma fila de mensagens não processadas (**DLQ**), quando configurada, pode receber mensagens após o limite de tentativas definido na política da fila.

O handler atual precisaria de uma adaptação: a integração SQS entrega mensagens em `event.Records`, e o JSON do pedido fica no campo `body` de cada registro. A regra de negócio de `shared/domain.ts` pode continuar sendo reutilizada.

Referências: [Lambda com SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html) e [configuração da fila e DLQ](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-lambda-function-trigger.html).

### SNS: um pedido interessa a vários sistemas

Quando o pedido é criado, várias áreas precisam reagir independentemente:

```text
                         ┌→ Fila de estoque → Lambda de estoque
Checkout → Tópico SNS ────┼→ Fila de faturamento → Lambda de faturamento
                         └→ Fila de notificações → Lambda de e-mail
```

O checkout publica uma mensagem no tópico, e cada fila inscrita recebe uma cópia, conforme os filtros configurados.

- **Publisher:** quem publica a mensagem, como o checkout.
- **Topic:** canal de publicação, como `pedidos-criados`.
- **Subscriber:** quem assina o tópico, como a fila de estoque.
- **Fan-out:** distribuição de uma mensagem para vários destinos.

Uma fila por área permite que cada consumidor processe em seu próprio ritmo. **Vários consumidores na mesma fila SQS disputam as mensagens; isso não garante uma cópia para cada área.** O SNS faz a distribuição entre as filas. Ele também pode entregar diretamente a outros tipos de destino, como funções Lambda.

O SNS oferece filtros por assinatura, baseados nos atributos ou no corpo JSON da mensagem. Por exemplo, uma assinatura pode receber apenas pedidos de determinada categoria.

Referências: [SNS com SQS](https://docs.aws.amazon.com/sns/latest/dg/sns-sqs-as-subscriber.html) e [filtros do SNS](https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html).

### EventBridge: encaminhar eventos conforme o significado

O e-commerce pode produzir vários tipos de evento:

```text
Checkout ─── PedidoCriado ──────┐
Pagamento ── PagamentoAprovado ─┼→ EventBridge → Regras → Destinos
Estoque ──── EstoqueEsgotado ───┘
```

| Evento e condição | Destino proposto |
| --- | --- |
| `PedidoCriado` | Fila de processamento de pedidos. |
| `PedidoCriado` com total acima de R$ 1.000 | Fila de análise antifraude. |
| `PagamentoAprovado` | Lambda que inicia a expedição. |
| `EstoqueEsgotado` | Serviço de reposição de produtos. |

- **Event bus:** barramento que recebe os eventos.
- **Event pattern:** critérios que identificam os eventos de interesse.
- **Rule:** associa esses critérios aos destinos.
- **Target:** destino, como uma Lambda ou fila SQS.

Um evento pode corresponder a várias regras e seguir para vários destinos. A regra seleciona os eventos; o código do consumidor executa a ação de negócio. O SNS também possui filtros: o exemplo com EventBridge enfatiza a integração de várias origens e tipos de evento em um barramento.

A publicação precisaria adaptar nosso contrato ao envelope do EventBridge: o tipo pode ser informado como `DetailType`, a origem como `Source`, e os dados do evento como JSON em `Detail`. O consumidor recebe o envelope do EventBridge e extrai o evento para reutilizar a regra de negócio.

Referências: [regras do EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rules.html) e [padrões de eventos](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html).

### Combinando os serviços

```text
Checkout → EventBridge → Regra PedidoCriado → SQS → Lambda
```

Nesse exemplo, **EventBridge decide o encaminhamento, SQS guarda o trabalho pendente e Lambda executa o processamento**. São responsabilidades complementares. O backend confirma a publicação; para a interface mostrar o resultado final posteriormente, seria necessário armazenar o status do processamento e disponibilizar uma forma de consultá-lo ou notificá-lo.

## Versão legível da função Lambda

O arquivo `dist/lambda/index.cjs` é gerado pelo esbuild ao executar `npm run build:lambda` (ou `npm run build`). Ele reúne `lambda/handler.ts` e `shared/domain.ts` e adiciona código de compatibilidade com CommonJS. Edite os arquivos TypeScript de origem; alterações no arquivo gerado serão sobrescritas pelo próximo build.

Para explicar a função no seminário, esta versão JavaScript independente contém as mesmas validações e regras de processamento. Ela pode ser usada no console da Lambda como **`index.mjs`**, com handler **`index.handler`**, substituindo o código de exemplo desse arquivo. Use essa alternativa em lugar do pacote gerado, mantendo apenas um arquivo de entrada chamado `index` para evitar ambiguidade.

```javascript
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateEvent(event) {
  if (!isObject(event)) {
    throw new ValidationError("O evento deve ser um objeto JSON.");
  }

  if (event.type !== "PedidoCriado") {
    throw new ValidationError("O tipo do evento deve ser PedidoCriado.");
  }

  if (typeof event.id !== "string" || !event.id.trim()) {
    throw new ValidationError("O identificador do evento (id) é obrigatório.");
  }

  if (typeof event.source !== "string" || !event.source.trim()) {
    throw new ValidationError("A origem do evento (source) é obrigatória.");
  }

  if (!isObject(event.data)) {
    throw new ValidationError("O campo data deve ser um objeto.");
  }

  const { pedidoId, total } = event.data;

  if (typeof pedidoId !== "string" || !pedidoId.trim()) {
    throw new ValidationError(
      "O identificador do pedido (data.pedidoId) é obrigatório."
    );
  }

  if (
    typeof total !== "number" ||
    !Number.isFinite(total) ||
    total < 0 ||
    total > Number.MAX_SAFE_INTEGER / 100
  ) {
    throw new ValidationError(
      "O total deve ser um número finito, não negativo e dentro do limite monetário."
    );
  }
}

export async function handler(event) {
  console.info("Evento recebido", JSON.stringify(event));

  try {
    console.info("Validando o evento PedidoCriado.");
    validateEvent(event);

    const { pedidoId, total } = event.data;
    const hasDiscount = total >= 200;

    console.info(
      hasDiscount ? "Desconto de 10% aplicado." : "Pedido sem desconto."
    );

    const result = {
      pedidoId,
      status: "processado",
      desconto: hasDiscount ? "10%" : "0%",
      totalFinal: Math.round(total * (hasDiscount ? 0.9 : 1) * 100) / 100,
    };

    console.info("Pedido processado com sucesso.");
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

O `handler` recebe o evento, valida os campos, aplica desconto de 10% a partir de R$ 200,00 e retorna o resultado com duas casas de precisão monetária. Os registros de `console.info` e `console.error` são enviados ao CloudWatch quando a role da função permite gravar logs. A exceção é relançada para a Lambda identificar a execução como falha.

Essa versão serve como exemplo independente: alterações nela não atualizam a simulação local. No fluxo normal do projeto, mantenha as regras em `shared/domain.ts` e gere novamente o pacote para preservar a lógica compartilhada.

## Build e validação

```sh
npm test
npm run build
npm start
```

`npm run build` verifica TypeScript, gera o frontend em `dist/client`, a API em `dist/server` e a função em `dist/lambda`. `npm start` serve frontend e API em http://127.0.0.1:3001. As dependências Node devem estar instaladas para executar o backend compilado.

Quando o ambiente bloqueia sockets locais com EPERM, os testes HTTP são marcados como ignorados e devem ser executados fora desse ambiente.

Os testes cobrem regras monetárias, campos obrigatórios, tipos inválidos, paridade do handler, configuração ausente e rotas HTTP com a AWS substituída por um stub (sem chamadas remotas nem custos).

## Estrutura

- `src/`: interface React, componentes, SCSS e serviços de execução.
- `shared/domain.ts`: tipos, validação e regras compartilhadas.
- `server/`: API Express e integração AWS SDK v3.
- `lambda/handler.ts`: entrada da Lambda com registros reais.
- `tests/`: testes de domínio e API usando `node:test`.

### API

- `GET /api/health`: configuração disponível, região e conexão ainda não verificada. Não consulta AWS.
- `POST /api/execute`: evento JSON, limitado a 32 KB; resposta com `result`, `logs`, duração e identificadores disponíveis. Retorna 400 para eventos inválidos, 503 sem configuração e 502 em falhas da integração.

O servidor escuta apenas em loopback por padrão. Esta versão foi preparada para uso local. Antes de expô-la na internet, adicione autenticação e autorização, limitação de requisições e HTTPS; mantenha permissões IAM restritas e proteja o acesso aos logs retornados. O modo SQS é uma evolução opcional e não faz parte deste MVP.

## Referências

- [Invocar Lambda com AWS SDK v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_lambda_code_examples.html)
- [Contrato InvokeCommand, erros e logs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/lambda/command/InvokeCommand/)
