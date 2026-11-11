# Contexto do projeto — AWS Lambda Event Lab

## 1. Visão geral

Desenvolver uma aplicação web chamada **AWS Lambda Event Lab**, destinada a uma demonstração prática em um seminário acadêmico sobre Arquitetura Orientada a Eventos e AWS Lambda.

A aplicação deve funcionar como um laboratório interativo, permitindo demonstrar o processamento de eventos de um e-commerce fictício por meio de funções AWS Lambda.

A experiência precisa ser visual, intuitiva e didática, possibilitando que o apresentador explique o que está acontecendo em cada etapa da execução.

**Objetivo principal:** transformar uma demonstração técnica feita pelo console da AWS em uma experiência interativa acessível pelo navegador.

## 2. Contexto acadêmico

O seminário aborda:

- Arquitetura orientada a eventos (Event-Driven Architecture).
- Produtores, eventos e consumidores.
- Comunicação síncrona e assíncrona.
- AWS Lambda, handlers, runtime e triggers.
- Integração com EventBridge, SNS e SQS.
- Processamento de eventos e tratamento de erros.
- Monitoramento e observabilidade com CloudWatch.

A prática utilizará um exemplo de processamento de pedidos de um e-commerce para ilustrar esses conceitos.

A aplicação deve ajudar a explicar os fundamentos, sem exigir que os participantes conheçam previamente os serviços AWS.

## 3. Tecnologias

Utilizar preferencialmente:

**Frontend**
- React com TypeScript.
- Vite.
- SCSS para estilização.
- Componentes reutilizáveis.
- Ícones Lucide React.

**Backend de integração**
- Node.js com TypeScript.
- Express.
- AWS SDK for JavaScript v3.

Manter uma arquitetura simples, com separação de responsabilidades, adequada ao tamanho do projeto.

Não adicionar bibliotecas ou abstrações desnecessárias.

## 4. Experiência principal

A aplicação terá uma interface de laboratório organizada em três áreas principais.

### Área 1 — Simulador de pedidos

Representa o sistema produtor de eventos.

Deve permitir:

- Selecionar um cenário de teste.
- Informar ou modificar o identificador de um pedido.
- Definir o valor total.
- Gerar o evento `PedidoCriado`.
- Visualizar e editar o JSON produzido.
- Enviar o evento para processamento.

Criar três cenários predefinidos:

**Cenário 1 — Pedido simples**

Pedido `P-001`, valor de R$ 150,00.

Resultado esperado: pedido processado com sucesso, sem desconto.

**Cenário 2 — Pedido com desconto**

Pedido `P-002`, valor de R$ 300,00.

Resultado esperado: aplicação de desconto de 10%, totalizando R$ 270,00.

**Cenário 3 — Pedido inválido**

Evento sem identificador de pedido.

Resultado esperado: falha de validação, com mensagem explicativa.

### Área 2 — Visualização do fluxo de eventos

Representar visualmente o processamento:

Sistema produtor → Evento JSON → AWS Lambda → Resultado

Cada etapa deverá possuir um estado visual:

- Aguardando.
- Processando.
- Concluído.
- Erro.

Durante a execução, destacar progressivamente cada etapa, ajudando o apresentador a explicar o fluxo.

A representação visual deve ser simples e fiel ao que realmente acontece na aplicação.

No modo simulado, deixar claro que as etapas representam uma simulação. No modo conectado, mostrar apenas estados efetivamente confirmados pela integração.

### Área 3 — Console de execução

Criar um painel inspirado em consoles de desenvolvimento.

Exibir:

- Evento JSON enviado.
- Status da execução.
- Resultado retornado.
- Mensagens de erro.
- Tempo de processamento, quando medido.
- Identificador da requisição, quando disponível.
- Histórico das execuções realizadas na sessão.

Separar visualmente o payload, a resposta e os registros da execução.

Não apresentar logs simulados como se fossem logs reais do CloudWatch.

## 5. Modos de operação

A aplicação deve possuir dois modos claramente identificados.

### Modo Simulação

Executa localmente a mesma lógica de negócio utilizada na função Lambda.

Objetivos:

- Permitir demonstrações sem conexão com a AWS.
- Facilitar o desenvolvimento da interface.
- Possibilitar ensaios antes do seminário.

Este modo não deve realizar requisições aos serviços AWS.

### Modo AWS Real

Permite executar uma função Lambda existente na conta AWS.

Fluxo:

Frontend → Backend da aplicação → AWS Lambda → Backend → Frontend

O backend será responsável pela integração com a AWS, utilizando credenciais configuradas no ambiente.

Nunca colocar credenciais AWS no frontend.

A interface deve indicar quando a conexão não estiver configurada e permitir continuar utilizando o modo de simulação.

A primeira integração pode utilizar invocação síncrona do Lambda. Explicar na interface que isso demonstra o processamento real da função, mas ainda não representa uma entrega assíncrona por uma fila ou barramento de eventos.

## 6. Contrato dos eventos

O evento deve seguir o formato:

```json
{
  "id": "evt-001",
  "type": "PedidoCriado",
  "source": "loja.checkout",
  "data": {
    "pedidoId": "P-001",
    "total": 150.00
  }
}
```

A função Lambda deverá:

1. Receber o evento.
2. Validar o tipo `PedidoCriado`.
3. Verificar os campos obrigatórios.
4. Aplicar um desconto fictício de 10% para pedidos com total igual ou superior a R$ 200.
5. Gerar registros de execução.
6. Retornar o resultado do processamento.

Exemplo de retorno:

```json
{
  "pedidoId": "P-001",
  "status": "processado",
  "desconto": "0%",
  "totalFinal": 150.0
}
```

Eventos inválidos devem produzir erros claramente identificáveis.

A lógica utilizada na simulação e na Lambda real deve seguir as mesmas regras, permitindo comparar os resultados.

## 7. Interface e experiência visual

Construir uma interface moderna, minimalista e com aparência de ferramenta técnica de demonstração.

Priorizar:

- Clareza e legibilidade durante a projeção em sala de aula.
- Organização em painéis.
- Hierarquia visual bem definida.
- Estados de execução facilmente identificáveis.
- Boa apresentação dos objetos JSON.
- Feedback visual imediato após interações.
- Layout responsivo.

A tela principal deve permitir que o público compreenda o fluxo sem precisar navegar entre várias páginas.

Evitar excesso de elementos decorativos, animações desnecessárias e interfaces complexas.

A navegação deve ser simples, favorecendo o uso durante uma apresentação ao vivo.

## 8. Arquitetura de implementação

Separar as responsabilidades em:

**Frontend**
- Componentes de interface.
- Formulário de pedidos.
- Editor de eventos.
- Visualização do fluxo.
- Painel de resultados.
- Histórico de execuções.

**Domínio**
- Tipos de evento.
- Validação dos dados.
- Regras de processamento.
- Contratos de entrada e saída.

**Serviços**
- Serviço de simulação.
- Serviço de execução real.
- Gerenciamento de estados de processamento.

**Backend**
- API para execução.
- Integração com AWS SDK.
- Tratamento de erros.
- Configuração de ambiente.

Criar uma estrutura suficientemente organizada para manutenção, evitando complexidade arquitetural desproporcional ao MVP.

## 9. Integração com AWS

A integração deverá utilizar variáveis de ambiente para configurar a região e o nome ou ARN da função Lambda.

O backend deve utilizar a cadeia padrão de credenciais da AWS, compatível com perfis locais e roles IAM.

Expor um endpoint para solicitar a execução de eventos, com validação de entrada e tratamento adequado dos erros retornados pelo Lambda.

A API não deve permitir que o usuário escolha arbitrariamente qualquer função Lambda para invocação.

Não disponibilizar credenciais ou permissões administrativas no navegador.

Considerar medidas de segurança e controle de acesso caso a aplicação seja publicada na internet.

## 10. Possível evolução — SQS

Após concluir o MVP, considerar uma segunda modalidade de integração utilizando Amazon SQS.

Fluxo:

Aplicação Web → Backend → SQS → AWS Lambda

A aplicação enviaria a mensagem para uma fila e a função Lambda seria acionada automaticamente pelo mecanismo de integração entre SQS e Lambda.

Nesse cenário, demonstrar a diferença entre:

- Enviar um evento para processamento.
- Aguardar uma resposta síncrona.
- Publicar uma mensagem e processá-la de maneira assíncrona.

Essa evolução é opcional e não deve impedir a entrega do MVP.

## 11. Critérios de aceitação

A primeira versão estará concluída quando:

- For possível selecionar um dos três cenários.
- O usuário puder visualizar e editar o JSON.
- O modo de simulação executar corretamente a lógica.
- O fluxo visual reagir ao processamento.
- A aplicação exibir resultados e erros.
- O histórico de execuções funcionar.
- A interface distinguir claramente simulação e execução real.
- O backend permitir invocar uma função Lambda configurada.
- Existirem instruções para configurar e executar o projeto localmente.

## 12. Estratégia de desenvolvimento

Implementar de forma incremental.

**Etapa 1 — MVP visual e simulação**

Criar a aplicação React, os componentes, os cenários, o processamento local e a visualização dos resultados.

**Etapa 2 — Integração real**

Criar o backend, a integração com AWS Lambda e os mecanismos de tratamento de erros.

**Etapa 3 — Refinamentos**

Aprimorar a experiência da demonstração, revisar responsividade e preparar instruções para apresentação.

**Etapa 4 — Opcional**

Adicionar a integração assíncrona com SQS.

## 13. Orientações para o agente

Antes de implementar:

1. Inspecione a estrutura existente do repositório.
2. Reutilize componentes, estilos e dependências já disponíveis.
3. Defina uma estratégia de implementação enxuta.
4. Priorize o fluxo principal antes de adicionar funcionalidades secundárias.
5. Mantenha o código organizado, tipado e legível.
6. Não introduza funcionalidades fora do escopo sem necessidade.
7. Documente a configuração da função Lambda e das variáveis de ambiente.
8. Crie testes para os cenários de processamento e validação.

O produto final deve ser um **laboratório didático de AWS Lambda**, e não uma plataforma completa de gerenciamento de infraestrutura AWS.

A prioridade é proporcionar uma demonstração simples, confiável, visualmente clara e tecnicamente correta para um seminário universitário.
