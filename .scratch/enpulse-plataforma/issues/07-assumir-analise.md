# 07: Operador assume análise com controle de concorrência

**What to build:** Operador autorizado assume pedido recebido, vê o responsável na fila e deixa evento; conflito de versão oferece atualização em vez de sobrescrever colega.

**Blocked by:** 05: Integrante Enpulse entra e acompanha a fila; decisão Definir papéis, confirmação e SLA.

**Status:** planned

- [ ] Transição, versão e evento são atômicos; pedidos substituídos ou já concluídos não são assumidos.
- [ ] Papel de leitura e operador fora do escopo recebem negação; conflito simultâneo retorna estado atual.
