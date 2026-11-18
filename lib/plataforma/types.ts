export const PRODUCTS = [
  { code: "gasolina_a", name: "Gasolina A", short: "GAS A" },
  { code: "s10_a", name: "Diesel S10 A", short: "S10 A" },
  { code: "s500_a", name: "Diesel S500 A", short: "S500 A" },
] as const;

export type ProductCode = (typeof PRODUCTS)[number]["code"];
export type Scenario = "weekday" | "friday" | "closed";
export type OrderStatus = "received" | "review" | "decided";
export type DataQuality = "fresh" | "stale" | "missing";
export type CommunicationStatus = "pending" | "sent" | "failed";
export type ExternalStatus = "pending" | "customer" | "base" | "complete";

export type Cycle = {
  submissionDate: string;
  targets: string[];
  opensAt: string;
  closesAt: string;
  pumpingCount: 1 | 2 | 3;
  open: boolean;
};

export type OrderLine = {
  date: string;
  product: ProductCode;
  requested: number;
  forecast: number | null;
  decided: number | null;
};

export type Order = {
  id: string;
  protocol: string;
  clientId: string;
  clientName: string;
  author: string;
  submittedAt: string;
  version: number;
  replaces?: string;
  status: OrderStatus;
  communication: CommunicationStatus;
  external: ExternalStatus;
  exception?: string;
  decisionReason?: string;
  lines: OrderLine[];
};

export type Snapshot = {
  clientId: string;
  product: ProductCode;
  balance: number | null;
  dailyOutflow: number | null;
  capacity: number | null;
  source: string;
  updatedAt: string | null;
  quality: DataQuality;
};

export type DraftLine = {
  date: string;
  product: ProductCode;
  requested: number;
  forecast: number | null;
};
export type DraftOrder = {
  clientId: string;
  author: string;
  lines: DraftLine[];
  exception?: string;
};

export interface PlatformGateway {
  getCycle(): Cycle;
  getOrders(): Order[];
  getOrder(id: string): Order | undefined;
  getSnapshots(): Snapshot[];
  submitOrder(draft: DraftOrder): Order;
  decideOrder(
    id: string,
    values: Record<string, number>,
    reason: string,
  ): Order;
  setCommunication(id: string, status: CommunicationStatus): Order;
  setExternal(id: string, status: ExternalStatus): Order;
  setScenario(scenario: Scenario): void;
  setPumpingCount(count: 1 | 2 | 3): void;
}
