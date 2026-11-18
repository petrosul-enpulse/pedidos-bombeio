# 07: Falhas, proteção e observabilidade

**What to build:** O cliente consegue recuperar-se de falhas sem perder o pedido, enquanto a operação identifica problemas e bloqueia uso abusivo do canal.

**Blocked by:** 03: Verificação do código e sessão do cliente; 05: Revisão e envio confiável.

**Status:** ready-for-agent

- [ ] Falhas de rede, indisponibilidade do banco, sessão expirada e limite de tentativas têm mensagens e ações de recuperação próprias.
- [ ] Nenhuma falha limpa os volumes digitados antes de o cliente decidir recomeçar.
- [ ] Há limites de requisição para autenticação e envio; os logs permitem correlacionar falhas por identificador sem registrar códigos, tokens ou chaves.
- [ ] Os cenários de repetição, expiração e indisponibilidade são cobertos por testes de integração.
