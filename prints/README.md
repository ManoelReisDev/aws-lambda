# Sequência dos prints para a apresentação

Os arquivos estão numerados na ordem didática de apresentação, independentemente do horário em que foram capturados. As 10 imagens foram preservadas integralmente; apenas os nomes foram alterados.

## Roteiro

| Ordem | Print | Etapa | O que explicar |
| --- | --- | --- | --- |
| 01 | [01-criar-lambda-nome-e-runtime.png](01-criar-lambda-nome-e-runtime.png) | Criar a função | Apresente o nome `lambda-event-lab` e a escolha do runtime. A captura mostra Node.js 24.x. |
| 02 | [02-configurar-lambda-arquitetura-e-rede.png](02-configurar-lambda-arquitetura-e-rede.png) | Configurar a infraestrutura | Mostre as opções de arquitetura, perfil de execução, URL da função e VPC. Na captura, as opções adicionais estão desativadas. |
| 03 | [03-confirmar-criacao-da-lambda.png](03-confirmar-criacao-da-lambda.png) | Confirmar a criação | Mostre o botão Create Event Function. Esta tela complementa a anterior e pode ser passada rapidamente. |
| 04 | [04-lambda-criada-primeiros-passos.png](04-lambda-criada-primeiros-passos.png) | Apresentar a função criada | A faixa verde confirma a criação. O assistente de primeiros passos apresenta caminhos para desenvolvimento, testes e integrações. |
| 05 | [05-explicar-handler-e-regra-de-desconto.png](05-explicar-handler-e-regra-de-desconto.png) | Explicar o processamento | Percorra o handler: recebimento do evento, chamada de validação, desconto de 10% a partir de R$ 200, retorno e tratamento de erro. O print é um trecho; a função validateEvent está no exemplo completo do README principal. |
| 06 | [06-enviar-pacote-zip-para-lambda.png](06-enviar-pacote-zip-para-lambda.png) | Apresentar o upload do código | Mostre o menu Atualizar e a opção de arquivo ZIP. Explique que index.cjs é gerado no build a partir dos arquivos TypeScript. A captura mostra o menu e o código já presente, sem comprovar um novo upload. |
| 07 | [07-revisar-politica-iam-de-invocacao.png](07-revisar-politica-iam-de-invocacao.png) | Definir a permissão de invocação | Apresente a revisão da política InvocarLambdaEventLab para o usuário lambda-lab-local, restrita à função do laboratório em us-east-2. O JSON completo está no README principal. |
| 08 | [08-politica-iam-criada-e-vinculada.png](08-politica-iam-criada-e-vinculada.png) | Confirmar a permissão do usuário | Mostre a confirmação de criação da política e sua presença na lista de permissões. Diferencie a identidade do backend da role de execução da Lambda. |
| 09 | [09-configurar-chave-para-codigo-local.png](09-configurar-chave-para-codigo-local.png) | Configurar o acesso local | Explique a seleção Código local para o backend. A captura mostra a escolha do caso de uso, não uma chave criada. As credenciais ficam no perfil AWS local; o .env informa região, função e nome do perfil. |
| 10 | [10-monitorar-invocacoes-duracao-e-erros.png](10-monitorar-invocacoes-duracao-e-erros.png) | Encerrar com observabilidade | Mostre as métricas de invocações, duração, erros e execuções simultâneas. Diferencie as métricas agregadas dos logs de cada execução. |

## Como apresentar

1. Use os prints 01 a 04 para contextualizar a criação da função. Os prints 02 e 03 são próximos; em uma apresentação curta, use apenas o 03 para resumir essas configurações.
2. Explique a lógica com o print 05 e o envio do pacote com o 06.
3. Use os prints 07 a 09 para explicar como o backend recebe permissão e se autentica.
4. Nesse ponto, faça a demonstração ao vivo no laboratório: pedido simples, pedido com desconto e pedido inválido. Não há capturas desses resultados nesta pasta.
5. Conclua com o print 10, relacionando a execução às métricas observadas na AWS. O print registra uma janela anterior e não representa automaticamente as execuções feitas durante a apresentação.

## Contexto das capturas

- Os prints 01 a 03 mostram uma conta diferente, na região Norte da Virgínia, com Node.js 24.x selecionado. Apresente-os como ilustração das telas de criação, e não como registro contínuo da mesma função das capturas seguintes.
- As capturas da função criada e do monitoramento mostram Ohio (`us-east-2`), região utilizada pela integração configurada no projeto.
- A ordem organiza uma explicação didática: o print do handler e o menu de upload foram capturados depois da configuração IAM e reposicionados para explicar o código antes do acesso local.
- O print 05 mostra somente o handler legível. Consulte a [versão completa no README](../README.md#versão-legível-da-função-lambda) para apresentar também a validação.

## Correspondência com os arquivos originais

| Arquivo atual | Horário da captura original (11/11/2026) |
| --- | --- |
| `01-criar-lambda-nome-e-runtime.png` | 11:16:05 |
| `02-configurar-lambda-arquitetura-e-rede.png` | 11:16:37 |
| `03-confirmar-criacao-da-lambda.png` | 11:16:41 |
| `04-lambda-criada-primeiros-passos.png` | 11:20:50 |
| `05-explicar-handler-e-regra-de-desconto.png` | 11:43:38 |
| `06-enviar-pacote-zip-para-lambda.png` | 11:48:54 |
| `07-revisar-politica-iam-de-invocacao.png` | 11:28:32 |
| `08-politica-iam-criada-e-vinculada.png` | 11:28:52 |
| `09-configurar-chave-para-codigo-local.png` | 11:30:11 |
| `10-monitorar-invocacoes-duracao-e-erros.png` | 11:38:17 |
