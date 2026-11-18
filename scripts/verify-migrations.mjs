import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const migrationDir = new URL("../supabase/migrations/", import.meta.url);
const users = {
  a: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  b: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  manager: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  reader: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
};

async function as(user, sql) {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${user}';`);
  try { return await db.query(sql); }
  finally { await db.exec("reset role; reset request.jwt.claim.sub;"); }
}

async function main() {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
  `);
  for (const file of [
    "20261118000001_enpulse_bombeio_namespace.sql",
    "20261118000002_enpulse_bombeio_core.sql",
    "20261118000003_criar_pedido.sql",
    "20261118000004_operacao.sql",
  ]) {
    const sql = await readFile(new URL(file, migrationDir), "utf8");
    await db.exec(sql);
  }

  await db.exec(`
    insert into auth.users(id,email) values
      ('${users.a}','a@example.test'), ('${users.b}','b@example.test'),
      ('${users.manager}','gestor@example.test'), ('${users.reader}','leitura@example.test');
    insert into enpulse_bombeio.clientes(cnpj,razao_social) values
      ('11111111000191','Cliente A'), ('22222222000191','Cliente B');
    insert into enpulse_bombeio.clientes_bases(cliente_id,base_id)
      select c.id,b.id from enpulse_bombeio.clientes c cross join enpulse_bombeio.bases b;
    insert into enpulse_bombeio.usuarios_cliente(user_id,cliente_id)
      select '${users.a}',id from enpulse_bombeio.clientes where razao_social='Cliente A';
    insert into enpulse_bombeio.usuarios_cliente(user_id,cliente_id)
      select '${users.b}',id from enpulse_bombeio.clientes where razao_social='Cliente B';
    insert into enpulse_bombeio.usuarios_enpulse(user_id,papel) values
      ('${users.manager}','gestor'), ('${users.reader}','leitura');
    insert into enpulse_bombeio.acessos_base(user_id,base_id)
      select ue.user_id,b.id from enpulse_bombeio.usuarios_enpulse ue
      cross join enpulse_bombeio.bases b;
  `);

  const { rows: [ids] } = await db.query(`
    select (select id from enpulse_bombeio.clientes where razao_social='Cliente A') as cliente_a,
      (select id from enpulse_bombeio.clientes where razao_social='Cliente B') as cliente_b,
      (select id from enpulse_bombeio.bases where codigo='PAULINIA') as base_id;
  `);
  const items = JSON.stringify([
    { produto_codigo: "GAS_A", volume_solicitado: "10.000", previsao_venda_d1: "2" },
    { produto_codigo: "S500_A", volume_solicitado: "0", previsao_venda_d1: "0" },
    { produto_codigo: "S10_A", volume_solicitado: "0", previsao_venda_d1: "0" },
  ]).replaceAll("'", "''");
  const key = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  const submit = (client) => `select enpulse_bombeio.criar_pedido('${client}','${ids.base_id}','${key}','${items}'::jsonb,null) as pedido`;

  const ownClients = await as(users.a, "select razao_social from enpulse_bombeio.clientes order by razao_social");
  assert.deepEqual(ownClients.rows.map((row) => row.razao_social), ["Cliente A"]);
  await assert.rejects(() => as(users.a, submit(ids.cliente_b)), /autorizado/i);
  const { rows: [first] } = await as(users.a, submit(ids.cliente_a));
  const { rows: [retry] } = await as(users.a, submit(ids.cliente_a));
  assert.equal(first.pedido.id, retry.pedido.id, "tentativa repetida não cria outro pedido");
  const foreignOrders = await as(users.b, "select id from enpulse_bombeio.pedidos");
  assert.equal(foreignOrders.rows.length, 0, "cliente B não vê pedido de A");
  await assert.rejects(() => as(users.a,
    `insert into enpulse_bombeio.pedido_eventos(pedido_id,tipo,ator_id) values ('${first.pedido.id}','forjado','${users.a}')`), /permission denied/i);

  const oldKey = "11111111-1111-4111-8111-111111111111";
  const resendKey = "22222222-2222-4222-8222-222222222222";
  const { rows: [old] } = await as(users.a,
    `select enpulse_bombeio.criar_pedido('${ids.cliente_a}','${ids.base_id}','${oldKey}','${items}'::jsonb,null) as pedido`);
  const resend = `select enpulse_bombeio.criar_pedido('${ids.cliente_a}','${ids.base_id}',
    '${resendKey}','${items}'::jsonb,'${old.pedido.id}') as pedido`;
  const { rows: [newOrder] } = await as(users.a, resend);
  const { rows: [resendRetry] } = await as(users.a, resend);
  assert.equal(newOrder.pedido.id, resendRetry.pedido.id, "repetir reenvio devolve o mesmo protocolo");
  const { rows: [oldStatus] } = await db.query(`select status from enpulse_bombeio.pedidos where id='${old.pedido.id}'`);
  assert.equal(oldStatus.status, "substituido");
  await assert.rejects(() => as(users.manager,
    `select enpulse_bombeio.assumir_pedido('${old.pedido.id}',1)`), /alterado/i);
  await assert.rejects(() => as(users.b,
    `select enpulse_bombeio.criar_pedido('${ids.cliente_b}','${ids.base_id}',
      '33333333-3333-4333-8333-333333333333','${items}'::jsonb,'${newOrder.pedido.id}')`), /autorizado/i);

  await assert.rejects(() => as(users.reader,
    `select enpulse_bombeio.assumir_pedido('${first.pedido.id}',1)`), /autorizada/i);
  const { rows: [assumed] } = await as(users.manager,
    `select enpulse_bombeio.assumir_pedido('${first.pedido.id}',1) as pedido`);
  assert.equal(assumed.pedido.status, "em_analise");
  await assert.rejects(() => as(users.manager,
    `select enpulse_bombeio.assumir_pedido('${first.pedido.id}',1)`), /alterado/i);

  const confirmations = JSON.stringify([
    { produto_codigo: "GAS_A", volume_confirmado: "9" },
    { produto_codigo: "S500_A", volume_confirmado: "0" },
    { produto_codigo: "S10_A", volume_confirmado: "0" },
  ]).replaceAll("'", "''");
  await assert.rejects(() => as(users.manager,
    `select enpulse_bombeio.confirmar_pedido('${first.pedido.id}',2,'${confirmations}'::jsonb,null)`), /Motivo obrigatório/i);
  const { rows: [confirmed] } = await as(users.manager,
    `select enpulse_bombeio.confirmar_pedido('${first.pedido.id}',2,'${confirmations}'::jsonb,'Ajuste operacional') as pedido`);
  assert.equal(confirmed.pedido.status, "confirmado");
  const { rows: [audit] } = await db.query(`select count(*)::int as total from enpulse_bombeio.pedido_eventos where pedido_id='${first.pedido.id}'`);
  assert.equal(audit.total, 3, "recebimento, análise e confirmação têm evento");
  const { rows: [outbox] } = await db.query(`select count(*)::int as total from enpulse_bombeio.notificacoes_outbox`);
  assert.equal(outbox.total, 1, "confirmação cria notificação para o contato do cliente");
  console.log("Migrações e isolamento de clientes verificados localmente.");
  await db.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
