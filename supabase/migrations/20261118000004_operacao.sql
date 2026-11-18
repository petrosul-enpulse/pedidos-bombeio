-- Transições operacionais com controle de versão e evento na mesma transação.
-- Premissa provisória: gestor confirma ajuste diretamente e informa motivo público.
begin;

create function enpulse_bombeio.assumir_pedido(p_pedido_id uuid, p_versao integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido enpulse_bombeio.pedidos%rowtype;
  v_papel text;
begin
  if auth.uid() is null then raise exception 'Sessão obrigatória' using errcode = '42501'; end if;
  select * into v_pedido from enpulse_bombeio.pedidos where id = p_pedido_id for update;
  if not found then raise exception 'Pedido não encontrado' using errcode = '42501'; end if;
  v_papel := enpulse_bombeio.papel_na_base(v_pedido.base_id);
  if v_papel not in ('operador', 'gestor', 'administrador') or v_papel is null then
    raise exception 'Ação não autorizada' using errcode = '42501';
  end if;
  if v_pedido.versao <> p_versao then raise exception 'Pedido alterado por outro usuário' using errcode = '40001'; end if;
  if v_pedido.status <> 'recebido' then raise exception 'Pedido não pode entrar em análise' using errcode = '40001'; end if;
  update enpulse_bombeio.pedidos set status = 'em_analise', versao = versao + 1, atualizado_em = now()
    where id = p_pedido_id returning * into v_pedido;
  insert into enpulse_bombeio.pedido_eventos(pedido_id, tipo, ator_id)
    values (p_pedido_id, 'analise_iniciada', auth.uid());
  return jsonb_build_object('id', v_pedido.id, 'status', v_pedido.status, 'versao', v_pedido.versao);
end;
$$;

create function enpulse_bombeio.confirmar_pedido(
  p_pedido_id uuid, p_versao integer, p_itens jsonb, p_motivo text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido enpulse_bombeio.pedidos%rowtype;
  v_papel text;
  v_item jsonb;
  v_codigo text;
  v_confirmado numeric;
  v_original numeric;
  v_limite numeric;
  v_vistos text[] := '{}';
  v_ajustado boolean := false;
  v_evento_id bigint;
begin
  if auth.uid() is null then raise exception 'Sessão obrigatória' using errcode = '42501'; end if;
  select * into v_pedido from enpulse_bombeio.pedidos where id = p_pedido_id for update;
  if not found then raise exception 'Pedido não encontrado' using errcode = '42501'; end if;
  v_papel := enpulse_bombeio.papel_na_base(v_pedido.base_id);
  if v_papel not in ('gestor', 'administrador') or v_papel is null then
    raise exception 'Ação não autorizada' using errcode = '42501';
  end if;
  if v_pedido.versao <> p_versao then raise exception 'Pedido alterado por outro usuário' using errcode = '40001'; end if;
  if v_pedido.status <> 'em_analise' then raise exception 'Pedido não está em análise' using errcode = '40001'; end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or
    jsonb_array_length(p_itens) <> (select count(*) from enpulse_bombeio.pedido_itens where pedido_id = p_pedido_id) then
    raise exception 'Confirme todos os itens' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_itens) loop
    v_codigo := v_item->>'produto_codigo';
    if v_codigo is null or v_codigo = any(v_vistos) or (v_item->>'volume_confirmado') !~ '^[0-9]+(\.[0-9]{1,3})?$' then
      raise exception 'Item ou volume inválido' using errcode = '22023';
    end if;
    v_vistos := array_append(v_vistos, v_codigo);
    select pi.volume_solicitado, pr.limite_m3 into v_original, v_limite
      from enpulse_bombeio.pedido_itens pi
      join enpulse_bombeio.produtos pr on pr.id = pi.produto_id
      where pi.pedido_id = p_pedido_id and pi.produto_codigo = v_codigo;
    if not found then raise exception 'Produto não pertence ao pedido' using errcode = '22023'; end if;
    v_confirmado := (v_item->>'volume_confirmado')::numeric;
    if v_confirmado > v_limite then raise exception 'Volume acima do limite' using errcode = '22023'; end if;
    if v_confirmado <> v_original and nullif(btrim(p_motivo), '') is null then
      raise exception 'Motivo obrigatório para ajuste de volume' using errcode = '22023';
    end if;
    if v_confirmado <> v_original then v_ajustado := true; end if;
    update enpulse_bombeio.pedido_itens set volume_confirmado = v_confirmado,
      motivo_ajuste = case when v_confirmado <> v_original then nullif(btrim(p_motivo), '') else null end
      where pedido_id = p_pedido_id and produto_codigo = v_codigo;
  end loop;
  if v_ajustado and nullif(btrim(p_motivo), '') is null then
    raise exception 'Motivo obrigatório para ajuste de volume' using errcode = '22023';
  end if;

  update enpulse_bombeio.pedidos set status = 'confirmado', versao = versao + 1, atualizado_em = now()
    where id = p_pedido_id returning * into v_pedido;
  insert into enpulse_bombeio.pedido_eventos(pedido_id, tipo, ator_id, dados)
    values (p_pedido_id, 'pedido_confirmado', auth.uid(),
      jsonb_build_object('ajustado', v_ajustado, 'motivo_publico', case when v_ajustado then btrim(p_motivo) else null end))
    returning id into v_evento_id;
  insert into enpulse_bombeio.notificacoes_outbox(evento_id, destinatario, modelo)
    select v_evento_id, u.email, 'pedido_confirmado'
    from enpulse_bombeio.usuarios_cliente uc
    join auth.users u on u.id = uc.user_id
    where uc.cliente_id = v_pedido.cliente_id and uc.ativo and u.email is not null
    on conflict do nothing;
  return jsonb_build_object('id', v_pedido.id, 'status', v_pedido.status, 'versao', v_pedido.versao);
end;
$$;

create function enpulse_bombeio.recusar_pedido(p_pedido_id uuid, p_versao integer, p_motivo text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido enpulse_bombeio.pedidos%rowtype;
  v_papel text;
  v_evento_id bigint;
begin
  if auth.uid() is null then raise exception 'Sessão obrigatória' using errcode = '42501'; end if;
  if nullif(btrim(p_motivo), '') is null then raise exception 'Motivo obrigatório' using errcode = '22023'; end if;
  select * into v_pedido from enpulse_bombeio.pedidos where id = p_pedido_id for update;
  if not found then raise exception 'Pedido não encontrado' using errcode = '42501'; end if;
  v_papel := enpulse_bombeio.papel_na_base(v_pedido.base_id);
  if v_papel not in ('gestor', 'administrador') or v_papel is null then
    raise exception 'Ação não autorizada' using errcode = '42501';
  end if;
  if v_pedido.versao <> p_versao then raise exception 'Pedido alterado por outro usuário' using errcode = '40001'; end if;
  if v_pedido.status <> 'em_analise' then raise exception 'Pedido não está em análise' using errcode = '40001'; end if;
  update enpulse_bombeio.pedidos set status = 'recusado', versao = versao + 1, atualizado_em = now()
    where id = p_pedido_id returning * into v_pedido;
  insert into enpulse_bombeio.pedido_eventos(pedido_id, tipo, ator_id, dados)
    values (p_pedido_id, 'pedido_recusado', auth.uid(), jsonb_build_object('motivo_publico', btrim(p_motivo)))
    returning id into v_evento_id;
  insert into enpulse_bombeio.notificacoes_outbox(evento_id, destinatario, modelo)
    select v_evento_id, u.email, 'pedido_recusado'
    from enpulse_bombeio.usuarios_cliente uc
    join auth.users u on u.id = uc.user_id
    where uc.cliente_id = v_pedido.cliente_id and uc.ativo and u.email is not null
    on conflict do nothing;
  return jsonb_build_object('id', v_pedido.id, 'status', v_pedido.status, 'versao', v_pedido.versao);
end;
$$;

revoke execute on function enpulse_bombeio.assumir_pedido(uuid, integer) from public, anon;
revoke execute on function enpulse_bombeio.confirmar_pedido(uuid, integer, jsonb, text) from public, anon;
revoke execute on function enpulse_bombeio.recusar_pedido(uuid, integer, text) from public, anon;
grant execute on function enpulse_bombeio.assumir_pedido(uuid, integer) to authenticated;
grant execute on function enpulse_bombeio.confirmar_pedido(uuid, integer, jsonb, text) to authenticated;
grant execute on function enpulse_bombeio.recusar_pedido(uuid, integer, text) to authenticated;

commit;
