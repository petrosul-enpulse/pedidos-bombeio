# 01: Cliente entra e vê seu espaço

**What to build:** Um usuário cadastrado entra por código de e-mail, identifica seu cliente e vê uma página inicial sem pedidos; não consegue acessar o espaço de outra empresa.

**Blocked by:** Disponibilidade e referência do projeto Supabase confirmadas; ver runbook em `docs/sdd/SUPABASE.md`.

**Status:** planned

- [ ] Cadastro/vínculo, sessão, página inicial e RLS funcionam juntos para cliente A e negam cliente B/anônimo.
- [ ] OTP expirado, vínculo revogado e ausência de pedidos têm respostas compreensíveis; segredos não aparecem em logs.
