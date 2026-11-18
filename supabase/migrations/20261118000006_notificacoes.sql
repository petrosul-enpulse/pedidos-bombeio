-- Reserva concorrente da outbox para um trabalhador externo com service_role.
begin;

alter table enpulse_bombeio.notificacoes_outbox
  add column reserva_ate timestamptz,
  add column enviada_em timestamptz,
  add column ultimo_erro text;
create index notificacoes_pendentes_idx on enpulse_bombeio.notificacoes_outbox
  (proximo_envio_em, reserva_ate) where estado <> 'enviada';

create function enpulse_bombeio.reservar_notificacoes(p_limite integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_notificacao enpulse_bombeio.notificacoes_outbox%rowtype;
  v_resultado jsonb := '[]'::jsonb;
  v_protocolo text;
  v_pedido_id uuid;
  v_motivo text;
begin
  if p_limite is null or p_limite < 1 or p_limite > 50 then
    raise exception 'Lote inválido' using errcode = '22023';
  end if;
  for v_notificacao in
    select * from enpulse_bombeio.notificacoes_outbox
    where estado <> 'enviada' and tentativas < 10 and proximo_envio_em <= now()
      and (reserva_ate is null or reserva_ate < now())
    order by proximo_envio_em, id
    for update skip locked limit p_limite
  loop
    update enpulse_bombeio.notificacoes_outbox
      set reserva_ate = now() + interval '2 minutes', tentativas = tentativas + 1,
        estado = 'pendente', ultimo_erro = null
      where id = v_notificacao.id;
    select p.protocolo, p.id, e.dados->>'motivo_publico'
      into v_protocolo, v_pedido_id, v_motivo
      from enpulse_bombeio.pedido_eventos e
      join enpulse_bombeio.pedidos p on p.id = e.pedido_id
      where e.id = v_notificacao.evento_id;
    v_resultado := v_resultado || jsonb_build_array(jsonb_build_object(
      'id', v_notificacao.id, 'destinatario', v_notificacao.destinatario,
      'modelo', v_notificacao.modelo, 'protocolo', v_protocolo,
      'pedido_id', v_pedido_id, 'motivo', v_motivo,
      'tentativas', v_notificacao.tentativas + 1));
  end loop;
  return v_resultado;
end;
$$;

revoke execute on function enpulse_bombeio.reservar_notificacoes(integer) from public, anon, authenticated;
grant execute on function enpulse_bombeio.reservar_notificacoes(integer) to service_role;
grant select, update on enpulse_bombeio.notificacoes_outbox to service_role;

commit;
