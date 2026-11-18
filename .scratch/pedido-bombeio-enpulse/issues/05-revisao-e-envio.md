# 05: Revisão e envio confiável

**What to build:** O cliente revisa CNPJ, data, prazo e volumes antes de confirmar. O pedido é gravado uma vez, com data e situação do prazo decididas pelo banco.

**Blocked by:** 03: Verificação do código e sessão do cliente; 04: Entrada de volumes clara e responsiva.

**Status:** ready-for-agent

- [ ] A revisão mostra todos os produtos e valores, inclusive zeros, com unidade e significado de D+1.
- [ ] O aviso de envio após o corte permanece visível, mas não impede o pedido.
- [ ] A API valida sessão e valores novamente; a data, a hora e o indicador de prazo retornam do banco.
- [ ] Repetir a mesma tentativa por duplo clique ou falha de rede retorna o mesmo pedido; iniciar um novo pedido gera uma nova linha no histórico.
