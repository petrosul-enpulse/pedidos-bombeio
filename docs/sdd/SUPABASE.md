# Runbook do Supabase Enpulse

**Alvo autorizado originalmente:** projeto `pedido-bombeio`, referência `qzrwgxxltwzlkszozoca`. **Schema de domínio:** `enpulse_bombeio`. O namespace foi criado em 18/11/2026 pela migração `20261118000001_enpulse_bombeio_namespace.sql` via Management API e confirmado com 0 tabelas; `anon` e `authenticated` sem `USAGE`, `service_role` com `USAGE`. Em verificação posterior no mesmo dia, a organização continuou acessível, mas a lista de projetos veio vazia, `GET` do projeto retornou 404 e o host do projeto deixou de resolver no DNS. A causa não foi determinada; confirmar o estado remoto antes de prosseguir. Esta aplicação inicial via API não registrou automaticamente o arquivo no histórico da Supabase CLI. A migração é idempotente para reconciliação futura.

## Antes de uma mudança

1. Confirmar nome, referência, acesso e disponibilidade do projeto. A primeira verificação deve esclarecer a indisponibilidade registrada acima. Ler migrações locais e estado remoto de schema, grants, RLS, políticas, funções, índices e volume de dados afetado. Registrar contagens antes de backfill.
2. Identificar a especificação SDD que exige a mudança e desenhar SQL aditivo em `supabase/migrations/`. Incluir verificação e reversão na especificação.
3. Validar em projeto/branch de teste com dados sintéticos. Uma branch paga ou projeto adicional exige decisão de custo própria; nunca presumir que há ambiente isolado disponível.
4. Para tabela nova, criar com constraints e índices, ativar RLS e definir grants/policies antes de tornar o schema acessível pela Data API. Função `security definer`, se necessária, recebe `search_path` fixo, valida `auth.uid()` e papel no início e tem `EXECUTE` concedido apenas ao papel necessário.

## Exposição futura do schema

`enpulse_bombeio` está privado. Quando a primeira fatia autenticada estiver pronta:

1. Aplicar grants mínimos de `USAGE` no schema e de operação em cada objeto para `authenticated`; manter `anon` sem acesso. `service_role` é apenas administração.
2. Confirmar RLS em **todas** as tabelas expostas, políticas separadas por operação e testes com cliente A, cliente B, operador, gestor e anônimo. Funções e visões recebem auditoria equivalente.
3. Adicionar `enpulse_bombeio` em **Exposed schemas** nas configurações da Data API do projeto. Esta etapa é configuração de projeto, além da migração SQL. Validar leitura permitida e negação cruzada com JWTs de teste.
4. Configurar cliente Supabase do servidor para `.schema('enpulse_bombeio')` usando a sessão do usuário. Rotas de negócio não elevam para `service_role`.

## Aplicação e rastreabilidade

- Fonte de verdade de DDL: arquivos versionados em `supabase/migrations/`, aplicados em ordem e com resultado registrado. O arquivo inicial já foi aplicado pela Management API; antes do primeiro `db push`, reconciliar histórico local/remoto com a CLI para que ele não seja confundido com mudança nova.
- Se uma migração falhar, registrar erro sem segredo, verificar se houve efeito parcial e corrigir com nova migração; não editar migração já aplicada para fingir que o estado remoto mudou.
- Configuração de Auth (modelo de e-mail OTP, URLs permitidas, provedor corporativo, MFA) e **Exposed schemas** exigem checklist de configuração por ambiente; SQL sozinho não os define.
- `public.pedidos_bombeio` e `public.config_bombeio` continuam ativos até o corte. A aplicação não muda para o novo schema só porque ele existe.

## Consultas de verificação mínimas

```sql
select nspname,
       has_schema_privilege('anon', oid, 'USAGE') as anon_usage,
       has_schema_privilege('authenticated', oid, 'USAGE') as authenticated_usage,
       has_schema_privilege('service_role', oid, 'USAGE') as service_usage
from pg_namespace where nspname = 'enpulse_bombeio';

select tablename, rowsecurity
from pg_tables where schemaname = 'enpulse_bombeio' order by tablename;
```

Na migração de dados, comparar contagem por dia, CNPJ e produto entre origem e destino; amostrar protocolos e estados; testar reexecução sem duplicar registros. Antes do corte, registrar backup disponível, responsável, janela, método de retorno de tráfego e reconciliação dos pedidos criados durante uma reversão.

## Segurança operacional

PAT e secret key ficam no cofre/conexão local, nunca em ticket, log, script ou `.env` versionado. Aprovação de mudanças de permissões e configuração de Auth segue a governança da Enpulse. Cada integrante usa identidade própria; acesso de fornecedor é revogável e auditável.
