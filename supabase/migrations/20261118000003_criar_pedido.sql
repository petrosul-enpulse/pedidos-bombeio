-- Criação atômica: identidade e escopo vêm do JWT, nunca do CNPJ informado.
begin;

create function enpulse_bombeio.criar_pedido(
  p_cliente_id uuid,
  p_base_id uuid,
  p_chave_idempotencia uuid,
  p_itens jsonb,
  p_pedido_substituido_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_autor uuid := auth.uid();
  v_base enpulse_bombeio.bases%rowtype;
  v_regra enpulse_bombeio.regras_operacionais%rowtype;
  v_agora timestamptz := clock_timestamp();
  v_dia date;
  v_hora time;
  v_item jsonb;
  v_codigo text;
  v_produto enpulse_bombeio.produtos%rowtype;
  v_solicitado numeric;
  v_previsao numeric;
  v_total numeric := 0;
  v_vistos text[] := '{}';
  v_hash text;
  v_id uuid := gen_random_uuid();
  v_pedido enpulse_bombeio.pedidos%rowtype;
  v_anterior enpulse_bombeio.pedidos%rowtype;
  v_quantidade_produtos integer;
begin
  if v_autor is null then
    raise exception 'Sessão obrigatória' using errcode = '42501';
  end if;
  if not enpulse_bombeio.cliente_autorizado(p_cliente_id, p_base_id) then
    raise exception 'Cliente ou base não autorizado' using errcode = '42501';
  end if;
  select count(*) into v_quantidade_produtos from enpulse_bombeio.produtos where ativo;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array'
    or jsonb_array_length(p_itens) <> v_quantidade_produtos or v_quantidade_produtos = 0 then
    raise exception 'Informe todos os produtos ativos' using errcode = '22023';
  end if;

  select * into v_base from enpulse_bombeio.bases where id = p_base_id and ativo;
  if not found then
    raise exception 'Base indisponível' using errcode = '22023';
  end if;
  v_dia := (v_agora at time zone v_base.fuso)::date;
  v_hora := (v_agora at time zone v_base.fuso)::time;
  select * into v_regra from enpulse_bombeio.regras_operacionais
    where base_id = p_base_id and vigencia_desde <= v_dia
    order by vigencia_desde desc limit 1;
  if not found then
    raise exception 'Regra operacional não configurada' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_itens) loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Item inválido' using errcode = '22023';
    end if;
    v_codigo := v_item->>'produto_codigo';
    if v_codigo is null or v_codigo = any(v_vistos) then
      raise exception 'Produto ausente ou repetido' using errcode = '22023';
    end if;
    v_vistos := array_append(v_vistos, v_codigo);
    select * into v_produto from enpulse_bombeio.produtos where codigo = v_codigo and ativo;
    if not found then
      raise exception 'Produto indisponível' using errcode = '22023';
    end if;
    if (v_item->>'volume_solicitado') !~ '^[0-9]+(\.[0-9]{1,3})?$'
      or (v_item->>'previsao_venda_d1') !~ '^[0-9]+(\.[0-9]{1,3})?$' then
      raise exception 'Volume inválido' using errcode = '22023';
    end if;
    v_solicitado := (v_item->>'volume_solicitado')::numeric;
    v_previsao := (v_item->>'previsao_venda_d1')::numeric;
    if v_solicitado > v_produto.limite_m3 or v_previsao > v_produto.limite_m3 then
      raise exception 'Volume acima do limite' using errcode = '22023';
    end if;
    v_total := v_total + v_solicitado + v_previsao;
  end loop;
  if v_total = 0 then
    raise exception 'Informe ao menos um volume' using errcode = '22023';
  end if;

  -- jsonb normaliza ordem das chaves; a ordem dos produtos é normalizada abaixo.
  select md5(p_cliente_id::text || p_base_id::text || coalesce(p_pedido_substituido_id::text, '') ||
    (select jsonb_agg(value order by value->>'produto_codigo')::text
     from jsonb_array_elements(p_itens))) into v_hash;

  -- Uma repetição após timeout devolve o mesmo pedido, mesmo que o anterior
  -- já tenha sido marcado como substituído pela primeira tentativa.
  select * into v_pedido from enpulse_bombeio.pedidos
    where autor_id = v_autor and chave_idempotencia = p_chave_idempotencia;
  if found then
    if v_pedido.payload_hash is distinct from v_hash then
      raise exception 'Chave de idempotência reutilizada com outro pedido' using errcode = '23505';
    end if;
    return jsonb_build_object('id', v_pedido.id, 'protocolo', v_pedido.protocolo,
      'data_operacional', v_pedido.data_operacional, 'enviado_em', v_pedido.enviado_em,
      'dentro_prazo', v_pedido.dentro_prazo, 'status', v_pedido.status);
  end if;

  if p_pedido_substituido_id is not null then
    select * into v_anterior from enpulse_bombeio.pedidos
      where id = p_pedido_substituido_id for update;
    if not found or v_anterior.cliente_id <> p_cliente_id or v_anterior.base_id <> p_base_id then
      raise exception 'Pedido anterior não autorizado' using errcode = '42501';
    end if;
    if v_anterior.data_operacional <> v_dia or v_anterior.status not in ('recebido', 'em_analise') then
      -- Outra requisição com a mesma chave pode ter concluído enquanto esta
      -- aguardava o bloqueio da versão anterior.
      select * into v_pedido from enpulse_bombeio.pedidos
        where autor_id = v_autor and chave_idempotencia = p_chave_idempotencia;
      if found and v_pedido.payload_hash = v_hash then
        return jsonb_build_object('id', v_pedido.id, 'protocolo', v_pedido.protocolo,
          'data_operacional', v_pedido.data_operacional, 'enviado_em', v_pedido.enviado_em,
          'dentro_prazo', v_pedido.dentro_prazo, 'status', v_pedido.status);
      end if;
      raise exception 'Pedido anterior não pode ser reenviado' using errcode = '40001';
    end if;
  end if;

  insert into enpulse_bombeio.pedidos (
    id, protocolo, cliente_id, base_id, data_operacional, status,
    enviado_em, dentro_prazo, corte_aplicado, fuso_aplicado, regra_id,
    autor_id, chave_idempotencia, payload_hash, pedido_substituido_id
  ) values (
    v_id, 'PB-' || upper(replace(v_id::text, '-', '')),
    p_cliente_id, p_base_id, v_dia, 'recebido', v_agora,
    v_hora < v_regra.horario_corte, v_regra.horario_corte, v_base.fuso,
    v_regra.id, v_autor, p_chave_idempotencia, v_hash, p_pedido_substituido_id
  ) on conflict (autor_id, chave_idempotencia) do nothing
  returning * into v_pedido;

  if v_pedido.id is null then
    select * into v_pedido from enpulse_bombeio.pedidos
      where autor_id = v_autor and chave_idempotencia = p_chave_idempotencia;
    if v_pedido.payload_hash is distinct from v_hash then
      raise exception 'Chave de idempotência reutilizada com outro pedido' using errcode = '23505';
    end if;
  else
    for v_item in select value from jsonb_array_elements(p_itens) loop
      v_codigo := v_item->>'produto_codigo';
      select * into v_produto from enpulse_bombeio.produtos where codigo = v_codigo;
      insert into enpulse_bombeio.pedido_itens (
        pedido_id, produto_id, produto_codigo, produto_nome, unidade,
        volume_solicitado, previsao_venda_d1
      ) values (
        v_pedido.id, v_produto.id, v_produto.codigo, v_produto.nome, v_produto.unidade,
        (v_item->>'volume_solicitado')::numeric,
        (v_item->>'previsao_venda_d1')::numeric
      );
    end loop;
    insert into enpulse_bombeio.pedido_eventos(pedido_id, tipo, ator_id, dados)
      values (v_pedido.id, 'pedido_recebido', v_autor,
        jsonb_build_object('dentro_prazo', v_pedido.dentro_prazo,
          'pedido_substituido_id', p_pedido_substituido_id));
    if p_pedido_substituido_id is not null then
      update enpulse_bombeio.pedidos set status = 'substituido', versao = versao + 1,
        atualizado_em = v_agora where id = p_pedido_substituido_id;
      insert into enpulse_bombeio.pedido_eventos(pedido_id, tipo, ator_id, dados)
        values (p_pedido_substituido_id, 'pedido_substituido', v_autor,
          jsonb_build_object('novo_pedido_id', v_pedido.id));
    end if;
  end if;

  return jsonb_build_object(
    'id', v_pedido.id,
    'protocolo', v_pedido.protocolo,
    'data_operacional', v_pedido.data_operacional,
    'enviado_em', v_pedido.enviado_em,
    'dentro_prazo', v_pedido.dentro_prazo,
    'status', v_pedido.status
  );
end;
$$;

revoke execute on function enpulse_bombeio.criar_pedido(uuid, uuid, uuid, jsonb, uuid) from public, anon;
grant execute on function enpulse_bombeio.criar_pedido(uuid, uuid, uuid, jsonb, uuid) to authenticated;

commit;
