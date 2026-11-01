import type { Metadata } from "next";
import "@/styles/globals.css";
import Snowfall from "@/components/Snowfall";

export const metadata: Metadata = {
  title: "Wichteln | Familien-Wichteldienst",
  description:
    "Der festliche Wichteldienst für die Großfamilie – garantiert ohne Zuteilung innerhalb der eigenen Haushaltsgruppe.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎁</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Snowfall />
        <div style={{ position: "relative", zIndex: 2, minHeight: "100vh" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
