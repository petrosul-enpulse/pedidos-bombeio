-- =====================================================================
-- Pedido de Bombeio - Base Paulínia (MVP legado em public)
-- Nova plataforma: ver supabase/migrations/ e docs/plataforma/PLANO.md.
-- Rodar no Supabase: SQL Editor > New query > colar tudo > Run
-- =====================================================================

-- 1) Parâmetros do processo (alterar horário de corte sem novo deploy)
create table if not exists public.config_bombeio (
  id            smallint primary key default 1 check (id = 1),
  horario_corte time not null default '12:00',   -- BPMN: cliente envia até 12h
  fuso          text not null default 'America/Sao_Paulo'
);
insert into public.config_bombeio (id) values (1) on conflict (id) do nothing;

-- 2) Pedidos (1 linha por envio; reenvio no mesmo dia gera nova linha = trilha de auditoria)
create table if not exists public.pedidos_bombeio (
  id                     bigint generated always as identity primary key,
  criado_em              timestamptz not null default now(),       -- data/hora do envio (gravada em UTC, exibida no fuso)
  data_pedido            date        not null,                     -- dia do pedido em Brasília (preenchido por trigger)
  hora_envio_local       time        not null,                     -- hora do envio em Brasília (trigger)
  dentro_prazo           boolean     not null,                     -- enviado antes do corte das 12h (trigger)
  cnpj                   char(14)    not null check (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$'), -- sem máscara

  -- quantidades em m³
  gas_a_bombeio          numeric(12,3) not null default 0 check (gas_a_bombeio  >= 0),
  gas_a_previsao_venda   numeric(12,3) not null default 0 check (gas_a_previsao_venda  >= 0),
  s500_a_bombeio         numeric(12,3) not null default 0 check (s500_a_bombeio >= 0),
  s500_a_previsao_venda  numeric(12,3) not null default 0 check (s500_a_previsao_venda >= 0),
  s10_a_bombeio          numeric(12,3) not null default 0 check (s10_a_bombeio  >= 0),
  s10_a_previsao_venda   numeric(12,3) not null default 0 check (s10_a_previsao_venda  >= 0),

  -- próximos passos do BPMN (base ajusta / confirma); já deixa o campo pronto
  status                 text not null default 'recebido'
                         check (status in ('recebido','em_analise','ajustado','confirmado','recusado')),
  origem                 text not null default 'formulario_web',
  user_agent             text
);

create index if not exists ix_pedidos_bombeio_data_cnpj
  on public.pedidos_bombeio (data_pedido, cnpj, criado_em desc);

-- 3) Trigger: carimba data/hora de Brasília e o flag de prazo NO SERVIDOR DO BANCO
--    (não confia no relógio do navegador nem no da aplicação)
create or replace function public.fn_pedidos_bombeio_prazo()
returns trigger language plpgsql as $$
declare
  v_corte time;
  v_fuso  text;
  v_local timestamp;
begin
  select horario_corte, fuso into v_corte, v_fuso from public.config_bombeio where id = 1;
  v_corte := coalesce(v_corte, '12:00');
  v_fuso  := coalesce(v_fuso, 'America/Sao_Paulo');

  new.criado_em        := clock_timestamp();
  v_local              := new.criado_em at time zone v_fuso;
  new.data_pedido      := v_local::date;
  new.hora_envio_local := v_local::time;
  new.dentro_prazo     := v_local::time < v_corte;
  return new;
end $$;

drop trigger if exists trg_pedidos_bombeio_prazo on public.pedidos_bombeio;
create trigger trg_pedidos_bombeio_prazo
  before insert on public.pedidos_bombeio
  for each row execute function public.fn_pedidos_bombeio_prazo();

-- 4) Segurança: RLS ligado e SEM policies => anon/authenticated não leem nem gravam.
--    Só a API do formulário (service_role, no servidor da Vercel) grava.
alter table public.pedidos_bombeio enable row level security;
alter table public.config_bombeio  enable row level security;

-- 5) Visão para a base: último envio de cada CNPJ no dia (o que vale para a planilha "papel de pão")
create or replace view public.vw_pedidos_bombeio_dia
with (security_invoker = true) as
select distinct on (data_pedido, cnpj)
  data_pedido, cnpj, hora_envio_local, dentro_prazo, status,
  gas_a_bombeio,  gas_a_previsao_venda,
  s500_a_bombeio, s500_a_previsao_venda,
  s10_a_bombeio,  s10_a_previsao_venda,
  (gas_a_bombeio + s500_a_bombeio + s10_a_bombeio) as total_bombeio,
  count(*) over (partition by data_pedido, cnpj)   as qtde_envios,
  id, criado_em
from public.pedidos_bombeio
order by data_pedido, cnpj, criado_em desc, id desc;

-- Consulta do dia (exemplo):
-- select * from public.vw_pedidos_bombeio_dia
--  where data_pedido = (now() at time zone 'America/Sao_Paulo')::date
--  order by dentro_prazo desc, total_bombeio desc;
