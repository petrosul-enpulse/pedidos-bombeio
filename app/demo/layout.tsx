import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DemoProvider } from "./demo-provider";
import { DemoShell } from "./demo-shell";
import "./demo.css";

export const metadata = { title: "Protótipo da plataforma | Enpulse Energia" };

export default function DemoLayout({ children }: { children: ReactNode }) {
  const enabled =
    process.env.NODE_ENV === "development" ||
    (process.env.ENPULSE_ENABLE_DEMO === "true" &&
      process.env.VERCEL_ENV === "preview");
  if (!enabled) notFound();
  return (
    <DemoProvider>
      <DemoShell>{children}</DemoShell>
    </DemoProvider>
  );
}
