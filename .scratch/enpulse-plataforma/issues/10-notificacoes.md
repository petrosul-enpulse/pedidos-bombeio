# 10: Cliente recebe avisos recuperáveis

**What to build:** Cliente recebe aviso de pedido, decisão e ajuste conforme sua configuração; a operação vê falhas de entrega e pode recuperar o envio sem repetir a transição.

**Blocked by:** 08: Gestor confirma ou recusa sem ajuste; 09: Enpulse trata ajuste de volume com cliente; decisão Definir retenção, notificações e exportação.

**Status:** planned

- [ ] Outbox idempotente registra tentativas e permite nova entrega após falha do provedor.
- [ ] Dados privados são enviados apenas a destinatários autorizados; resultado permanece visível no portal se e-mail falhar.
