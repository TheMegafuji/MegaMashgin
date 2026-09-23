# Como apresentar o projeto

## A frase principal

> Construí um checkout pequeno, com regras de compra confiáveis. O jogo é outro
> cliente da mesma API: as vendas no modo conectado geram pedidos reais no banco
> da demonstração, com pagamento fictício.

## A prova que você pode mostrar

- Jogo publicado: 35 recibos únicos; o saldo de $76,11 bateu com os recibos.
- Resposta perdida: recuperamos o mesmo pedido após recarregar; uma venda apenas.
- Medidor separado: 1.280 compras em 60 segundos, sem erros ou duplicações.
- Isso exigiu 2.560 POSTs: sessão + pedido. Aproximadamente 42,6 requisições/s.
- 95% das compras confirmadas levaram até aproximadamente 99 ms, contando sessão + pedido.
- Todos os 1.280 recibos foram consultados novamente e corresponderam aos originais.

[Resultados completos e limites](evidence/live-game/README.md).

## Como falar de arquitetura

> Mantive uma única aplicação modular. Separei interface, contratos, HTTP,
> regras de negócio e acesso ao banco. Dentro da interface, organizei catálogo,
> checkout e histórico. Assim fica fácil localizar uma mudança sem introduzir
> vários serviços para um domínio pequeno.

> O PostgreSQL coordena as compras entre duas instâncias da API. A consistência
> não depende da memória de um processo. A medição mostra que essa estrutura
> simples foi suficiente para o fluxo testado.

## Roteiro de três minutos

1. Faça uma compra normal no checkout.
2. Abra o jogo e selecione Settings → Live checkout API; ative o purchase trace.
3. Mostre status HTTP, recibo e instância da API. No modo Offline não há essa prova.
4. Abra a tabela do teste: taxa, duração, erros, latência e leitura dos recibos.
5. Mostre a transação de pedidos e a divisão das pastas.

## Evite prometer demais

Diga **“atendeu 1.280 compras em uma amostra de 60 segundos”**.
Não diga “aguenta qualquer carga”, “milhões de usuários” ou “alta disponibilidade”.

Diga **“jogo e medidor exercitam a mesma API”**.
Não diga que acelerar a animação mede requisições por segundo.

Diga **“todos os recibos foram relidos pela API”**.
Uma conferência SQL independente só pode ser anunciada depois de executada para
os mesmos IDs. O registro SQL histórico não serve como prova dessa nova amostra.

## Som e movimento

O áudio anterior era muito baixo. Agora há volume ajustável, prévia e testes que
medem sinal real no navegador. A percepção nos alto-falantes ainda depende do
volume do sistema, da aba e do dispositivo escolhido.

As ilustrações flutuam, os itens quentes têm vapor, a seleção responde ao toque e
o convite do jogo tem uma pequena loja animada. Botões ficam parados. Preferência
de movimento reduzido e o botão de pausa continuam respeitados.
