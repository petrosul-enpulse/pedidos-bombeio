"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { DEMO_BASE } from "@/lib/plataforma/demo/fixtures";
import {
  dateBR,
  numberBR,
  shortDate,
  timeBR,
} from "@/lib/plataforma/demo/format";
import {
  PRODUCTS,
  type Order,
  type OrderLine,
  type Snapshot,
} from "@/lib/plataforma/types";
import { useDemo } from "./demo-provider";
import {
  CycleStrip,
  EmptyState,
  Heading,
  KeyValue,
  Metric,
  OrderStatus,
  OrderSummary,
  Status,
} from "./shared";

const productName = (code: string) =>
  PRODUCTS.find((product) => product.code === code)?.name ?? code;
const lineKey = (line: OrderLine) => `${line.date}:${line.product}`;
function currentOrders(orders: Order[], targets: string[]) {
  const replaced = new Set(
    orders.map((order) => order.replaces).filter(Boolean),
  );
  return orders.filter(
    (order) =>
      !replaced.has(order.protocol) &&
      order.lines.some((line) => targets.includes(line.date)),
  );
}
function findSnapshot(snapshots: Snapshot[], order: Order, line: OrderLine) {
  return snapshots.find(
    (item) => item.clientId === order.clientId && item.product === line.product,
  );
}
function qualityLabel(snapshot?: Snapshot) {
  return !snapshot || snapshot.quality === "missing"
    ? "Sem dados"
    : snapshot.quality === "stale"
      ? "Dado vencido"
      : "Atualizado";
}
function qualityTone(snapshot?: Snapshot): "green" | "amber" | "red" {
  return !snapshot || snapshot.quality === "missing"
    ? "red"
    : snapshot.quality === "stale"
      ? "amber"
      : "green";
}

export function OperationHome() {
  const { gateway } = useDemo();
  const cycle = gateway.getCycle();
  const orders = currentOrders(gateway.getOrders(), cycle.targets);
  const snapshots = gateway.getSnapshots();
  const missing = orders.filter((order) =>
    order.lines.some(
      (line) => findSnapshot(snapshots, order, line)?.quality !== "fresh",
    ),
  );
  const total = orders.reduce(
    (sum, order) =>
      sum + order.lines.reduce((n, line) => n + line.requested, 0),
    0,
  );
  return (
    <>
      <Heading
        eyebrow="CENTRAL ENPULSE / VISÃO DO CICLO"
        title="Operação de bombeio"
        description={`${DEMO_BASE} · envio em ${dateBR(cycle.submissionDate)} · horizonte ${cycle.targets.map(shortDate).join(", ")}`}
        action={
          <Link
            className="demo-btn demo-btn-primary"
            href="/demo/operacao/fila"
          >
            Abrir fila de pedidos →
          </Link>
        }
      />
      <CycleStrip cycle={cycle} />
      <div className="demo-metrics demo-four-metrics">
        <Metric
          label="Pedidos recebidos"
          value={orders.length}
          caption="No ciclo selecionado"
        />
        <Metric
          label="Volume solicitado"
          value={`${numberBR(total)} m³`}
          caption="Soma dos itens"
          tone="green"
        />
        <Metric
          label="Com atenção"
          value={missing.length}
          caption="Dados ausentes ou vencidos"
          tone="amber"
        />
        <Metric
          label="Decididos"
          value={orders.filter((order) => order.status === "decided").length}
          caption="Com revisão humana"
        />
      </div>
      <div className="demo-two-column">
        <section className="demo-panel">
          <div className="demo-panel-heading">
            <div>
              <span className="demo-eyebrow">PRIORIDADES</span>
              <h2>Fila do ciclo</h2>
            </div>
            <Link href="/demo/operacao/fila">Ver todos →</Link>
          </div>
          {orders.length ? (
            <div className="demo-card-list">
              {orders.slice(0, 4).map((order) => (
                <OrderSummary
                  key={order.id}
                  order={order}
                  href={`/demo/operacao/pedidos/${order.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum pedido neste ciclo"
              description="A programação selecionada ainda não tem pedidos no cenário. Você pode criar um no portal do cliente."
              href="/demo/cliente/novo"
              action="Ir ao portal do cliente"
            />
          )}
        </section>
        <section className="demo-panel">
          <span className="demo-eyebrow">MARCO A MARCO</span>
          <h2>Até a confirmação da base</h2>
          <ol className="demo-deadline-list">
            <li>
              <span>01</span>
              <div>
                <strong>12h · fim da janela</strong>
                <p>Conferir recebidos e distribuidores sem pedido.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Análise e devolutiva</strong>
                <p>Decidir volumes e revisar a mensagem ao cliente.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>15h · Canal Cliente</strong>
                <p>Cliente registra os volumes no portal externo Petrobras.</p>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                <strong>15h30 · base</strong>
                <p>Confirmação externa registrada manualmente.</p>
              </div>
            </li>
          </ol>
          <Link className="demo-text-link" href="/demo/operacao/externo">
            Acompanhar marcos externos →
          </Link>
        </section>
      </div>
      {cycle.targets.length > 1 && (
        <div className="demo-notice">
          <strong>Cenário de sexta:</strong> {cycle.pumpingCount} bombeio(s)
          planejado(s) para o horizonte. A alocação por data permanece uma
          decisão aberta com a Enpulse.
        </div>
      )}
    </>
  );
}

export function OrderQueue() {
  const { gateway } = useDemo();
  const cycle = gateway.getCycle();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const snapshots = gateway.getSnapshots();
  const all = currentOrders(gateway.getOrders(), cycle.targets);
  const orders = all.filter(
    (order) =>
      (status === "all" ||
        order.status === status ||
        (status === "attention" &&
          order.lines.some(
            (line) => findSnapshot(snapshots, order, line)?.quality !== "fresh",
          ))) &&
      `${order.clientName} ${order.protocol}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="CENTRAL ENPULSE / FILA"
        title="Pedidos do ciclo"
        description="Filtre os pedidos vigentes e abra cada análise com o contexto dos dados operacionais."
      />
      <div className="demo-filterbar">
        <label>
          Buscar cliente ou protocolo
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: Aurora ou ENP-2026"
            type="search"
          />
        </label>
        <label>
          Situação
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Todas as situações</option>
            <option value="received">Recebido</option>
            <option value="review">Em análise</option>
            <option value="decided">Decidido</option>
            <option value="attention">Dados exigem atenção</option>
          </select>
        </label>
        <div className="demo-filter-count">
          <strong>{orders.length}</strong>
          <span>de {all.length} pedidos</span>
        </div>
      </div>
      <section className="demo-panel demo-table-panel">
        <div className="demo-panel-heading">
          <div>
            <span className="demo-eyebrow">
              {cycle.targets.map(shortDate).join(" · ")}
            </span>
            <h2>Fila de análise</h2>
          </div>
          <span className="demo-tiny-tag">Base Paulínia</span>
        </div>
        {orders.length ? (
          <>
            <div className="demo-table-wrap demo-desktop-table">
              <table className="demo-table">
                <thead>
                  <tr>
                    <th>Cliente / protocolo</th>
                    <th>Envio</th>
                    <th>Produtos</th>
                    <th className="number">Solicitado</th>
                    <th>Dados</th>
                    <th>Situação</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const poor = order.lines.some(
                      (line) =>
                        findSnapshot(snapshots, order, line)?.quality !==
                        "fresh",
                    );
                    return (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.clientName}</strong>
                          <small>
                            {order.protocol} · V{order.version}
                            {order.replaces ? " · reenvio" : ""}
                          </small>
                        </td>
                        <td>{timeBR(order.submittedAt)}</td>
                        <td>
                          {
                            new Set(order.lines.map((line) => line.product))
                              .size
                          }
                        </td>
                        <td className="number">
                          {numberBR(
                            order.lines.reduce(
                              (sum, line) => sum + line.requested,
                              0,
                            ),
                          )}{" "}
                          m³
                        </td>
                        <td>
                          <Status tone={poor ? "amber" : "green"}>
                            {poor ? "Revisar" : "Atualizados"}
                          </Status>
                        </td>
                        <td>
                          <OrderStatus order={order} />
                        </td>
                        <td>
                          <Link href={`/demo/operacao/pedidos/${order.id}`}>
                            Analisar →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="demo-mobile-cards">
              {orders.map((order) => (
                <OrderSummary
                  key={order.id}
                  order={order}
                  href={`/demo/operacao/pedidos/${order.id}`}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Nenhum resultado para estes filtros"
            description="Altere a busca ou a situação para ver outros pedidos do ciclo."
          />
        )}
      </section>
    </>
  );
}

function suggestion(
  order: Order,
  line: OrderLine,
  snapshot?: Snapshot,
): number | null {
  if (snapshot?.quality !== "fresh") return null;
  if (order.id === "pb-041")
    return line.product === "gasolina_a"
      ? 100
      : line.product === "s10_a"
        ? 85
        : 30;
  if (order.id === "pb-042") return line.product === "s10_a" ? 100 : 65;
  return null;
}

export function AnalysisDesk({ id }: { id: string }) {
  const { gateway, decideOrder } = useDemo();
  const order = gateway.getOrder(id);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (order?.lines ?? []).map((line) => [
        lineKey(line),
        String(line.decided ?? line.requested),
      ]),
    ),
  );
  const [reason, setReason] = useState(order?.decisionReason ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  if (!order)
    return (
      <EmptyState
        title="Pedido não encontrado"
        description="Confira o protocolo na fila do ciclo."
        href="/demo/operacao/fila"
        action="Voltar à fila"
      />
    );
  const snapshots = gateway.getSnapshots();
  const changed = order.lines.some(
    (line) => Number(values[lineKey(line)]) !== line.requested,
  );
  const poor = order.lines.some(
    (line) => findSnapshot(snapshots, order, line)?.quality !== "fresh",
  );
  function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!order) return;
    const parsed = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, Number(value)]),
    );
    if (
      Object.values(values).some((value) => value.trim() === "") ||
      Object.values(parsed).some(
        (value) => !Number.isFinite(value) || value < 0 || value > 999999.999,
      )
    ) {
      setError("Informe volumes válidos, não negativos, para todos os itens.");
      return;
    }
    if ((changed || poor) && reason.trim().length < 10) {
      setError(
        "Descreva o motivo da decisão em pelo menos 10 caracteres para ajustes ou dados incompletos.",
      );
      return;
    }
    decideOrder(order.id, parsed, reason.trim());
    setSaved(true);
  }
  return (
    <>
      <Link className="demo-back-link" href="/demo/operacao/fila">
        ← Voltar à fila
      </Link>
      <Heading
        eyebrow="CENTRAL ENPULSE / BANCADA DE ANÁLISE"
        title={order.clientName}
        description={`${order.protocol} · V${order.version} · ${order.author} · ${timeBR(order.submittedAt)} · ${[...new Set(order.lines.map((line) => shortDate(line.date)))].join(", ")}`}
        action={<OrderStatus order={order} />}
      />
      <div className="demo-notice demo-notice-amber">
        <strong>Recomendação ilustrativa.</strong> Os valores de exemplo abaixo
        não são cálculo oficial. Dados ausentes ou vencidos exigem revisão
        humana; nenhuma decisão é enviada automaticamente.
      </div>
      {order.exception && (
        <div className="demo-notice">
          <strong>Exceção declarada pelo cliente:</strong> {order.exception}
        </div>
      )}
      <div className="demo-analysis-layout">
        <div>
          <section className="demo-panel">
            <div className="demo-panel-heading">
              <div>
                <span className="demo-eyebrow">COMPARAÇÃO POR ITEM</span>
                <h2>Pedido, contexto e decisão</h2>
              </div>
              <span className="demo-tiny-tag">m³ · valores simulados</span>
            </div>
            <form onSubmit={save}>
              <div className="demo-analysis-items">
                {order.lines.map((line) => {
                  const snapshot = findSnapshot(snapshots, order, line);
                  const suggested = suggestion(order, line, snapshot);
                  const coverage =
                    snapshot?.balance !== null && snapshot?.dailyOutflow
                      ? (snapshot?.balance ?? 0) / snapshot.dailyOutflow
                      : null;
                  return (
                    <div className="demo-analysis-item" key={lineKey(line)}>
                      <div className="demo-analysis-item-heading">
                        <div>
                          <span className="demo-eyebrow">
                            {dateBR(line.date)}
                          </span>
                          <h3>{productName(line.product)}</h3>
                        </div>
                        <Status tone={qualityTone(snapshot)}>
                          {qualityLabel(snapshot)}
                        </Status>
                      </div>
                      <div className="demo-comparison">
                        <KeyValue
                          label="Solicitado"
                          value={`${numberBR(line.requested, 3)} m³`}
                        />
                        <KeyValue
                          label="Sugestão ilustrativa"
                          value={
                            suggested === null
                              ? "Indisponível"
                              : `${numberBR(suggested, 3)} m³`
                          }
                        />
                        <label>
                          Decisão humana <span>m³</span>
                          <input
                            type="number"
                            min="0"
                            max="999999.999"
                            step="0.001"
                            value={values[lineKey(line)] ?? ""}
                            onChange={(event) => {
                              setValues((current) => ({
                                ...current,
                                [lineKey(line)]: event.target.value,
                              }));
                              setSaved(false);
                            }}
                          />
                        </label>
                      </div>
                      <div className="demo-snapshot-line">
                        <span>
                          Saldo:{" "}
                          <strong>
                            {snapshot?.balance === null || !snapshot
                              ? "—"
                              : `${numberBR(snapshot.balance)} m³`}
                          </strong>
                        </span>
                        <span>
                          Saída média:{" "}
                          <strong>
                            {snapshot?.dailyOutflow === null || !snapshot
                              ? "—"
                              : `${numberBR(snapshot.dailyOutflow)} m³/dia`}
                          </strong>
                        </span>
                        <span>
                          Cobertura:{" "}
                          <strong>
                            {coverage === null
                              ? "—"
                              : `${numberBR(coverage, 1)} dias`}
                          </strong>
                        </span>
                        <span>
                          Previsão do cliente:{" "}
                          <strong>
                            {line.forecast === null
                              ? "não informada"
                              : `${numberBR(line.forecast)} m³`}
                          </strong>
                        </span>
                      </div>
                      <p className="demo-source">
                        Fonte: {snapshot?.source ?? "Não disponível"} ·{" "}
                        {snapshot?.updatedAt
                          ? `${dateBR(snapshot.updatedAt.slice(0, 10))} às ${timeBR(snapshot.updatedAt)}`
                          : "sem atualização"}{" "}
                        · Capacidade:{" "}
                        {snapshot?.capacity === null || !snapshot
                          ? "—"
                          : `${numberBR(snapshot.capacity)} m³`}
                      </p>
                    </div>
                  );
                })}
              </div>
              <label className="demo-field demo-reason">
                Motivo da decisão{" "}
                {changed || poor ? (
                  <span>obrigatório</span>
                ) : (
                  <span>opcional</span>
                )}
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="Explique o ajuste, a exceção ou a decisão com dados incompletos"
                />
              </label>
              {error && (
                <p className="demo-form-error" role="alert">
                  {error}
                </p>
              )}
              {saved && (
                <p className="demo-form-success" role="status">
                  Decisão registrada somente neste cenário. Revise a devolutiva
                  antes de marcar o envio.
                </p>
              )}
              <div className="demo-form-actions">
                <Link
                  className="demo-btn demo-btn-outline"
                  href="/demo/operacao/fila"
                >
                  Voltar à fila
                </Link>
                <button className="demo-btn demo-btn-primary" type="submit">
                  Registrar decisão simulada →
                </button>
              </div>
            </form>
          </section>
        </div>
        <aside className="demo-side-summary">
          <span className="demo-eyebrow">CONTEXTO DA ANÁLISE</span>
          <h3>
            {numberBR(
              order.lines.reduce((sum, line) => sum + line.requested, 0),
            )}{" "}
            <small>m³</small>
          </h3>
          <p>Solicitado no pedido</p>
          <div className="demo-summary-rule" />
          <KeyValue label="Versão" value={`V${order.version}`} />
          <KeyValue
            label="Itens com dados a revisar"
            value={
              order.lines.filter(
                (line) =>
                  findSnapshot(snapshots, order, line)?.quality !== "fresh",
              ).length
            }
          />
          <KeyValue
            label="Comunicação"
            value={order.communication === "sent" ? "Enviada" : "Pendente"}
          />
          <div className="demo-summary-foot">
            Saldo ÷ saída média mostra dias de cobertura. O cálculo da
            quantidade recomendada ainda será definido com a Enpulse.
          </div>
          <Link className="demo-text-link" href="/demo/operacao/devolutivas">
            Ir para devolutivas →
          </Link>
        </aside>
      </div>
    </>
  );
}

export function Communications() {
  const { gateway, setCommunication } = useDemo();
  const cycle = gateway.getCycle();
  const orders = currentOrders(gateway.getOrders(), cycle.targets).filter(
    (order) => order.status === "decided",
  );
  return (
    <>
      <Heading
        eyebrow="CENTRAL ENPULSE / DEVOLUTIVAS"
        title="Retorno ao cliente"
        description="Confira a decisão e a prévia da mensagem. O envio abaixo altera somente o cenário em memória."
      />
      {orders.length ? (
        <div className="demo-stack">
          {orders.map((order) => (
            <section className="demo-panel" key={order.id}>
              <div className="demo-panel-heading">
                <div>
                  <span className="demo-eyebrow">
                    {order.protocol} · {order.clientName}
                  </span>
                  <h2>Prévia da devolutiva</h2>
                </div>
                <Status
                  tone={
                    order.communication === "sent"
                      ? "green"
                      : order.communication === "failed"
                        ? "red"
                        : "amber"
                  }
                >
                  {order.communication === "sent"
                    ? "Enviada no cenário"
                    : order.communication === "failed"
                      ? "Falha simulada"
                      : "Aguardando envio"}
                </Status>
              </div>
              <div className="demo-message-preview">
                <div>Para: contato cadastrado da {order.clientName}</div>
                <strong>Programação de bombeio · {order.protocol}</strong>
                <p>
                  Olá. A Enpulse analisou seu pedido para{" "}
                  {Array.from(
                    new Set(order.lines.map((line) => dateBR(line.date))),
                  ).join(", ")}
                  . Confira os volumes decididos:
                </p>
                <ul>
                  {order.lines.map((line) => (
                    <li key={lineKey(line)}>
                      {dateBR(line.date)} · {productName(line.product)}:{" "}
                      <strong>{numberBR(line.decided ?? 0, 3)} m³</strong>{" "}
                      (solicitado: {numberBR(line.requested, 3)} m³)
                    </li>
                  ))}
                </ul>
                <p>
                  Registre os volumes no Canal Cliente Petrobras até 15h. A base
                  confirma até 15h30. Estes marcos são externos à plataforma.
                </p>
                {order.decisionReason && (
                  <p>
                    <strong>Motivo:</strong> {order.decisionReason}
                  </p>
                )}
              </div>
              <div className="demo-actions">
                <button
                  className="demo-btn demo-btn-primary"
                  onClick={() => setCommunication(order.id, "sent")}
                >
                  Marcar envio simulado
                </button>
                <button
                  className="demo-btn demo-btn-outline"
                  onClick={() => setCommunication(order.id, "failed")}
                >
                  Simular falha
                </button>
                <Link
                  className="demo-text-link"
                  href={`/demo/operacao/pedidos/${order.id}`}
                >
                  Rever decisão →
                </Link>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma decisão pronta para devolutiva"
          description="Registre uma decisão na bancada de análise para testar esta etapa."
          href="/demo/operacao/fila"
          action="Abrir fila"
        />
      )}
    </>
  );
}

export function ExternalTracking() {
  const { gateway, setExternal } = useDemo();
  const cycle = gateway.getCycle();
  const orders = currentOrders(gateway.getOrders(), cycle.targets).filter(
    (order) => order.status === "decided",
  );
  return (
    <>
      <Heading
        eyebrow="CENTRAL ENPULSE / ACOMPANHAMENTO EXTERNO"
        title="Marcos da programação"
        description="O Canal Cliente Petrobras e a confirmação da base permanecem externos. Registre aqui apenas a situação informada à operação."
      />
      <div className="demo-metrics">
        <Metric
          label="Canal Cliente"
          value="15h"
          caption="Prazo externo do cliente"
          tone="amber"
        />
        <Metric
          label="Confirmação da base"
          value="15h30"
          caption="Prazo externo da base"
        />
        <Metric
          label="Pedidos acompanhados"
          value={orders.length}
          caption="Com decisão humana"
          tone="green"
        />
      </div>
      {orders.length ? (
        <div className="demo-stack">
          {orders.map((order) => (
            <section className="demo-panel" key={order.id}>
              <div className="demo-panel-heading">
                <div>
                  <span className="demo-eyebrow">{order.protocol}</span>
                  <h2>{order.clientName}</h2>
                </div>
                <Status
                  tone={order.external === "complete" ? "green" : "amber"}
                >
                  {order.external === "complete"
                    ? "Concluído"
                    : order.external === "base"
                      ? "Base confirmou"
                      : order.external === "customer"
                        ? "Cliente informou"
                        : "Não iniciado"}
                </Status>
              </div>
              {order.communication !== "sent" && (
                <div className="demo-notice demo-notice-amber">
                  A devolutiva ainda não foi marcada como enviada. Registre-a no
                  cenário antes de acompanhar o Canal Cliente.
                </div>
              )}
              <div className="demo-milestone-grid">
                <div className={order.external !== "pending" ? "done" : ""}>
                  <span>01</span>
                  <strong>Cliente no Canal Petrobras</strong>
                  <small>Até 15h · informado manualmente</small>
                </div>
                <div
                  className={
                    ["base", "complete"].includes(order.external) ? "done" : ""
                  }
                >
                  <span>02</span>
                  <strong>Confirmação da base</strong>
                  <small>Até 15h30 · informado manualmente</small>
                </div>
                <div className={order.external === "complete" ? "done" : ""}>
                  <span>03</span>
                  <strong>Resultado registrado</strong>
                  <small>Sem integração automática</small>
                </div>
              </div>
              <div className="demo-actions">
                <button
                  className="demo-btn demo-btn-outline"
                  disabled={
                    order.external !== "pending" ||
                    order.communication !== "sent"
                  }
                  onClick={() => setExternal(order.id, "customer")}
                >
                  Cliente informou envio
                </button>
                <button
                  className="demo-btn demo-btn-outline"
                  disabled={order.external !== "customer"}
                  onClick={() => setExternal(order.id, "base")}
                >
                  Base confirmou
                </button>
                <button
                  className="demo-btn demo-btn-primary"
                  disabled={order.external !== "base"}
                  onClick={() => setExternal(order.id, "complete")}
                >
                  Registrar resultado
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Ainda não há marcos para acompanhar"
          description="Após uma decisão humana, o pedido aparecerá aqui."
          href="/demo/operacao/fila"
          action="Abrir fila"
        />
      )}
    </>
  );
}

export function Administration() {
  const { gateway, setPumpingCount, scenario } = useDemo();
  const cycle = gateway.getCycle();
  return (
    <>
      <Heading
        eyebrow="CENTRAL ENPULSE / ADMINISTRAÇÃO"
        title="Configuração operacional"
        description="Parâmetros e vínculos aparecem para validar a organização da interface. Nenhuma alteração persiste em um banco real."
      />
      <div className="demo-two-column">
        <section className="demo-panel">
          <span className="demo-eyebrow">CICLO E PRAZOS</span>
          <h2>Base Paulínia</h2>
          <div className="demo-detail-grid">
            <KeyValue label="Fuso" value="America/Sao_Paulo" />
            <KeyValue label="Abertura provisória" value="08h" />
            <KeyValue label="Corte proposto" value="12h" />
            <KeyValue label="Produtos" value="Gasolina A · S10 A · S500 A" />
          </div>
          <div className="demo-notice demo-notice-amber">
            Abertura às 8h ou 9h e exceções após o corte dependem de decisão da
            Enpulse. Estes valores são apenas do protótipo.
          </div>
        </section>
        <section className="demo-panel">
          <span className="demo-eyebrow">PROGRAMAÇÃO DE SEXTA</span>
          <h2>Bombeios planejados</h2>
          <p className="demo-muted">
            Escolha 1, 2 ou 3 para explorar o cenário. A alocação por data ainda
            não foi definida pela operação.
          </p>
          <label className="demo-field">
            Quantidade de bombeios
            <select
              value={cycle.pumpingCount}
              onChange={(event) =>
                setPumpingCount(Number(event.target.value) as 1 | 2 | 3)
              }
              disabled={scenario !== "friday"}
            >
              <option value={1}>1 bombeio</option>
              <option value={2}>2 bombeios</option>
              <option value={3}>3 bombeios</option>
            </select>
          </label>
          <small className="demo-muted">
            Selecione “Sexta” na barra superior para alterar este cenário.
          </small>
        </section>
      </div>
      <section className="demo-panel demo-section-gap">
        <span className="demo-eyebrow">
          IDENTIDADE E AUTORIZAÇÃO · MODELO FUTURO
        </span>
        <h2>Papéis e vínculos</h2>
        <div className="demo-role-grid">
          <div>
            <strong>Usuário do cliente</strong>
            <p>
              Acesso verificado, vinculado à distribuidora; vê e envia apenas
              seus pedidos.
            </p>
          </div>
          <div>
            <strong>Analista Enpulse</strong>
            <p>
              Consulta dados operacionais, registra análise e decisão com
              justificativa.
            </p>
          </div>
          <div>
            <strong>Gestor Enpulse</strong>
            <p>
              Administra bases, usuários, janelas e parâmetros após aprovação.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export function Reports() {
  const { gateway } = useDemo();
  const cycle = gateway.getCycle();
  const orders = currentOrders(gateway.getOrders(), cycle.targets);
  const requested = orders
    .flatMap((order) => order.lines)
    .reduce((sum, line) => sum + line.requested, 0);
  const decided = orders
    .flatMap((order) => order.lines)
    .reduce((sum, line) => sum + (line.decided ?? 0), 0);
  function exportDemo() {
    const rows = [
      [
        "protocolo",
        "cliente",
        "data",
        "produto",
        "solicitado_m3",
        "previsao_m3",
        "decidido_m3",
        "situacao",
      ],
    ];
    for (const order of orders)
      for (const line of order.lines)
        rows.push([
          order.protocol,
          order.clientName,
          line.date,
          productName(line.product),
          String(line.requested),
          line.forecast === null ? "" : String(line.forecast),
          line.decided === null ? "" : String(line.decided),
          order.status,
        ]);
    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";"),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `enpulse-demonstracao-${cycle.submissionDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <Heading
        eyebrow="CENTRAL ENPULSE / RELATÓRIOS"
        title="Resumo da programação"
        description="Totais do cenário selecionado. O arquivo exportado contém somente dados fictícios."
        action={
          <button className="demo-btn demo-btn-outline" onClick={exportDemo}>
            ↓ Exportar CSV fictício
          </button>
        }
      />
      <div className="demo-metrics">
        <Metric
          label="Pedidos"
          value={orders.length}
          caption="Ciclo selecionado"
        />
        <Metric
          label="Solicitado"
          value={`${numberBR(requested)} m³`}
          caption="Volume informado por clientes"
          tone="green"
        />
        <Metric
          label="Decidido"
          value={`${numberBR(decided)} m³`}
          caption="Pedidos analisados pela Enpulse"
        />
      </div>
      <section className="demo-panel demo-section-gap">
        <span className="demo-eyebrow">POR PRODUTO</span>
        <h2>Solicitado e decidido</h2>
        <div className="demo-table-wrap">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="number">Solicitado</th>
                <th className="number">Decidido</th>
                <th className="number">Diferença decidida</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((product) => {
                const lines = orders
                  .flatMap((order) => order.lines)
                  .filter((line) => line.product === product.code);
                const demand = lines.reduce(
                  (sum, line) => sum + line.requested,
                  0,
                );
                const decidedLines = lines.filter(
                  (line) => line.decided !== null,
                );
                const decision = decidedLines.reduce(
                  (sum, line) => sum + (line.decided ?? 0),
                  0,
                );
                const difference = decidedLines.reduce(
                  (sum, line) => sum + (line.decided ?? 0) - line.requested,
                  0,
                );
                return (
                  <tr key={product.code}>
                    <td>
                      <strong>{product.name}</strong>
                    </td>
                    <td className="number">{numberBR(demand)} m³</td>
                    <td className="number">{numberBR(decision)} m³</td>
                    <td className="number">{numberBR(difference)} m³</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="demo-muted">
          A diferença considera apenas itens já decididos. Pedidos pendentes não
          são tratados como 0 m³ decidido.
        </p>
      </section>
    </>
  );
}
