# 03: Verificação do código e sessão do cliente

**What to build:** O cliente confirma o código recebido e ganha uma sessão temporária vinculada ao seu CNPJ para preencher e enviar pedidos.

**Blocked by:** 02: Solicitação de código por cliente cadastrado.

**Status:** ready-for-agent

- [ ] Código correto e dentro do prazo libera o formulário apenas para o CNPJ correspondente.
- [ ] Código incorreto, expirado ou usado recebe mensagem clara; tentativas repetidas são limitadas.
- [ ] A sessão usa cookie seguro e inacessível ao JavaScript do navegador, expira e pode ser encerrada.
- [ ] A API rejeita pedidos sem sessão válida e nunca aceita o CNPJ do corpo como prova de identidade.
