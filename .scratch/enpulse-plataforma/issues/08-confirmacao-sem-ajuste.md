# 08: Gestor confirma ou recusa sem ajuste

**What to build:** Gestor autorizado confirma volumes iguais aos solicitados ou recusa com motivo, e cliente vê o resultado e o autor na linha do tempo.

**Blocked by:** 07: Operador assume análise com controle de concorrência; decisão Definir papéis, confirmação e SLA.

**Status:** planned

- [ ] Confirmação/recusa, evento e outbox são gravados na mesma transação com versão esperada.
- [ ] Cliente vê motivo público e status; comentários internos ficam restritos à Enpulse.
