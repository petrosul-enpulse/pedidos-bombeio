import { INITIAL_ORDERS, SNAPSHOTS } from "./fixtures";
import type {
  CommunicationStatus,
  Cycle,
  DraftOrder,
  ExternalStatus,
  Order,
  PlatformGateway,
  Scenario,
  Snapshot,
} from "../types";

const cycleByScenario: Record<Scenario, Cycle> = {
  weekday: {
    submissionDate: "2026-11-19",
    targets: ["2026-11-20"],
    opensAt: "08:00",
    closesAt: "12:00",
    pumpingCount: 1,
    open: true,
  },
  friday: {
    submissionDate: "2026-11-20",
    targets: ["2026-11-21", "2026-11-22", "2026-11-23"],
    opensAt: "08:00",
    closesAt: "12:00",
    pumpingCount: 3,
    open: true,
  },
  closed: {
    submissionDate: "2026-11-19",
    targets: ["2026-11-20"],
    opensAt: "08:00",
    closesAt: "12:00",
    pumpingCount: 1,
    open: false,
  },
};

export class MockPlatformGateway implements PlatformGateway {
  private orders: Order[] = structuredClone(INITIAL_ORDERS);
  private scenario: Scenario = "weekday";
  private pumpingCount: 1 | 2 | 3 = 3;

  getCycle(): Cycle {
    const cycle = cycleByScenario[this.scenario];
    return {
      ...cycle,
      pumpingCount: this.scenario === "friday" ? this.pumpingCount : 1,
    };
  }
  getOrders(): Order[] {
    return this.orders;
  }
  getOrder(id: string): Order | undefined {
    return this.orders.find((order) => order.id === id);
  }
  getSnapshots(): Snapshot[] {
    return this.scenario === "friday"
      ? SNAPSHOTS.map((snapshot) =>
          snapshot.quality === "fresh"
            ? { ...snapshot, quality: "stale" }
            : snapshot,
        )
      : SNAPSHOTS;
  }
  setScenario(scenario: Scenario): void {
    this.scenario = scenario;
  }
  setPumpingCount(count: 1 | 2 | 3): void {
    this.pumpingCount = count;
  }

  submitOrder(draft: DraftOrder): Order {
    const sequence =
      46 + this.orders.filter((order) => order.id.startsWith("demo-")).length;
    const previous = this.orders.find(
      (order) =>
        order.clientId === draft.clientId &&
        order.lines.some((line) =>
          draft.lines.some((item) => item.date === line.date),
        ),
    );
    const order: Order = {
      id: `demo-${sequence}`,
      protocol: `ENP-2026-${sequence}`,
      clientId: draft.clientId,
      clientName: "Distribuidora Aurora",
      author: draft.author,
      submittedAt: `${this.getCycle().submissionDate}T09:30:00-03:00`,
      version: previous ? previous.version + 1 : 1,
      replaces: previous?.protocol,
      status: "received",
      communication: "pending",
      external: "pending",
      exception: draft.exception,
      lines: draft.lines.map((line) => ({ ...line, decided: null })),
    };
    this.orders = [order, ...this.orders];
    return order;
  }

  decideOrder(
    id: string,
    values: Record<string, number>,
    reason: string,
  ): Order {
    return this.update(id, (order) => ({
      ...order,
      status: "decided",
      decisionReason: reason,
      lines: order.lines.map((line) => ({
        ...line,
        decided: values[`${line.date}:${line.product}`] ?? line.requested,
      })),
    }));
  }
  setCommunication(id: string, status: CommunicationStatus): Order {
    return this.update(id, (order) => ({ ...order, communication: status }));
  }
  setExternal(id: string, status: ExternalStatus): Order {
    return this.update(id, (order) => ({ ...order, external: status }));
  }
  private update(id: string, change: (order: Order) => Order): Order {
    const order = this.getOrder(id);
    if (!order) throw new Error("Pedido não encontrado no cenário.");
    const next = change(order);
    this.orders = this.orders.map((item) => (item.id === id ? next : item));
    return next;
  }
}
