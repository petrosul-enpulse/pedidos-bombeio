import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido de Bombeio | Enpulse Energia",
  description: "Envie seu pedido de bombeio e previsão de venda para a Base Paulínia/SP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
