# Ativação da plataforma Enpulse

**Estado em 18/11/2026:** código e migrações preparados localmente. Ainda não existe um projeto Supabase de destino. Nenhuma referência, URL ou chave de projeto está gravada no código.

## 1. Criar o projeto e aplicar o banco

1. Criar um projeto Supabase na organização Enpulse. Guardar a **project ref** exibida na URL do dashboard, a **Project URL** e a **publishable key**. A project ref entra apenas nos comandos de implantação; a aplicação usa URL e publishable key por ambiente.
2. No diretório do repositório, inicializar e autenticar a [Supabase CLI](https://supabase.com/docs/guides/local-development/database-migrations). O login deve ser feito no terminal seguro, sem enviar PAT pelo chat ou registrar a chave em arquivos versionados.
3. Vincular o projeto novo e aplicar as migrações em ordem:

```powershell
supabase init
supabase login
supabase link --project-ref <PROJECT_REF_DA_ENPULSE>
supabase db push --remote
```

As migrações criam apenas `enpulse_bombeio` e seus objetos; não alteram o legado `public`. O teste local `pnpm test` aplica a mesma sequência em PostgreSQL embarcado, com usuários sintéticos e verificações de isolamento. Antes da implantação real, conferir o plano de migração e a lista de alterações que a CLI apresenta.

## 2. Habilitar a Data API e o acesso por e-mail

No projeto Supabase, incluir `enpulse_bombeio` em **API Settings → Exposed schemas**, conforme a [documentação de schemas personalizados](https://supabase.com/docs/guides/api/using-custom-schemas). Os grants e as políticas RLS ficam nas migrações; `anon` não recebe acesso ao schema. Validar com JWTs de cliente A, cliente B, leitura e gestor antes de liberar usuários reais.

Em **Authentication**, configurar URL do site, provedor de e-mail e modelo de **Magic Link** com `{{ .Token }}` para enviar o código numérico mostrado na tela. O aplicativo usa `signInWithOtp` com `shouldCreateUser: false`; portanto, criar previamente cada usuário no Auth e vincular seu UUID no banco. Confira [OTP por e-mail](https://supabase.com/docs/guides/auth/auth-email-passwordless). Configurar limites de envio e expiração conforme a política da Enpulse.

Depois de criar os usuários no Auth, cadastrar os vínculos com UUIDs reais. Exemplo para um cliente piloto:

```sql
insert into enpulse_bombeio.clientes (cnpj, razao_social)
values ('<CNPJ_NORMALIZADO>', '<RAZAO_SOCIAL>')
returning id;

insert into enpulse_bombeio.clientes_bases (cliente_id, base_id)
select '<CLIENTE_UUID>'::uuid, id from enpulse_bombeio.bases where codigo = 'PAULINIA';

insert into enpulse_bombeio.usuarios_cliente (user_id, cliente_id)
values ('<AUTH_USER_UUID>'::uuid, '<CLIENTE_UUID>'::uuid);
```

Para um integrante Enpulse, vincular `auth.users.id` em `usuarios_enpulse` com papel `leitura`, `operador`, `gestor` ou `administrador`. Para os três primeiros, vincular as bases em `acessos_base`; o administrador tem escopo global. Cada pessoa deve usar uma identidade própria. Os valores de exemplo acima são placeholders, não dados para colar sem substituição.

## 3. Conectar a aplicação

Preencher `.env.local` no desenvolvimento e as variáveis de ambiente do projeto Vercel no ambiente correspondente:

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do projeto novo |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key do mesmo projeto |
| `SUPABASE_PLATFORM_SERVICE_ROLE_KEY` | Chave privada do projeto novo, apenas no trabalhador de notificações |
| `NOTIFICATION_WORKER_TOKEN` | Segredo aleatório com pelo menos 32 caracteres para chamar o trabalhador |
| `RESEND_API_KEY` | Chave do provedor de e-mail [Resend](https://resend.com/docs/api-reference/emails/send-email) |
| `ENPULSE_EMAIL_FROM` | Remetente de domínio verificado no provedor |
| `PLATFORM_PUBLIC_URL` | URL HTTPS pública do portal, usada nos links do e-mail |

Sem essas duas variáveis, `/acesso`, `/cliente` e `/operacao` exibem a tela de configuração pendente. O modelo legado em `/` usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` separadamente. **Não apontar variáveis legadas e novas para projetos diferentes sem conferir o fluxo em produção.** A nova API usa a sessão do usuário e as funções/RLS; ela não recebe service role.

Executar `pnpm test` e `pnpm run build`, testar as jornadas no projeto novo e só então configurar as variáveis no Vercel e liberar a branch para produção. A branch `main` pode acionar deploy automático.

O trabalhador `POST /api/internal/notificacoes` é separado das rotas de usuário e exige `Authorization: Bearer <NOTIFICATION_WORKER_TOKEN>`. Um agendador confiável deve chamá-lo na frequência operacional escolhida; a rotina reserva até 10 mensagens por chamada, usa chave de idempotência no Resend e agenda nova tentativa em falhas. Após 10 tentativas, a mensagem permanece em `falha` para investigação e reprocessamento controlado. O [Cron da Vercel no plano Hobby](https://vercel.com/i/event-driven-architecture) tem frequência diária, insuficiente para avisos próximos da confirmação. Escolher um agendador com frequência adequada antes de depender dos e-mails; a consulta no portal não depende deles.

## 4. Gates antes do corte

- Confirmar no banco as quatro migrações, RLS de todas as tabelas, grants e schema exposto.
- Entrar como dois clientes distintos: cada um vê somente seus pedidos. Repetir pedido com a mesma chave e reenviar intencionalmente.
- Entrar como leitura, operador e gestor: verificar fila, recusa de ação sem papel, conflito de versão, confirmação com ajuste e motivo público.
- Validar visualmente desktop e celular, confirmação do pedido no portal do cliente e comunicação operacional.
- Definir método final de entrada interno, regra de aprovação de ajuste e reenvio após análise. A implementação local assume OTP individual, confirmação direta pelo gestor com motivo e reenvio no mesmo dia até conclusão.
- Configurar o provedor e o agendador, validar entrega real, falha e nova tentativa do trabalhador; localmente a reserva da outbox é testada, mas nenhum e-mail real foi enviado.
- Validar exportação CSV com dados reais e limite de 1000 pedidos por data/base. Cada exportação é auditada no banco.
- Planejar e reconciliar a migração do legado, se houver pedidos no projeto antigo a preservar. A importação não é automática e não pode ser executada sem origem e destino reais.
- Revogar o PAT antigo que apareceu na saída do helper local e cadastrar um novo pelo fluxo seguro antes de voltar a usar a conexão customizada.

O novo portal não é publicado automaticamente pela existência das migrações. Seu destino é configurável e a ativação exige projeto Supabase, usuários reais e validação em ambiente alvo.
