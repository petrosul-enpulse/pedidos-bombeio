# 01 — Identidade e acesso aos dois portais

**Estado:** proposta; método de login interno pendente de decisão.
**Atores:** usuário do cliente, integrante Enpulse, administrador.
**Dependências:** cadastro inicial de clientes e de integrantes; configuração de e-mail/SSO por ambiente.

## Resultado

Cada pessoa entra com identidade própria e recebe somente os clientes, bases e operações associados a vínculos ativos. CNPJ é identificação da empresa, não credencial.

## Cenários de aceite

1. Dado um e-mail vinculado ao cliente A, quando seu OTP é validado, então a sessão apresenta apenas A e seus pedidos.
2. Dado um usuário vinculado a A e B, quando escolhe B, então o contexto exibido e o pedido enviado pertencem a B; a troca exige ação explícita.
3. Dado um e-mail desconhecido ou inativo, quando solicita código, então a resposta pública é indistinguível da resposta a um e-mail válido e nenhum acesso é concedido.
4. Dado código incorreto, usado ou expirado, quando tenta verificar, então o acesso falha com recuperação clara e limites de tentativa.
5. Dado integrante com papel de leitura, quando tenta confirmar pedido por URL direta, então recebe `403` e nenhum evento é criado.
6. Dado usuário removido do vínculo, quando tenta nova operação com sessão antiga, então o servidor o bloqueia.

## Invariantes e contratos

- O vínculo autorizado é lido do banco em toda operação sensível; cliente e papel não são inferidos de `user_metadata` ou CNPJ do corpo.
- OTP de cliente usa Supabase Auth, `shouldCreateUser: false`, envio limitado e modelo de e-mail configurado; aplicativo não armazena código próprio.
- Sessão SSR em cookie, com fluxo PKCE e renovação adequada à versão de Next.js em uso. Conteúdo autenticado não usa cache compartilhado.
- Usuários Enpulse têm papel e bases autorizadas em cadastro separado; método de entrada fica atrás da mesma interface de sessão.
- Revogação de vínculo tem evento de auditoria com administrador e data, sem expor segredo.

## Dados e autorização

`clientes`, `usuarios_cliente` e `usuarios_enpulse` no schema `enpulse_bombeio`, com referências a `auth.users`. Uma política de cliente deve usar `auth.uid()` e o vínculo ativo. Papel Enpulse só abre pedidos das bases autorizadas. Não há grant de negócio para `anon`.

## Experiência

Portais `/cliente` e `/operacao` com entrada e navegação próprias, mas tokens visuais compartilhados. Acesso apresenta ajuda para e-mail, reenvio com espera visível, erro de expiração e saída; a interface não revela se o contato existe. No celular, o teclado numérico abre para OTP e o foco avança de forma previsível.

## Observabilidade e reversão

Contar solicitações, verificações falhas, bloqueios e revogações por identificadores não sensíveis. A migração para autenticação não remove o formulário legado até que clientes piloto estejam cadastrados e testados. O corte desativa o endpoint anônimo; retorno ao legado exige avaliação explícita do risco de acesso.

## Decisões pendentes

- Enpulse ainda não definiu se o portal interno usa SSO corporativo ou convite com e-mail/MFA. Dono: TI Enpulse.
- Lista inicial de clientes, contatos e bases autorizadas. Dono: operação Enpulse.
