# 06: Cliente reenvia sem apagar o pedido anterior

**What to build:** Cliente inicia um reenvio deliberado, recebe novo protocolo e vê a relação entre versões; a fila identifica o pedido vigente.

**Blocked by:** 04: Cliente acompanha pedidos e histórico; 05: Integrante Enpulse entra e acompanha a fila; decisão Definir reenvio e pedido vigente.

**Status:** planned

- [ ] Regra de elegibilidade para reenvio é aplicada no servidor e refletida nos dois portais.
- [ ] Pedido anterior e seus eventos continuam auditáveis; tentativa duplicada não cria duas versões.
