"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { DEMO_BASE, DEMO_CLIENT } from "@/lib/plataforma/demo/fixtures";
import {
  dateBR,
  numberBR,
  shortDate,
  timeBR,
} from "@/lib/plataforma/demo/format";
import { PRODUCTS, type DraftLine, type Order } from "@/lib/plataforma/types";
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

export function ClientHome() {
  const { gateway } = useDemo();
  const cycle = gateway.getCycle();
  const orders = gateway
    .getOrders()
    .filter((order) => order.clientId === DEMO_CLIENT.id);
  const replaced = new Set(
    orders.map((order) => order.replaces).filter(Boolean),
  );
  const current = orders.filter(
    (order) =>
      !replaced.has(order.protocol) &&
      order.lines.some((line) => cycle.targets.includes(line.date)),
  );
  const latest = current[0];
  return (
    <>
      <Heading
        eyebrow="PORTAL DO CLIENTE / VISÃO GERAL"
        title={`Olá, ${DEMO_CLIENT.user.split(" ")[0]}.`}
        description="Acompanhe a programação de bombeio da sua distribuidora em um único lugar."
        action={
          <Link className="demo-btn demo-btn-primary" href="/demo/cliente/novo">
            + Novo pedido
          </Link>
        }
      />
      <CycleStrip cycle={cycle} />
      <div className="demo-metrics">
        <Metric
          label="Base atendida"
          value="Paulínia"
          caption="São Paulo · horário de Brasília"
        />
        <Metric
          label="Datas do ciclo"
          value={cycle.targets.length}
          caption={cycle.targets.map(shortDate).join(" · ")}
        />
        <Metric
          label="Pedido vigente"
          value={latest ? `V${latest.version}` : "—"}
          caption={latest ? latest.protocol : "Nenhum pedido neste ciclo"}
          tone="green"
        />
      </div>
      <div className="demo-two-column">
        <section className="demo-panel">
          <div className="demo-panel-heading">
            <div>
              <span className="demo-eyebrow">ESTE CICLO</span>
              <h2>Seu pedido</h2>
            </div>
            <Link href="/demo/cliente/historico">Ver histórico →</Link>
          </div>
          {latest ? (
            <OrderSummary
              order={latest}
              href={`/demo/cliente/pedidos/${latest.id}`}
            />
          ) : (
            <EmptyState
              title="Nenhum pedido neste ciclo"
              description={
                cycle.open
                  ? "Preencha os volumes para receber um protocolo simulado."
                  : "A janela está encerrada neste cenário. Selecione dia útil ou sexta para testar o envio."
              }
              href={cycle.open ? "/demo/cliente/novo" : undefined}
              action="Iniciar pedido"
            />
          )}
        </section>
        <section className="demo-panel demo-next-steps">
          <span className="demo-eyebrow">COMO FUNCIONA</span>
          <h2>Próximos passos</h2>
          <ol>
            <li>
              <strong>Envie o pedido</strong>
              <span>Informe o volume por produto e data atendida até 12h.</span>
            </li>
            <li>
              <strong>Acompanhe a análise</strong>
              <span>A equipe avalia estoque, giro e exceções.</span>
            </li>
            <li>
              <strong>Receba o retorno</strong>
              <span>
                Consulte os volumes decididos e a orientação para o Canal
                Cliente.
              </span>
            </li>
          </ol>
        </section>
      </div>
    </>
  );
}

export function ClientHistory() {
  const { gateway } = useDemo();
  const orders = gateway
    .getOrders()
    .filter((order) => order.clientId === DEMO_CLIENT.id);
  return (
    <>
      <Heading
        eyebrow="PORTAL DO CLIENTE / HISTÓRICO"
        title="Pedidos e protocolos"
        description="Cada envio preserva seu protocolo, sua versão e os volumes informados."
        action={
          <Link className="demo-btn demo-btn-primary" href="/demo/cliente/novo">
            + Novo pedido
          </Link>
        }
      />
      <section className="demo-panel">
        <div className="demo-panel-heading">
          <div>
            <span className="demo-eyebrow">DISTRIBUIDORA AURORA</span>
            <h2>{orders.length} pedidos no cenário</h2>
          </div>
        </div>
        <div className="demo-card-list">
          {orders.map((order) => (
            <OrderSummary
              key={order.id}
              order={order}
              href={`/demo/cliente/pedidos/${order.id}`}
            />
          ))}
        </div>
      </section>
    </>
  );
}

type FormValues = Record<string, { requested: string; forecast: string }>;
const keyOf = (date: string, product: string) => `${date}:${product}`;

export function NewOrder() {
  const { gateway, submitOrder } = useDemo();
  const cycle = gateway.getCycle();
  const [values, setValues] = useState<FormValues>({});
  const [exception, setException] = useState("");
  const [step, setStep] = useState<"edit" | "review" | "success">("edit");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Order | null>(null);
  const get = (key: string) => values[key] ?? { requested: "", forecast: "" };
  const update = (
    key: string,
    field: "requested" | "forecast",
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? { requested: "", forecast: "" }),
        [field]: value,
      },
    }));
    setError("");
  };
  const lines: DraftLine[] = cycle.targets.flatMap((date) =>
    PRODUCTS.map((product) => {
      const current = get(keyOf(date, product.code));
      return {
        date,
        product: product.code,
        requested: Number((current.requested || "0").replace(",", ".")),
        forecast:
          current.forecast === ""
            ? null
            : Number(current.forecast.replace(",", ".")),
      };
    }),
  );
  const total = lines.reduce((sum, line) => sum + line.requested, 0);
  function review(event: FormEvent) {
    event.preventDefault();
    if (!cycle.open) {
      setError("A janela está encerrada neste cenário.");
      return;
    }
    const invalid = Object.values(values).some((item) =>
      [item.requested, item.forecast].some(
        (value) =>
          value !== "" &&
          (!/^\d{1,6}(?:[.,]\d{1,3})?$/.test(value) ||
            Number(value.replace(",", ".")) > 999999.999),
      ),
    );
    if (invalid || total <= 0) {
      setError(
        "Informe ao menos um volume solicitado maior que zero. Use até três casas decimais e não informe números negativos.",
      );
      return;
    }
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function confirm() {
    if (!cycle.open) {
      setError("A janela está encerrada neste cenário.");
      setStep("edit");
      return;
    }
    const order = submitOrder({
      clientId: DEMO_CLIENT.id,
      author: DEMO_CLIENT.user,
      lines,
      exception: exception.trim() || undefined,
    });
    setResult(order);
    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (step === "success" && result)
    return (
      <>
        <Heading
          eyebrow="PORTAL DO CLIENTE / PEDIDO SIMULADO"
          title="Pedido registrado no cenário."
          description="O protocolo abaixo existe apenas nesta demonstração e será perdido ao recarregar a página."
        />
        <div className="demo-success-card" aria-live="polite">
          <div className="demo-success-check">✓</div>
          <span className="demo-eyebrow">PROTOCOLO DE DEMONSTRAÇÃO</span>
          <strong>{result.protocol}</strong>
          <p>
            {result.lines.length} itens · {numberBR(total)} m³ solicitados ·{" "}
            {result.version > 1
              ? `reenvio V${result.version}`
              : "primeira versão"}
          </p>
          <div className="demo-actions">
            <Link
              className="demo-btn demo-btn-primary"
              href={`/demo/cliente/pedidos/${result.id}`}
            >
              Ver acompanhamento →
            </Link>
            <Link className="demo-btn demo-btn-outline" href="/demo/cliente">
              Voltar ao início
            </Link>
          </div>
        </div>
      </>
    );

  return (
    <>
      <Heading
        eyebrow="PORTAL DO CLIENTE / NOVO PEDIDO"
        title={
          step === "review"
            ? "Revise antes de enviar."
            : "Novo pedido de bombeio"
        }
        description={
          step === "review"
            ? "Confira as datas, volumes e previsão informada. O envio será apenas simulado."
            : "Informe os volumes por produto para cada data atendida neste ciclo."
        }
      />
      <CycleStrip cycle={cycle} />
      {!cycle.open && (
        <div className="demo-notice demo-notice-amber" role="alert">
          <strong>Envio indisponível neste cenário.</strong> A janela encerrou
          às 12h. Troque o cenário no topo para testar o pedido.
        </div>
      )}
      {cycle.targets.length > 1 && (
        <div className="demo-notice">
          <strong>Programação de sexta-feira.</strong> O cenário mostra sábado,
          domingo e segunda. A distribuição final dos {cycle.pumpingCount}{" "}
          bombeios ainda depende de validação da Enpulse.
        </div>
      )}
      <div className="demo-form-layout">
        <div>
          {step === "edit" ? (
            <form onSubmit={review} noValidate>
              <section className="demo-panel">
                <div className="demo-panel-heading">
                  <div>
                    <span className="demo-eyebrow">
                      IDENTIFICAÇÃO VERIFICADA · SIMULAÇÃO
                    </span>
                    <h2>Distribuidora e base</h2>
                  </div>
                  <Status tone="green">Vínculo simulado</Status>
                </div>
                <div className="demo-detail-grid">
                  <KeyValue label="Distribuidora" value={DEMO_CLIENT.name} />
                  <KeyValue label="CNPJ fictício" value={DEMO_CLIENT.cnpj} />
                  <KeyValue label="Base" value={DEMO_BASE} />
                  <KeyValue label="Responsável" value={DEMO_CLIENT.user} />
                </div>
              </section>
              {cycle.targets.map((date) => (
                <section className="demo-panel demo-form-panel" key={date}>
                  <div className="demo-panel-heading">
                    <div>
                      <span className="demo-eyebrow">
                        DATA ATENDIDA · {dateBR(date)}
                      </span>
                      <h2>{shortDate(date)}</h2>
                    </div>
                    <span className="demo-tiny-tag">Volumes em m³</span>
                  </div>
                  <div className="demo-product-list">
                    {PRODUCTS.map((product) => {
                      const key = keyOf(date, product.code);
                      return (
                        <div className="demo-product-row" key={key}>
                          <div className="demo-product-name">
                            <span className="demo-product-dot" />
                            <strong>{product.name}</strong>
                            <small>{product.short}</small>
                          </div>
                          <label>
                            Solicitado <span>m³</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max="999999.999"
                              step="0.001"
                              value={get(key).requested}
                              onChange={(event) =>
                                update(key, "requested", event.target.value)
                              }
                              placeholder="0,000"
                            />
                          </label>
                          <label>
                            Previsão de saída <span>opcional · m³</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max="999999.999"
                              step="0.001"
                              value={get(key).forecast}
                              onChange={(event) =>
                                update(key, "forecast", event.target.value)
                              }
                              placeholder="Não informada"
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
              <section className="demo-panel">
                <span className="demo-eyebrow">CONTEXTO OPCIONAL</span>
                <h2>Saída extraordinária</h2>
                <p className="demo-muted">
                  Se uma venda excepcional justificar o volume, descreva-a para
                  a análise humana.
                </p>
                <label className="demo-field">
                  Justificativa
                  <textarea
                    value={exception}
                    onChange={(event) => setException(event.target.value)}
                    rows={4}
                    placeholder="Ex.: contrato extraordinário com saída prevista para amanhã"
                  />
                </label>
              </section>
              {error && (
                <p className="demo-form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="demo-form-actions">
                <Link className="demo-btn demo-btn-ghost" href="/demo/cliente">
                  Cancelar
                </Link>
                <button
                  className="demo-btn demo-btn-primary"
                  disabled={!cycle.open}
                  type="submit"
                >
                  Revisar pedido →
                </button>
              </div>
            </form>
          ) : (
            <section className="demo-panel">
              <span className="demo-eyebrow">REVISÃO · ENVIO SIMULADO</span>
              <h2>Resumo do pedido</h2>
              <p className="demo-muted">
                {DEMO_CLIENT.name} · {DEMO_BASE} · envio em{" "}
                {dateBR(cycle.submissionDate)} até 12h
              </p>
              {cycle.targets.map((date) => (
                <div key={date} className="demo-review-date">
                  <h3>
                    {shortDate(date)} · {dateBR(date)}
                  </h3>
                  {lines
                    .filter((line) => line.date === date)
                    .map((line) => (
                      <div
                        className="demo-review-row"
                        key={keyOf(date, line.product)}
                      >
                        <span>{productName(line.product)}</span>
                        <strong>{numberBR(line.requested, 3)} m³</strong>
                        <small>
                          Previsão:{" "}
                          {line.forecast === null
                            ? "não informada"
                            : `${numberBR(line.forecast, 3)} m³`}
                        </small>
                      </div>
                    ))}
                </div>
              ))}
              {exception && (
                <div className="demo-notice">
                  <strong>Justificativa:</strong> {exception}
                </div>
              )}
              {error && (
                <p className="demo-form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="demo-form-actions">
                <button
                  className="demo-btn demo-btn-outline"
                  onClick={() => setStep("edit")}
                >
                  Editar volumes
                </button>
                <button className="demo-btn demo-btn-primary" onClick={confirm}>
                  Confirmar envio simulado →
                </button>
              </div>
            </section>
          )}
        </div>
        <aside className="demo-side-summary">
          <span className="demo-eyebrow">RESUMO DO CICLO</span>
          <h3>
            {numberBR(total, 3)} <small>m³</small>
          </h3>
          <p>Volume total solicitado</p>
          <div className="demo-summary-rule" />
          <KeyValue label="Datas" value={cycle.targets.length} />
          <KeyValue label="Produtos" value={PRODUCTS.length} />
          <KeyValue
            label="Previsão ausente"
            value={`${lines.filter((line) => line.forecast === null).length} itens`}
          />
          <div className="demo-summary-foot">
            Previsão não informada é diferente de 0 m³. Na futura análise, será
            usada a média histórica quando disponível.
          </div>
        </aside>
      </div>
    </>
  );
}

export function ClientOrderDetail({ id }: { id: string }) {
  const { gateway } = useDemo();
  const order = gateway.getOrder(id);
  if (!order || order.clientId !== DEMO_CLIENT.id)
    return (
      <EmptyState
        title="Pedido não encontrado"
        description="Este protocolo não pertence à persona cliente da demonstração."
        href="/demo/cliente/historico"
        action="Voltar ao histórico"
      />
    );
  const replacement = gateway
    .getOrders()
    .find((item) => item.replaces === order.protocol);
  const total = order.lines.reduce((sum, line) => sum + line.requested, 0);
  return (
    <>
      <Link href="/demo/cliente/historico" className="demo-back-link">
        ← Histórico de pedidos
      </Link>
      <Heading
        eyebrow="PORTAL DO CLIENTE / ACOMPANHAMENTO"
        title={order.protocol}
        description={`${order.clientName} · enviado em ${dateBR(order.submittedAt.slice(0, 10))} às ${timeBR(order.submittedAt)} · versão ${order.version}`}
        action={<OrderStatus order={order} />}
      />
      {replacement && (
        <div className="demo-notice demo-notice-amber">
          Este protocolo foi substituído por{" "}
          <Link href={`/demo/cliente/pedidos/${replacement.id}`}>
            <strong>{replacement.protocol}</strong>
          </Link>
          . A versão antiga permanece disponível para consulta.
        </div>
      )}
      {order.replaces && (
        <div className="demo-notice">
          Este pedido substitui o protocolo {order.replaces}. O histórico
          anterior permanece preservado no cenário.
        </div>
      )}
      <div className="demo-metrics">
        <Metric
          label="Volume solicitado"
          value={`${numberBR(total)} m³`}
          caption="Soma de todos os itens"
        />
        <Metric
          label="Itens"
          value={order.lines.length}
          caption="Produtos × datas atendidas"
        />
        <Metric
          label="Devolutiva"
          value={
            order.communication === "sent"
              ? "Enviada"
              : order.communication === "failed"
                ? "Falhou"
                : "Pendente"
          }
          caption="Status simulado"
          tone={order.communication === "sent" ? "green" : "amber"}
        />
      </div>
      <div className="demo-two-column">
        <section className="demo-panel">
          <span className="demo-eyebrow">VOLUMES POR DATA E PRODUTO</span>
          <h2>Pedido e decisão</h2>
          <div className="demo-table-wrap">
            <table className="demo-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th className="number">Solicitado</th>
                  <th className="number">Previsão</th>
                  <th className="number">Decidido</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={keyOf(line.date, line.product)}>
                    <td>{dateBR(line.date)}</td>
                    <td>{productName(line.product)}</td>
                    <td className="number">{numberBR(line.requested, 3)} m³</td>
                    <td className="number">
                      {line.forecast === null
                        ? "Não informada"
                        : `${numberBR(line.forecast, 3)} m³`}
                    </td>
                    <td className="number">
                      {line.decided === null
                        ? "Em análise"
                        : `${numberBR(line.decided, 3)} m³`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {order.decisionReason && (
            <div className="demo-notice">
              <strong>Motivo da decisão:</strong> {order.decisionReason}
            </div>
          )}
          {order.exception && (
            <p className="demo-muted">
              <strong>Exceção informada:</strong> {order.exception}
            </p>
          )}
        </section>
        <section className="demo-panel">
          <span className="demo-eyebrow">LINHA DO TEMPO</span>
          <h2>Próximo passo</h2>
          <ol className="demo-timeline">
            <li className="done">
              <strong>Pedido recebido</strong>
              <span>
                {timeBR(order.submittedAt)} · {order.author}
              </span>
            </li>
            <li className={order.status === "decided" ? "done" : "current"}>
              <strong>Análise da Enpulse</strong>
              <span>
                {order.status === "decided"
                  ? "Volume decidido pela equipe"
                  : "Aguardando decisão humana"}
              </span>
            </li>
            <li className={order.communication === "sent" ? "done" : ""}>
              <strong>Devolutiva</strong>
              <span>
                {order.communication === "sent"
                  ? "Mensagem marcada como enviada no cenário"
                  : "Aguardando comunicação"}
              </span>
            </li>
            <li className={order.external === "pending" ? "" : "done"}>
              <strong>Canal Cliente Petrobras</strong>
              <span>Registro externo até 15h · acompanhamento manual</span>
            </li>
            <li
              className={
                order.external === "base" || order.external === "complete"
                  ? "done"
                  : ""
              }
            >
              <strong>Confirmação da base</strong>
              <span>Marco externo até 15h30</span>
            </li>
          </ol>
        </section>
      </div>
    </>
  );
}
