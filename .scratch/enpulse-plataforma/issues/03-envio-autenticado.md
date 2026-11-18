# 03: Cliente envia pedido autenticado e recebe comprovante

**What to build:** Cliente autorizado revisa produtos e volumes, envia com uma chave de tentativa e recebe protocolo, prazo oficial e comprovante persistido no novo schema.

**Blocked by:** 01: Cliente entra e vê seu espaço.

**Status:** planned

- [ ] Cliente é derivado da sessão; validação e persistência gravam pedido, itens e evento de forma atômica.
- [ ] Duplo envio retorna o mesmo protocolo; valores inválidos não criam pedido; antes/no/depois do corte produzem o resultado esperado.
