# 02: Solicitação de código por cliente cadastrado

**What to build:** O cliente informa seu CNPJ e solicita um código de uso único enviado ao e-mail corporativo cadastrado. O fluxo atende CNPJ numérico e alfanumérico e não revela se um CNPJ está cadastrado.

**Blocked by:** 01: Identidade Enpulse e prazo confiável.

**Status:** ready-for-agent

- [ ] O cadastro relaciona CNPJ, contato de e-mail e situação de acesso, com forma controlada de ativar ou desativar um cliente.
- [ ] Um CNPJ válido pode solicitar código; a resposta pública é neutra para CNPJ inexistente ou inativo.
- [ ] O código tem validade limitada, é armazenado de forma não reversível e possui limite de solicitações por cliente e origem.
- [ ] O envio de e-mail funciona com provedor configurado e pode ser verificado em ambiente de teste sem enviar mensagens a clientes reais.
