"use client";

import { useEffect, useMemo, useState } from "react";

const navItems = ["Overview", "Sensors", "Faults", "Twin", "Maintenance"];

const summaryCards = [
  ["Panel Health", "92%", "+4.8%", "Stable against adaptive baseline"],
  ["Power Output", "168.3 W", "+12.6%", "Compared with last cloudy cycle"],
  ["Efficiency", "84.7%", "-2.1%", "Partial shading is reducing yield"],
  ["Fault Risk", "Low", "87%", "XAI confidence for shading"],
];

const sensorRows = [
  ["INA219", "Voltage / Current", "36.4 V", "4.62 A", "Normal"],
  ["DS18B20", "Panel Temperature", "45.2 C", "+1.8 C drift", "Watch"],
  ["DHT22", "Ambient / Humidity", "32.6 C", "48% RH", "Normal"],
  ["BH1750", "Solar Irradiance", "680 W/m2", "94% stable", "Normal"],
];

const faultBars = [
  ["Partial Shading", 61, "#1b47db"],
  ["Dust Accumulation", 23, "#6997e4"],
  ["Panel Aging", 18, "#b26552"],
  ["Hotspot", 12, "#f06b5f"],
  ["Loose Connection", 9, "#94b5e3"],
];

const componentRows = [
  ["PV Module", "Generating DC power", "Online", "Healthy"],
  ["Sensor Bus", "INA219, DS18B20, DHT22, BH1750", "Sampling", "Stable"],
  ["ESP32 Controller", "TinyML inference and baseline update", "Running", "42 ms"],
  ["XAI Engine", "Reason, confidence, corrective action", "Ready", "87%"],
  ["IoT Cloud", "Dashboard sync and notifications", "Synced", "Live"],
  ["Relay Driver", "Control signal amplification", "Armed", "Safe"],
  ["Relay Module", "Panel isolation and reconnection", "ON", "Connected"],
  ["Cleaning Unit", "Pump and motorized wiper", "Standby", "Dust mode"],
];

const timeRanges = {
  today: {
    label: "Today",
    chartLabel: "Today",
    chartBars: [32, 44, 36, 52, 67, 73, 61, 78, 84, 72, 88, 93],
    labels: ["06:00", "09:00", "12:00", "15:00", "18:00"],
  },
  "24h": {
    label: "Last 24 hours",
    chartLabel: "Last 24 hours",
    chartBars: [28, 35, 47, 43, 60, 69, 75, 81, 70, 76, 85, 79],
    labels: ["00:00", "06:00", "12:00", "18:00", "Now"],
  },
  "7d": {
    label: "Last 7 days",
    chartLabel: "Last 7 days",
    chartBars: [67, 72, 61, 82, 77, 85, 63, 69, 74, 88, 80, 84],
    labels: ["Mon", "Tue", "Wed", "Thu", "Sun"],
  },
};

const widgetOptions = [
  {
    id: "environment",
    title: "Environmental Context",
    detail: "Irradiance and ambient conditions remain within the expected range.",
    metrics: [["Irradiance", "680 W/m2"], ["Ambient", "32.6 C"], ["Humidity", "48% RH"]],
  },
  {
    id: "protection",
    title: "Self-Healing Protection",
    detail: "Relay path is armed. The panel will isolate automatically if a critical fault is detected.",
    metrics: [["Relay", "ON"], ["Protection", "Armed"], ["Cleaning", "Standby"]],
  },
];

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

function createExport(rangeKey) {
  const range = timeRanges[rangeKey];
  const rows = [
    ["PV Digital Twin Report"],
    ["Range", range.label],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Sensor", "Reading", "Secondary reading", "Status"],
    ...sensorRows.map(([sensor, , primary, secondary, state]) => [sensor, primary, secondary, state]),
    [],
    ["Fault diagnosis", "Probability"],
    ...faultBars.map(([label, value]) => [label, `${value}%`]),
    [],
    ["Component", "Status", "Signal"],
    ...componentRows.map(([component, , status, signal]) => [component, status, signal]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `pv-digital-twin-${rangeKey}-report.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export default function PvDashboard() {
  const [rangeKey, setRangeKey] = useState("today");
  const [isRangeMenuOpen, setIsRangeMenuOpen] = useState(false);
  const [isWidgetMenuOpen, setIsWidgetMenuOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState(null);
  const [notice, setNotice] = useState("");
  const range = timeRanges[rangeKey];
  const today = useMemo(formatToday, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  function selectRange(nextRange) {
    setRangeKey(nextRange);
    setIsRangeMenuOpen(false);
    setNotice(`${timeRanges[nextRange].label} data is now displayed.`);
  }

  function addWidget(widget) {
    setActiveWidget(widget);
    setIsWidgetMenuOpen(false);
    setNotice(`${widget.title} was added to the dashboard.`);
  }

  function exportReport() {
    createExport(rangeKey);
    setNotice("The CSV report has been downloaded.");
  }

  return (
    <main className="analytics-shell">
      <aside className="sidebar">
        <div className="brand">
          <span aria-hidden="true">P</span>
          <div>
            <strong>PV Twin</strong>
            <small>Edge AI Monitor</small>
          </div>
        </div>

        <nav aria-label="Dashboard sections">
          {navItems.map((item) => (
            <a href={`#${item.toLowerCase()}`} key={item}>
              {item}
            </a>
          ))}
        </nav>

        <div className="controller-card">
          <span>ESP32 Status</span>
          <strong>Running</strong>
          <p>Local TinyML model processing fused sensor data.</p>
        </div>
      </aside>

      <section className="dashboard" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">Adaptive explainable photovoltaic monitoring</p>
            <h1>Digital Twin Dashboard</h1>
          </div>
          <div className="toolbar" aria-label="Dashboard controls">
            <div className="toolbar-menu">
              <button
                type="button"
                aria-expanded={isRangeMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsRangeMenuOpen((isOpen) => !isOpen)}
              >
                Today <span aria-hidden="true">v</span>
              </button>
              {isRangeMenuOpen && (
                <div className="action-menu" role="menu" aria-label="Choose dashboard period">
                  {Object.entries(timeRanges).map(([key, value]) => (
                    <button
                      type="button"
                      className={key === rangeKey ? "selected" : ""}
                      key={key}
                      onClick={() => selectRange(key)}
                      role="menuitem"
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={exportReport}>Export</button>
            <div className="toolbar-menu">
              <button
                type="button"
                className="primary-button"
                aria-expanded={isWidgetMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsWidgetMenuOpen((isOpen) => !isOpen)}
              >
                Add Widget
              </button>
              {isWidgetMenuOpen && (
                <div className="action-menu widget-menu" role="menu" aria-label="Add a dashboard widget">
                  {widgetOptions.map((widget) => (
                    <button type="button" key={widget.id} onClick={() => addWidget(widget)} role="menuitem">
                      <strong>{widget.title}</strong>
                      <small>{widget.detail}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <p className="date-context">Showing {range.label.toLowerCase()} data · {today}</p>

        <section className="summary-grid" aria-label="PV health summary">
          {summaryCards.map(([label, value, delta, note]) => (
            <article className="summary-card" key={label}>
              <div>
                <span>{label}</span>
              </div>
              <strong>{value}</strong>
              <p className={delta.startsWith("-") ? "negative" : ""}>{delta}</p>
              <small>{note}</small>
            </article>
          ))}
        </section>

        <section className="main-grid">
          <article className="chart-card">
            <div className="card-header">
              <div>
                <span>PV Output Analytics</span>
                <h2>Power generation trend</h2>
              </div>
              <select
                aria-label="Power chart range"
                value={rangeKey}
                onChange={(event) => selectRange(event.target.value)}
              >
                <option value="today">Today</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </div>
            <div className="chart-area" aria-label={`Bar chart of PV output for ${range.chartLabel}`}>
              {range.chartBars.map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
              <div className="chart-tooltip">
                <strong>168.3 W</strong>
                <small>Peak after baseline correction</small>
              </div>
            </div>
            <div className="chart-labels">
              {range.labels.map((label) => <span key={label}>{label}</span>)}
            </div>
          </article>

          <article className="twin-card" id="twin">
            <div className="card-header">
              <div>
                <span>Live PV Twin</span>
                <h2>Panel condition</h2>
              </div>
              <b>92%</b>
            </div>
            <div className="panel-visual" aria-label="Solar panel digital twin visual">
              {Array.from({ length: 30 }).map((_, index) => (
                <i key={index} className={index === 7 || index === 8 ? "dim" : ""} />
              ))}
            </div>
            <div className="twin-status">
              <span>Relay ON</span>
              <span>No critical fault</span>
            </div>
          </article>

          <article className="sensor-card" id="sensors">
            <div className="card-header">
              <div>
                <span>Multi-Sensor Fusion</span>
                <h2>Sensor readings</h2>
              </div>
              <b>4 active</b>
            </div>
            <div className="sensor-list">
              {sensorRows.map(([sensor, role, primary, secondary, state]) => (
                <div key={sensor}>
                  <strong>{sensor}</strong>
                  <p>{role}</p>
                  <span>{primary}</span>
                  <span>{secondary}</span>
                  <em className={state === "Watch" ? "watch" : ""}>{state}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="fault-card" id="faults">
            <div className="card-header">
              <div>
                <span>XAI Fault Diagnosis</span>
                <h2>Root-cause probability</h2>
              </div>
              <b>87%</b>
            </div>
            <div className="fault-bars">
              {faultBars.map(([label, value, color]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div><i style={{ width: `${value}%`, background: color }} /></div>
                  <strong>{value}%</strong>
                </div>
              ))}
            </div>
            <p className="insight">
              XAI reason: current dropped while irradiance stayed stable. Inspect
              the upper-right panel area for temporary shadow.
            </p>
          </article>

          <article className="maintenance-card" id="maintenance">
            <span>Predictive Maintenance</span>
            <h2>14 days</h2>
            <p>Estimated next inspection window based on fault history, panel temperature drift, and efficiency trend.</p>
            <button type="button" onClick={() => setNotice("A maintenance service note is ready for review.")}>Create service note</button>
          </article>

          {activeWidget && (
            <article className="widget-card">
              <div className="card-header">
                <div>
                  <span>Added Widget</span>
                  <h2>{activeWidget.title}</h2>
                </div>
                <button type="button" onClick={() => setActiveWidget(null)}>Remove</button>
              </div>
              <p>{activeWidget.detail}</p>
              <div className="widget-metrics">
                {activeWidget.metrics.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>

        <section className="component-table">
          <div className="card-header">
            <div>
              <span>System Components</span>
              <h2>Hardware and control chain</h2>
            </div>
            <span className="sync-state">System ready</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {componentRows.map(([component, purpose, status, signal]) => (
                <tr key={component}>
                  <td>{component}</td>
                  <td>{purpose}</td>
                  <td><span>{status}</span></td>
                  <td>{signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>

      {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}
    </main>
  );
}
