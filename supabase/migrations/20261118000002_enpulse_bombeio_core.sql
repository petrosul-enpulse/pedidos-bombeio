-- Base aditiva da plataforma. Nenhum objeto legado em public é alterado.
begin;

create schema if not exists enpulse_bombeio;
revoke all on schema enpulse_bombeio from public, anon, authenticated;
grant usage on schema enpulse_bombeio to authenticated, service_role;

create table enpulse_bombeio.bases (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  fuso text not null default 'America/Sao_Paulo',
  ativo boolean not null default true
);

create table enpulse_bombeio.clientes (
  id uuid primary key default gen_random_uuid(),
  cnpj text not null unique check (cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$'),
  razao_social text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table enpulse_bombeio.clientes_bases (
  cliente_id uuid not null references enpulse_bombeio.clientes(id),
  base_id uuid not null references enpulse_bombeio.bases(id),
  ativo boolean not null default true,
  primary key (cliente_id, base_id)
);

create table enpulse_bombeio.usuarios_cliente (
  user_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid not null references enpulse_bombeio.clientes(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  primary key (user_id, cliente_id)
);
create index usuarios_cliente_cliente_id_idx on enpulse_bombeio.usuarios_cliente(cliente_id);

create table enpulse_bombeio.usuarios_enpulse (
  user_id uuid primary key references auth.users(id) on delete cascade,
  papel text not null check (papel in ('leitura', 'operador', 'gestor', 'administrador')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table enpulse_bombeio.acessos_base (
  user_id uuid not null references enpulse_bombeio.usuarios_enpulse(user_id) on delete cascade,
  base_id uuid not null references enpulse_bombeio.bases(id),
  ativo boolean not null default true,
  primary key (user_id, base_id)
);

create table enpulse_bombeio.produtos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  unidade text not null default 'm³',
  ordem integer not null,
  ativo boolean not null default true,
  limite_m3 numeric(12,3) not null default 999999.999 check (limite_m3 > 0)
);

create table enpulse_bombeio.regras_operacionais (
  id uuid primary key default gen_random_uuid(),
  base_id uuid not null references enpulse_bombeio.bases(id),
  vigencia_desde date not null,
  horario_corte time not null,
  criado_em timestamptz not null default now(),
  unique (base_id, vigencia_desde)
);

create table enpulse_bombeio.pedidos (
  id uuid primary key default gen_random_uuid(),
  protocolo text not null unique,
  cliente_id uuid not null references enpulse_bombeio.clientes(id),
  base_id uuid not null references enpulse_bombeio.bases(id),
  data_operacional date not null,
  status text not null default 'recebido' check (status in ('recebido', 'em_analise', 'confirmado', 'recusado', 'substituido')),
  enviado_em timestamptz not null default now(),
  dentro_prazo boolean not null,
  corte_aplicado time not null,
  fuso_aplicado text not null,
  regra_id uuid not null references enpulse_bombeio.regras_operacionais(id),
  -- null apenas para importação rastreada do legado, que não tinha usuário autenticado.
  autor_id uuid references auth.users(id),
  chave_idempotencia uuid not null,
  payload_hash text not null,
  pedido_substituido_id uuid references enpulse_bombeio.pedidos(id),
  versao integer not null default 1 check (versao > 0),
  atualizado_em timestamptz not null default now(),
  unique (autor_id, chave_idempotencia)
);
create index pedidos_fila_idx on enpulse_bombeio.pedidos(base_id, data_operacional, status, enviado_em desc);
create index pedidos_cliente_idx on enpulse_bombeio.pedidos(cliente_id, data_operacional desc);
create unique index pedidos_um_reenvio_por_origem_idx on enpulse_bombeio.pedidos(pedido_substituido_id)
  where pedido_substituido_id is not null;

create table enpulse_bombeio.pedido_itens (
  pedido_id uuid not null references enpulse_bombeio.pedidos(id) on delete cascade,
  produto_id uuid not null references enpulse_bombeio.produtos(id),
  produto_codigo text not null,
  produto_nome text not null,
  unidade text not null,
  volume_solicitado numeric(12,3) not null check (volume_solicitado >= 0),
  previsao_venda_d1 numeric(12,3) not null check (previsao_venda_d1 >= 0),
  volume_confirmado numeric(12,3) check (volume_confirmado >= 0),
  motivo_ajuste text,
  primary key (pedido_id, produto_id),
  check (volume_confirmado is null or volume_confirmado = volume_solicitado or nullif(btrim(motivo_ajuste), '') is not null)
);

create table enpulse_bombeio.pedido_eventos (
  id bigint generated always as identity primary key,
  pedido_id uuid not null references enpulse_bombeio.pedidos(id),
  tipo text not null,
  ator_id uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  publico boolean not null default true,
  dados jsonb not null default '{}'::jsonb
);
create index pedido_eventos_pedido_idx on enpulse_bombeio.pedido_eventos(pedido_id, criado_em);

create table enpulse_bombeio.notificacoes_outbox (
  id bigint generated always as identity primary key,
  evento_id bigint not null references enpulse_bombeio.pedido_eventos(id),
  destinatario text not null,
  modelo text not null,
  estado text not null default 'pendente' check (estado in ('pendente', 'enviada', 'falha')),
  tentativas integer not null default 0 check (tentativas >= 0),
  proximo_envio_em timestamptz not null default now(),
  unique (evento_id, destinatario, modelo)
);

create table enpulse_bombeio.migracao_legado (
  origem text not null,
  id_antigo bigint not null,
  pedido_id uuid not null unique references enpulse_bombeio.pedidos(id),
  importado_em timestamptz not null default now(),
  primary key (origem, id_antigo)
);

insert into enpulse_bombeio.bases(codigo, nome, fuso)
values ('PAULINIA', 'Base Paulínia', 'America/Sao_Paulo')
on conflict (codigo) do nothing;

insert into enpulse_bombeio.produtos(codigo, nome, ordem)
values ('GAS_A', 'Gasolina A', 10), ('S500_A', 'Diesel S500 A', 20), ('S10_A', 'Diesel S10 A', 30)
on conflict (codigo) do nothing;

insert into enpulse_bombeio.regras_operacionais(base_id, vigencia_desde, horario_corte)
select id, date '2020-01-01', time '12:00' from enpulse_bombeio.bases where codigo = 'PAULINIA'
on conflict (base_id, vigencia_desde) do nothing;

create function enpulse_bombeio.papel_na_base(p_base_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select ue.papel
  from enpulse_bombeio.usuarios_enpulse ue
  where ue.user_id = (select auth.uid()) and ue.ativo
    and (ue.papel = 'administrador' or exists (
      select 1 from enpulse_bombeio.acessos_base ab
      where ab.user_id = ue.user_id and ab.base_id = p_base_id and ab.ativo
    ))
  limit 1;
$$;

create function enpulse_bombeio.cliente_autorizado(p_cliente_id uuid, p_base_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from enpulse_bombeio.usuarios_cliente uc
    join enpulse_bombeio.clientes c on c.id = uc.cliente_id and c.ativo
    join enpulse_bombeio.clientes_bases cb on cb.cliente_id = c.id and cb.ativo
    join enpulse_bombeio.bases b on b.id = cb.base_id and b.ativo
    where uc.user_id = (select auth.uid()) and uc.ativo
      and uc.cliente_id = p_cliente_id and cb.base_id = p_base_id
  );
$$;

revoke execute on function enpulse_bombeio.papel_na_base(uuid) from public, anon;
revoke execute on function enpulse_bombeio.cliente_autorizado(uuid, uuid) from public, anon;
grant execute on function enpulse_bombeio.papel_na_base(uuid) to authenticated;
grant execute on function enpulse_bombeio.cliente_autorizado(uuid, uuid) to authenticated;

alter table enpulse_bombeio.bases enable row level security;
alter table enpulse_bombeio.clientes enable row level security;
alter table enpulse_bombeio.clientes_bases enable row level security;
alter table enpulse_bombeio.usuarios_cliente enable row level security;
alter table enpulse_bombeio.usuarios_enpulse enable row level security;
alter table enpulse_bombeio.acessos_base enable row level security;
alter table enpulse_bombeio.produtos enable row level security;
alter table enpulse_bombeio.regras_operacionais enable row level security;
alter table enpulse_bombeio.pedidos enable row level security;
alter table enpulse_bombeio.pedido_itens enable row level security;
alter table enpulse_bombeio.pedido_eventos enable row level security;
alter table enpulse_bombeio.notificacoes_outbox enable row level security;
alter table enpulse_bombeio.migracao_legado enable row level security;

create policy usuarios_cliente_proprios on enpulse_bombeio.usuarios_cliente
  for select to authenticated using (user_id = (select auth.uid()) and ativo);
create policy usuarios_enpulse_proprio on enpulse_bombeio.usuarios_enpulse
  for select to authenticated using (user_id = (select auth.uid()) and ativo);
create policy acessos_base_proprios on enpulse_bombeio.acessos_base
  for select to authenticated using (user_id = (select auth.uid()) and ativo);
create policy clientes_visiveis on enpulse_bombeio.clientes
  for select to authenticated using (
    exists (select 1 from enpulse_bombeio.usuarios_cliente uc where uc.cliente_id = id and uc.user_id = (select auth.uid()) and uc.ativo)
    or exists (select 1 from enpulse_bombeio.clientes_bases cb
      where cb.cliente_id = id and cb.ativo and enpulse_bombeio.papel_na_base(cb.base_id) is not null)
  );
create policy clientes_bases_visiveis on enpulse_bombeio.clientes_bases
  for select to authenticated using (
    enpulse_bombeio.cliente_autorizado(cliente_id, base_id)
    or enpulse_bombeio.papel_na_base(base_id) is not null
  );
create policy bases_visiveis on enpulse_bombeio.bases
  for select to authenticated using (
    exists (select 1 from enpulse_bombeio.clientes_bases cb where cb.base_id = id and cb.ativo
      and exists (select 1 from enpulse_bombeio.usuarios_cliente uc where uc.cliente_id = cb.cliente_id and uc.user_id = (select auth.uid()) and uc.ativo))
    or enpulse_bombeio.papel_na_base(id) is not null
  );
create policy produtos_visiveis on enpulse_bombeio.produtos
  for select to authenticated using (ativo);
create policy regras_visiveis on enpulse_bombeio.regras_operacionais
  for select to authenticated using (
    exists (select 1 from enpulse_bombeio.bases b where b.id = base_id)
  );
create policy pedidos_visiveis on enpulse_bombeio.pedidos
  for select to authenticated using (
    enpulse_bombeio.cliente_autorizado(cliente_id, base_id)
    or enpulse_bombeio.papel_na_base(base_id) is not null
  );
create policy itens_visiveis on enpulse_bombeio.pedido_itens
  for select to authenticated using (
    exists (select 1 from enpulse_bombeio.pedidos p where p.id = pedido_id)
  );
create policy eventos_visiveis on enpulse_bombeio.pedido_eventos
  for select to authenticated using (
    exists (select 1 from enpulse_bombeio.pedidos p where p.id = pedido_id
      and (publico or enpulse_bombeio.papel_na_base(p.base_id) is not null))
  );

grant select on enpulse_bombeio.bases, enpulse_bombeio.clientes,
  enpulse_bombeio.clientes_bases, enpulse_bombeio.usuarios_cliente,
  enpulse_bombeio.usuarios_enpulse, enpulse_bombeio.acessos_base,
  enpulse_bombeio.produtos, enpulse_bombeio.regras_operacionais,
  enpulse_bombeio.pedidos, enpulse_bombeio.pedido_itens,
  enpulse_bombeio.pedido_eventos to authenticated;

revoke all on enpulse_bombeio.notificacoes_outbox, enpulse_bombeio.migracao_legado from anon, authenticated;

commit;
