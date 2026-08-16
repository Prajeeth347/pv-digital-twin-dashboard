import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prajeeth347.github.io/pv-digital-twin-dashboard/"),
  title: "PV Digital Twin Dashboard",
  description:
    "Adaptive Edge AI dashboard for photovoltaic health monitoring, explainable fault diagnosis, predictive maintenance, and self-healing relay control.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "PV Digital Twin Dashboard",
    description:
      "ESP32 sensor fusion, TinyML fault diagnosis, XAI explanations, and autonomous PV protection in one dashboard.",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PV Digital Twin Dashboard",
    description:
      "ESP32 sensor fusion, TinyML fault diagnosis, XAI explanations, and autonomous PV protection in one dashboard.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
