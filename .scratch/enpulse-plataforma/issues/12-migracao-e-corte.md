# 12: Histórico legado aparece no novo portal e tráfego é transferido

**What to build:** Pedidos do modelo `public` são importados sem duplicidade, aparecem com origem identificável, e o tráfego muda para os dois portais com plano de retorno.

**Blocked by:** 02: Administrador cadastra e revoga acesso de cliente; 06: Cliente reenvia sem apagar o pedido anterior; 10: Cliente recebe avisos recuperáveis; 11: Enpulse exporta dados com rastreabilidade.

**Status:** planned

- [ ] Contagens e somas por dia/produto conciliam, CNPJs sem cadastro são tratados e reexecução não duplica pedido.
- [ ] Backup, janela, responsável, observabilidade e reversão são exercitados; tabelas legadas permanecem consultáveis.
