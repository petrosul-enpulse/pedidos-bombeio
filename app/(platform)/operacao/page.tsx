import Link from "next/link";
import { redirect } from "next/navigation";
import { PLATFORM_SCHEMA, platformConfigured } from "@/lib/platform/config";
import { createPlatformServerClient } from "@/lib/platform/server";
import { SetupPending } from "../setup-pending";
import { ExportButton } from "./export-button";

export const dynamic = "force-dynamic";

export default async function OperacaoPage({ searchParams }: {
  searchParams: Promise<{ data?: string; base?: string; status?: string; pagina?: string }>;
}) {
  if (!platformConfigured()) return <SetupPending />;
  const supabase = await createPlatformServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acesso?destino=operacao");
  const db = supabase.schema(PLATFORM_SCHEMA);
  const { data: integrante, error: integranteErro } = await db.from("usuarios_enpulse")
    .select("papel").eq("user_id", user.id).eq("ativo", true).maybeSingle();
  if (integranteErro) return <main className="platform-content"><p className="platform-error">Não foi possível carregar seu papel de acesso.</p></main>;
  if (!integrante) return <main className="platform-content"><div className="platform-empty"><h1>Acesso à operação indisponível</h1><p>Seu e-mail ainda não está vinculado à equipe Enpulse.</p></div></main>;

  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const datePart = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hoje = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
  const params = await searchParams;
  const data = typeof params.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.data) ? params.data : hoje;
  const status = ["recebido", "em_analise", "confirmado", "recusado"].includes(params.status ?? "") ? params.status! : "";
  const pagina = Math.min(100, Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1));
  const { data: bases } = await db.from("bases").select("id, nome").eq("ativo", true).order("nome");
  const base = (bases ?? []).some((item) => item.id === params.base) ? params.base! : "";
  const filtro = (opcoes?: { status?: string; tardio?: boolean }) => {
    let query = db.from("pedidos").select("id", { count: "exact", head: true })
      .eq("data_operacional", data).neq("status", "substituido");
    if (base) query = query.eq("base_id", base);
    if (opcoes?.status) query = query.eq("status", opcoes.status);
    if (opcoes?.tardio) query = query.eq("dentro_prazo", false);
    return query;
  };
  let fila = db.from("pedidos")
    .select("id, protocolo, cliente_id, base_id, data_operacional, status, dentro_prazo, enviado_em, versao", { count: "exact" })
    .eq("data_operacional", data).neq("status", "substituido");
  if (base) fila = fila.eq("base_id", base);
  if (status) fila = fila.eq("status", status);
  const [{ data: pedidos, count: totalFiltrado, error: pedidosErro }, { count: total }, { count: tardios }, { count: confirmados }] = await Promise.all([
    fila.order("enviado_em", { ascending: false }).range((pagina - 1) * 50, pagina * 50 - 1),
    filtro(), filtro({ tardio: true }), filtro({ status: "confirmado" }),
  ]);
  if (pedidosErro) return <main className="platform-content"><p className="platform-error">Não foi possível consultar a fila de pedidos.</p></main>;
  const clienteIds = [...new Set((pedidos ?? []).map((p) => p.cliente_id))];
  const { data: clientes } = clienteIds.length
    ? await db.from("clientes").select("id, razao_social").in("id", clienteIds)
    : { data: [] as { id: string; razao_social: string }[] };
  const nomePorId = new Map((clientes ?? []).map((c) => [c.id, c.razao_social]));
  const query = (overrides: Record<string, string>) => {
    const values = new URLSearchParams({ data, ...(base ? { base } : {}), ...(status ? { status } : {}), ...overrides });
    for (const [key, value] of values) if (!value) values.delete(key);
    return `/operacao?${values.toString()}`;
  };

  return (
    <main className="platform-content">
      <div className="platform-page-heading"><div><span className="platform-kicker">Operação Enpulse · {integrante.papel}</span>
        <h1>Fila de bombeio</h1><p>Pedidos vigentes em {data}. Os indicadores e a lista respeitam seu acesso às bases autorizadas.</p></div>
        <Link className="platform-button platform-button-secondary" href={query({})}>Atualizar fila</Link></div>
      <form className="platform-card platform-filter-form" method="get" action="/operacao">
        <div className="platform-field"><label htmlFor="filtro-data">Data operacional</label><input id="filtro-data" name="data" type="date" defaultValue={data} /></div>
        <div className="platform-field"><label htmlFor="filtro-base">Base</label><select id="filtro-base" name="base" defaultValue={base}><option value="">Todas as bases autorizadas</option>{(bases ?? []).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></div>
        <div className="platform-field"><label htmlFor="filtro-status">Situação</label><select id="filtro-status" name="status" defaultValue={status}><option value="">Todas</option>{["recebido", "em_analise", "confirmado", "recusado"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></div>
        <button className="platform-button" type="submit">Aplicar filtros</button>
      </form>
      <div className="platform-grid">
        <div className="platform-card platform-stat"><span className="platform-kicker">Pedidos vigentes</span><strong>{total ?? 0}</strong><small>Na data e base selecionadas</small></div>
        <div className="platform-card platform-stat"><span className="platform-kicker">Após o corte</span><strong>{tardios ?? 0}</strong><small>Exigem atenção operacional</small></div>
        <div className="platform-card platform-stat"><span className="platform-kicker">Confirmados</span><strong>{confirmados ?? 0}</strong><small>Concluídos na seleção</small></div>
      </div>
      <section className="platform-section" aria-labelledby="fila-title"><div className="platform-section-title"><h2 id="fila-title">Pedidos do dia</h2><div className="platform-heading-actions"><span className="platform-kicker">{totalFiltrado ?? 0} resultados</span><ExportButton data={data} base={base} /></div></div>
        {pedidos?.length ? <div className="platform-table-wrap"><table className="platform-table">
          <thead><tr><th>Protocolo</th><th>Cliente</th><th>Envio</th><th>Situação</th><th>Prazo</th><th></th></tr></thead>
          <tbody>{pedidos.map((pedido) => <tr key={pedido.id}>
            <td><strong>{pedido.protocolo}</strong></td><td>{nomePorId.get(pedido.cliente_id) ?? "—"}</td>
            <td>{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(new Date(pedido.enviado_em))}</td>
            <td><span className="platform-badge">{pedido.status.replaceAll("_", " ")}</span></td>
            <td>{pedido.dentro_prazo ? "No prazo" : "Após o corte"}</td>
            <td><Link href={`/operacao/pedidos/${pedido.id}`}>Abrir</Link></td>
          </tr>)}</tbody>
        </table></div> : <div className="platform-card"><p>Nenhum pedido para o dia nas bases que você pode consultar.</p></div>}
        {(totalFiltrado ?? 0) > 50 && <nav className="platform-pagination" aria-label="Páginas da fila">
          {pagina > 1 && <Link href={query({ pagina: String(pagina - 1) })}>← Anterior</Link>}
          <span>Página {pagina} de {Math.ceil((totalFiltrado ?? 0) / 50)}</span>
          {pagina * 50 < (totalFiltrado ?? 0) && <Link href={query({ pagina: String(pagina + 1) })}>Próxima →</Link>}
        </nav>}
      </section>
    </main>
  );
}
