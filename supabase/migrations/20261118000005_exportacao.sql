-- Exportação do dia com escopo verificado no banco e auditoria da seleção real.
begin;

create table enpulse_bombeio.exportacoes (
  id bigint generated always as identity primary key,
  ator_id uuid not null references auth.users(id),
  data_operacional date not null,
  base_id uuid references enpulse_bombeio.bases(id),
  quantidade integer not null,
  criado_em timestamptz not null default now()
);
alter table enpulse_bombeio.exportacoes enable row level security;
revoke all on enpulse_bombeio.exportacoes from public, anon, authenticated;

create function enpulse_bombeio.exportar_pedidos(p_data date, p_base_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_resultado jsonb;
  v_quantidade integer;
begin
  if auth.uid() is null or p_data is null or not exists (
    select 1 from enpulse_bombeio.usuarios_enpulse ue
    where ue.user_id = auth.uid() and ue.ativo
  ) then
    raise exception 'Exportação não autorizada' using errcode = '42501';
  end if;
  if p_base_id is not null and enpulse_bombeio.papel_na_base(p_base_id) is null then
    raise exception 'Base não autorizada' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'protocolo', p.protocolo, 'cliente_cnpj', c.cnpj,
    'cliente_nome', c.razao_social, 'base', b.nome,
    'data_operacional', p.data_operacional, 'enviado_em', p.enviado_em,
    'status', p.status, 'dentro_prazo', p.dentro_prazo,
    'pedido_substituido_id', p.pedido_substituido_id,
    'itens', (select coalesce(jsonb_agg(jsonb_build_object(
      'produto', pi.produto_codigo, 'unidade', pi.unidade,
      'solicitado', pi.volume_solicitado,
      'previsao_d1', pi.previsao_venda_d1,
      'confirmado', pi.volume_confirmado) order by pi.produto_codigo), '[]'::jsonb)
      from enpulse_bombeio.pedido_itens pi where pi.pedido_id = p.id)
  ) order by p.enviado_em desc), '[]'::jsonb) into v_resultado
  from (
    select * from enpulse_bombeio.pedidos
    where data_operacional = p_data
      and (p_base_id is null or base_id = p_base_id)
      and enpulse_bombeio.papel_na_base(base_id) is not null
    order by enviado_em desc limit 1001
  ) p
  join enpulse_bombeio.clientes c on c.id = p.cliente_id
  join enpulse_bombeio.bases b on b.id = p.base_id;

  v_quantidade := jsonb_array_length(v_resultado);
  if v_quantidade > 1000 then
    raise exception 'Exportação acima de 1000 pedidos; filtre por base ou data' using errcode = '22023';
  end if;
  insert into enpulse_bombeio.exportacoes(ator_id, data_operacional, base_id, quantidade)
    values (auth.uid(), p_data, p_base_id, v_quantidade);
  return v_resultado;
end;
$$;

revoke execute on function enpulse_bombeio.exportar_pedidos(date, uuid) from public, anon;
grant execute on function enpulse_bombeio.exportar_pedidos(date, uuid) to authenticated;

commit;
