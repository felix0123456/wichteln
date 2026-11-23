import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import Snowfall from "@/components/Snowfall";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wichteln | Familien-Wichteldienst",
  description:
    "Der Wichteldienst für Familien und Gruppen – garantiert ohne Zuteilung innerhalb der eigenen Untergruppe.",
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
    <html
      lang="de"
      className={`${fraunces.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Snowfall />
        <div style={{ position: "relative", zIndex: 2, minHeight: "100vh" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
