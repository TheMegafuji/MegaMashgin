# Roteiro de vídeo — Megafuji Checkout

**Duração: 5 a 6 minutos.** Grave em blocos curtos; não precisa acertar tudo de uma vez.

**Mensagem central:** uma compra confiável, uma arquitetura compreensível e resultados verificáveis.

## Antes de apertar REC

- Abra o checkout, o jogo, o README e a árvore de `src` em abas separadas.
- Use zoom que deixe texto e recibos legíveis. Feche abas e notificações pessoais.
- Teste a captura de áudio do computador com **Sound settings → Test sound**.
- Deixe o jogo em **Live checkout API**, usando `https://api.megamashgin.top`.
- Ative **Show HTTP status, latency and purchase trace** no jogo.
- Faça uma compra de ensaio. O checkout público apresentou 403 na criação de visitante; grave o fluxo público apenas depois da correção e verificação.
- As mudanças de interface deste trabalho estão nos commits locais, sem push. Para mostrá-las antes da publicação, use a versão local e diga isso na gravação.

**Não exiba `.env`, chaves SSH, cookies ou cabeçalhos Authorization.** Para mostrar chamadas, use o painel sanitizado do jogo.

## 0:00–0:25 — O problema que você resolveu

**Na tela:** primeira dobra do checkout. Comece com o produto, sem abrir código.

**Fala sugerida:**

> “O desafio era criar um checkout para alguém usando um tablet sozinho. Eu organizei a solução em torno de três perguntas: a pessoa consegue comprar sem ajuda? O pedido fica salvo corretamente? E o que acontece se a conexão cair?”

**Ideia que deve ficar:** você entendeu o contexto de uso.

## 0:25–1:15 — Uma compra completa

**Na tela:** adicione dois produtos, altere uma quantidade, revise, escolha pagamento fictício e confirme. Mostre o recibo.

**Fala sugerida:**

> “O menu vem da API. O cliente monta o carrinho, mas o servidor define os preços e calcula o total. O recibo só aparece depois que o pedido foi confirmado no banco. O pagamento é fictício, como o enunciado permite; não coletamos número de cartão.”

**Enquanto navega, acrescente apenas uma frase:**

> “Também cuidei do feedback: som ajustável, movimento opcional e botões que permanecem parados para facilitar o toque.”

**Ideia que deve ficar:** o fluxo fecha de verdade; não termina apenas numa animação de sucesso.

## 1:15–1:55 — O diferencial de confiabilidade

**Na tela:** abra o registro de recuperação ou um trecho previamente gravado do teste. Destaque “sameIntentOnRetry”, um único recibo e “gamePaid: 1”.

**Fala sugerida:**

> “Uma resposta perdida não significa que a compra falhou. O servidor pode ter salvo o pedido e a resposta não ter chegado. Por isso, guardamos a intenção antes de enviar e repetimos exatamente a mesma tentativa para recuperar o recibo. O teste perdeu uma resposta depois da confirmação, recarregou o jogo e recuperou o mesmo pedido, sem contar outra venda.”

**Se perguntarem sobre duplicação:**

> “A repetição do mesmo pedido retorna o recibo original. Conteúdo diferente usando a mesma chave recebe conflito.”

**Referência:** [prova de recuperação](evidence/live-game/recovery/connected.json).

**Não improvise uma queda de internet durante a gravação.** Para reproduzir precisamente o caso, use o teste preparado: ele recebe a resposta real antes de interromper a entrega ao navegador.

## 1:55–2:45 — O jogo como outro cliente da mesma API

**Na tela:** mostre o convite animado e abra o jogo. Mostre o modo conectado e o painel de chamadas, depois um recibo confirmado.

**Fala sugerida:**

> “O jogo não é necessário para comprar. Ele é outro cliente da mesma API e torna o fluxo visível: cada venda no modo conectado precisa de um recibo real. Eu conferi 35 compras do jogo; todas puderam ser consultadas novamente, e o saldo de 76 dólares e 11 centavos correspondeu aos recibos.”

**Uma frase para evitar confusão:**

> “O jogo também tem um modo offline. E acelerar os personagens não mede a velocidade da API; para isso, fiz uma medição separada.”

**Ideia que deve ficar:** a integração funciona além da interface principal e pode ser inspecionada.

## 2:45–3:35 — A prova de fluxo

**Na tela:** tabela do README. Destaque somente quantidade, duração, erros e p95. Não passe por centenas de IDs.

**Fala sugerida:**

> “Contra a API pública, um medidor separado ofereceu 1.280 compras em 60 segundos. Todas foram confirmadas, sem erros ou recibos duplicados. Isso exigiu 2.560 requisições de escrita, porque cada compra cria uma sessão e depois o pedido.”

> “O p95 ficou em aproximadamente 99 milissegundos para as duas operações juntas. Em outras palavras, 95% das compras confirmadas terminaram em até aproximadamente esse tempo. Depois, todos os 1.280 recibos foram consultados novamente e corresponderam aos originais.”

**Feche com o limite da evidência:**

> “Isso mostra que a arquitetura foi suficiente para esse fluxo medido. É uma amostra curta; não estou apresentando capacidade máxima nem alta disponibilidade.”

**Referência:** [método, resultados e limites](evidence/live-game/README.md).

## 3:35–4:20 — Por que essa arquitetura

**Na tela:** expanda apenas estas pastas:

```text
src/client/features/     catálogo, checkout e histórico
src/server/http/         rotas e proteção das requisições
src/server/modules/      regras de cada funcionalidade
src/server/infrastructure/  conexão e transações no banco
src/shared/              contratos compartilhados
```

**Fala sugerida:**

> “Escolhi uma aplicação modular porque o domínio tem uma transação principal. Separei as responsabilidades para ficar fácil localizar e testar uma mudança, sem adicionar vários serviços. As duas instâncias da API compartilham o PostgreSQL, que coordena a consistência das compras.”

> “A estrutura de pastas evoluiu quando catálogo, histórico e descoberta cresceram. A reorganização preservou os contratos e o comportamento do checkout.”

**Se houver tempo:** abra `src/server/modules/orders/orders.ts` e destaque somente a comparação da intenção e o cálculo de preços.

## 4:20–5:05 — Como você conduziu a IA

**Na tela:** `docs/ai/build-log.md` e o resumo das verificações. Evite ler o documento inteiro.

**Fala sugerida:**

> “Usei IA para implementar e revisar, mas defini regras verificáveis: preço pertence ao servidor, sucesso depende da gravação e uma tentativa incerta precisa ser recuperável. Registrei problemas encontrados e as correções. Por exemplo, uma animação movia a área de toque; a correção manteve o botão parado e animou apenas a imagem.”

> “A entrega atual passou por 15 testes unitários, 32 de integração com PostgreSQL e 22 cenários no navegador. Esses testes incluem falhas de rede, isolamento do histórico e o sinal de áudio.”

**Ideia que deve ficar:** você consegue explicar e verificar o código produzido.

## 5:05–5:30 — Encerramento

**Na tela:** checkout ou README com os links de execução e evidências.

**Fala sugerida:**

> “O principal resultado é uma compra que consigo demonstrar e explicar, inclusive quando a rede falha. O jogo amplia a demonstração, e a medição mostra o que essa API simples atendeu. Como próximo passo, eu priorizaria a troca de clientes em um tablet compartilhado e testes de uso com pessoas.”

Pare aqui. Não acrescente uma lista de todas as bibliotecas.

## Cola rápida: os quatro pontos de venda

| Ponto                             | Prova que você mostra                           |
| --------------------------------- | ----------------------------------------------- |
| Compra confiável                  | Recibo persistido e recuperação sem duplicação  |
| Backend simples, resultado medido | 1.280 compras em 60 segundos; p95 de 99 ms      |
| Integração real do jogo           | 35 compras e saldo correspondente aos recibos   |
| Engenharia explicável             | Módulos claros, decisões, correções e 69 testes |

## Se precisar cortar para 90 segundos

- **0–20 s:** contexto do tablet + compra normal.
- **20–40 s:** resposta perdida recupera o mesmo pedido.
- **40–65 s:** jogo conectado + 1.280 compras no teste separado.
- **65–90 s:** módulos, processo com IA e links para evidências.

## Perguntas que podem vir depois

**“Por que não microserviços?”**
“Não havia responsabilidades independentes que justificassem o custo operacional. Uma aplicação modular resolveu o escopo e o fluxo medido.”

**“Duas APIs significam alta disponibilidade?”**
“Não. Elas continuam no mesmo host e usam um único banco.”

**“O que falta para um tablet compartilhado?”**
“Um encerramento claro entre clientes. Hoje o histórico pertence ao navegador e precisa ser esquecido explicitamente.”

**“Esses pedidos foram conferidos diretamente por SQL?”**
“A amostra atual foi conferida por leitura autenticada de todos os recibos pela API. Só acrescentarei a afirmação de uma consulta SQL independente depois de executar essa consulta para os mesmos IDs.”
