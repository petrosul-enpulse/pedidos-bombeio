"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Cliente = { id: string; razao_social: string; cnpj: string };
type Base = { id: string; nome: string; codigo: string };
type Permissao = { cliente_id: string; base_id: string };
type Produto = { codigo: string; nome: string; unidade: string };
type Valores = Record<string, { solicitado: string; previsao: string }>;

export function PedidoForm({ clientes, bases, permissoes, produtos, anteriorId, anteriorProtocolo, valoresIniciais }: {
  clientes: Cliente[]; bases: Base[]; permissoes: Permissao[]; produtos: Produto[];
  anteriorId?: string; anteriorProtocolo?: string; valoresIniciais?: Valores;
}) {
  const [clienteId, setClienteId] = useState(clientes[0].id);
  const basesPermitidas = bases.filter((b) => permissoes.some((p) => p.cliente_id === clienteId && p.base_id === b.id));
  const [baseId, setBaseId] = useState(basesPermitidas[0]?.id ?? "");
  const [valores, setValores] = useState<Valores>(() => Object.fromEntries(produtos.map((p) => [p.codigo, valoresIniciais?.[p.codigo] ?? { solicitado: "", previsao: "" }])));
  const [etapa, setEtapa] = useState<"form" | "revisao" | "sucesso">("form");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [recibo, setRecibo] = useState<{ id: string; protocolo: string; dentro_prazo: boolean; enviado_em: string } | null>(null);
  const tentativa = useRef<string | null>(null);

  function atualizar(codigo: string, campo: "solicitado" | "previsao", valor: string) {
    tentativa.current = null;
    setValores((anterior) => ({ ...anterior, [codigo]: { ...anterior[codigo], [campo]: valor } }));
  }

  function revisar(event: React.FormEvent) {
    event.preventDefault();
    setErro("");
    if (!baseId) { setErro("Selecione uma base autorizada."); return; }
    const invalid = produtos.some((p) => [valores[p.codigo].solicitado, valores[p.codigo].previsao]
      .some((v) => v && !/^(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,3})?$/.test(v)));
    const total = produtos.reduce((n, p) => n + Number(valores[p.codigo].solicitado || 0) + Number(valores[p.codigo].previsao || 0), 0);
    if (invalid || total <= 0) { setErro("Informe ao menos um volume válido, com até três casas decimais."); return; }
    setEtapa("revisao");
  }

  async function enviar() {
    setEnviando(true);
    setErro("");
    tentativa.current ??= crypto.randomUUID();
    try {
      const response = await fetch(anteriorId ? `/api/v1/pedidos/${anteriorId}/reenvios` : "/api/v1/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": tentativa.current },
        body: JSON.stringify({
          cliente_id: clienteId, base_id: baseId,
          itens: produtos.map((p) => ({
            produto_codigo: p.codigo,
            volume_solicitado: valores[p.codigo].solicitado || "0",
            previsao_venda_d1: valores[p.codigo].previsao || "0",
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.mensagem ?? "Falha no envio.");
      setRecibo(result.pedido);
      setEtapa("sucesso");
      tentativa.current = null;
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível enviar. Tente novamente.");
    } finally { setEnviando(false); }
  }

  const cliente = clientes.find((c) => c.id === clienteId);
  const base = bases.find((b) => b.id === baseId);
  if (etapa === "sucesso" && recibo) return <section className="platform-card" aria-live="polite">
    <span className="platform-kicker">Pedido recebido</span><h2>Protocolo {recibo.protocolo}</h2>
    <p>Registrado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(recibo.enviado_em))}.</p>
    <p><span className={recibo.dentro_prazo ? "platform-badge" : "platform-badge platform-badge-late"}>{recibo.dentro_prazo ? "Dentro do prazo" : "Após o corte"}</span></p>
    <Link className="platform-button" href={`/cliente/pedidos/${recibo.id}`}>Ver pedido</Link>
  </section>;

  return <section className="platform-card">
    {etapa === "form" ? <form onSubmit={revisar}>
      {anteriorProtocolo && <p className="platform-helper">Reenvio do protocolo <strong>{anteriorProtocolo}</strong>. O envio cria um novo protocolo e preserva o histórico anterior.</p>}
      <div className="platform-form-grid">
        <div className="platform-field"><label htmlFor="pedido-cliente">Cliente</label><select id="pedido-cliente" value={clienteId} disabled={Boolean(anteriorId)} onChange={(e) => {
          tentativa.current = null;
          const next = e.target.value; setClienteId(next);
          setBaseId(bases.find((b) => permissoes.some((p) => p.cliente_id === next && p.base_id === b.id))?.id ?? "");
        }}>{clientes.map((c) => <option key={c.id} value={c.id}>{c.razao_social} · {c.cnpj}</option>)}</select></div>
        <div className="platform-field"><label htmlFor="pedido-base">Base</label><select id="pedido-base" value={baseId} disabled={Boolean(anteriorId)} onChange={(e) => { tentativa.current = null; setBaseId(e.target.value); }}>{basesPermitidas.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>
      </div>
      <div className="platform-section"><div className="platform-section-title"><h2>Volumes por produto</h2></div>
        {produtos.map((p) => <div className="platform-order-row" key={p.codigo}>
          <div><strong>{p.nome}</strong><small>{p.unidade}</small></div>
          <div className="platform-field"><label htmlFor={`${p.codigo}-solicitado`}>Bombeio solicitado</label><input id={`${p.codigo}-solicitado`} type="number" min="0" max="999999.999" step="0.001" inputMode="decimal" value={valores[p.codigo].solicitado} onChange={(e) => atualizar(p.codigo, "solicitado", e.target.value)} /></div>
          <div className="platform-field"><label htmlFor={`${p.codigo}-previsao`}>Previsão de venda D+1</label><input id={`${p.codigo}-previsao`} type="number" min="0" max="999999.999" step="0.001" inputMode="decimal" value={valores[p.codigo].previsao} onChange={(e) => atualizar(p.codigo, "previsao", e.target.value)} /></div>
        </div>)}
      </div>
      {erro && <p className="platform-error" role="alert">{erro}</p>}
      <div className="platform-form-actions"><button className="platform-button" type="submit">Revisar pedido</button></div>
    </form> : <div>
      <span className="platform-kicker">Revisão antes do envio</span><h2>Confirme os dados do pedido</h2>
      <p><strong>Cliente:</strong> {cliente?.razao_social} · {cliente?.cnpj}<br /><strong>Base:</strong> {base?.nome}</p>
      {produtos.map((p) => <div className="platform-order-row" key={p.codigo}><div><strong>{p.nome}</strong></div><div>Solicitado: {valores[p.codigo].solicitado || "0"} {p.unidade}</div><div>D+1: {valores[p.codigo].previsao || "0"} {p.unidade}</div></div>)}
      {erro && <p className="platform-error" role="alert">{erro}</p>}
      <div className="platform-form-actions" style={{ gap: 10 }}><button className="platform-button platform-button-secondary" type="button" onClick={() => setEtapa("form")}>Corrigir</button><button className="platform-button" type="button" disabled={enviando} onClick={enviar}>{enviando ? "Enviando..." : "Confirmar e enviar"}</button></div>
    </div>}
  </section>;
}
