import type { Metadata } from "next";
import PvDashboard from "../src/PvDashboard";

export const metadata: Metadata = {
  title: "PV Digital Twin Analytics",
  description:
    "A React dashboard for ESP32 photovoltaic digital twin monitoring with multi-sensor fusion, XAI fault diagnosis, and relay self-healing.",
};

export default function Home() {
  return <PvDashboard />;
}
