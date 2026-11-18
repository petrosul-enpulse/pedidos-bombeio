"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MockPlatformGateway } from "@/lib/plataforma/demo/gateway";
import type {
  CommunicationStatus,
  DraftOrder,
  ExternalStatus,
  Order,
  Scenario,
} from "@/lib/plataforma/types";

type DemoContext = {
  gateway: MockPlatformGateway;
  scenario: Scenario;
  revision: number;
  setScenario: (value: Scenario) => void;
  setPumpingCount: (value: 1 | 2 | 3) => void;
  submitOrder: (draft: DraftOrder) => Order;
  decideOrder: (
    id: string,
    values: Record<string, number>,
    reason: string,
  ) => Order;
  setCommunication: (id: string, status: CommunicationStatus) => void;
  setExternal: (id: string, status: ExternalStatus) => void;
};

const Context = createContext<DemoContext | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const gateway = useMemo(() => new MockPlatformGateway(), []);
  const [scenario, setScenarioState] = useState<Scenario>("weekday");
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((value) => value + 1);
  const value: DemoContext = {
    gateway,
    scenario,
    revision,
    setScenario(value) {
      gateway.setScenario(value);
      setScenarioState(value);
      refresh();
    },
    setPumpingCount(value) {
      gateway.setPumpingCount(value);
      refresh();
    },
    submitOrder(draft) {
      const order = gateway.submitOrder(draft);
      refresh();
      return order;
    },
    decideOrder(id, values, reason) {
      const order = gateway.decideOrder(id, values, reason);
      refresh();
      return order;
    },
    setCommunication(id, status) {
      gateway.setCommunication(id, status);
      refresh();
    },
    setExternal(id, status) {
      gateway.setExternal(id, status);
      refresh();
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDemo() {
  const context = useContext(Context);
  if (!context) throw new Error("DemoProvider ausente");
  return context;
}
