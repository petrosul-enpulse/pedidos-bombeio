-- Namespace da futura plataforma de bombeio. A migração dos dados de public
-- será feita em etapa própria, após validação das regras e das políticas.
begin;

create schema if not exists enpulse_bombeio;
comment on schema enpulse_bombeio is
  'Dados da plataforma de pedidos de bombeio da Enpulse';

-- O schema começa privado. Cada papel recebe apenas os privilégios exigidos
-- pelas migrações de uma funcionalidade já protegida por RLS.
revoke all on schema enpulse_bombeio from public, anon, authenticated;
grant usage on schema enpulse_bombeio to service_role;

commit;
