"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "pv-digital-twin-admin-settings";

const DEFAULT_SETTINGS = {
  voltage: 36.4,
  current: 4.62,
  panelTemp: 45.2,
  ambientTemp: 32.6,
  humidity: 48,
  irradiance: 680,
  panelArea: 0.292,
  criticalTemp: 68,
  nominalVoltage: 36.4,
};

const navItems = [
  ["Overview", "overview"],
  ["Sensors", "sensors"],
  ["Faults", "faults"],
  ["Twin", "twin"],
  ["Maintenance", "maintenance"],
  ["Admin Centre", "admin-centre"],
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
  ["environment", "Environmental Context"],
  ["protection", "Self-Healing Protection"],
];

const adminGroups = [
  {
    title: "Live sensor inputs",
    fields: [
      ["voltage", "PV voltage", "V", 0.1, 0],
      ["current", "PV current", "A", 0.01, 0],
      ["panelTemp", "Panel temperature", "C", 0.1, -20],
      ["ambientTemp", "Ambient temperature", "C", 0.1, -20],
      ["humidity", "Humidity", "% RH", 1, 0],
      ["irradiance", "Solar irradiance", "W/m2", 1, 0],
    ],
  },
  {
    title: "Protection thresholds",
    fields: [
      ["panelArea", "Active panel area", "m2", 0.001, 0.01],
      ["criticalTemp", "Critical panel temperature", "C", 1, 35],
      ["nominalVoltage", "Nominal PV voltage", "V", 0.1, 1],
    ],
  },
];

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function decimal(value, places = 1) {
  return Number(value).toFixed(places);
}

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

function restoreSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const savedSettings = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return Object.fromEntries(
      Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => {
        const value = Number(savedSettings[key]);
        return [key, Number.isFinite(value) ? value : fallback];
      }),
    );
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getStatusTone(status) {
  if (["Critical", "Isolated", "Fault"].includes(status)) return "critical";
  if (["Watch", "Recommended", "Limited"].includes(status)) return "watch";
  return "normal";
}

function getTwinMetrics(rawSettings) {
  const settings = Object.fromEntries(
    Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => {
      const value = Number(rawSettings[key]);
      return [key, Number.isFinite(value) ? value : fallback];
    }),
  );
  const power = Math.max(0, settings.voltage * settings.current);
  const availablePower = Math.max(1, settings.irradiance * settings.panelArea);
  const efficiency = clamp((power / availablePower) * 100, 0, 100);
  const temperatureDelta = settings.panelTemp - settings.ambientTemp;
  const thermalPenalty = Math.max(0, settings.panelTemp - 40) * 1.1;
  const efficiencyPenalty = Math.max(0, 90 - efficiency) * 0.5;
  const humidityPenalty = Math.max(0, settings.humidity - 70) * 0.2;
  const voltagePenalty = settings.irradiance > 350
    ? Math.max(0, settings.nominalVoltage - settings.voltage) * 2.8
    : 0;
  const health = Math.round(clamp(100 - thermalPenalty - efficiencyPenalty - humidityPenalty - voltagePenalty, 12, 100));
  const criticalFault = settings.panelTemp >= settings.criticalTemp
    || (settings.irradiance > 400 && settings.voltage < settings.nominalVoltage * 0.65)
    || (settings.irradiance > 500 && efficiency < 45);
  const relayOn = !criticalFault;
  const faultBars = [
    ["Partial Shading", clamp(Math.round(61 + (680 - settings.irradiance) * 0.12 + (85 - efficiency) * 0.35), 3, 96), "#1b47db"],
    ["Dust Accumulation", clamp(Math.round(23 + (82 - efficiency) * 1.2 + Math.max(0, settings.humidity - 65) * 0.25), 3, 95), "#6997e4"],
    ["Panel Aging", clamp(Math.round(18 + Math.max(0, 85 - efficiency) * 0.9), 3, 92), "#b26552"],
    ["Hotspot", clamp(Math.round(12 + Math.max(0, settings.panelTemp - 45) * 2.5), 3, 99), "#f06b5f"],
    ["Loose Connection", clamp(Math.round(9 + Math.max(0, settings.nominalVoltage - settings.voltage) * 9), 3, 96), "#94b5e3"],
  ];
  const [diagnosis, topScore] = [...faultBars].sort((a, b) => b[1] - a[1])[0];
  const confidence = clamp(Math.round(65 + topScore * 0.36), 70, 99);
  const risk = criticalFault ? "Critical" : health < 75 || topScore >= 82 ? "Watch" : "Low";
  const maintenanceWindow = criticalFault ? "Immediate" : health < 75 ? "3 days" : health < 86 ? "7 days" : "14 days";
  const panelState = criticalFault ? "Isolated" : health < 75 ? "Limited" : "Healthy";
  const sensorRows = [
    ["INA219", "Voltage / Current", `${decimal(settings.voltage)} V`, `${decimal(settings.current, 2)} A`, settings.voltage < settings.nominalVoltage * 0.75 ? "Watch" : "Normal"],
    ["DS18B20", "Panel Temperature", `${decimal(settings.panelTemp)} C`, `${temperatureDelta >= 0 ? "+" : ""}${decimal(temperatureDelta)} C vs ambient`, criticalFault ? "Critical" : settings.panelTemp > 42 ? "Watch" : "Normal"],
    ["DHT22", "Ambient / Humidity", `${decimal(settings.ambientTemp)} C`, `${decimal(settings.humidity)}% RH`, settings.humidity > 75 ? "Watch" : "Normal"],
    ["BH1750", "Solar Irradiance", `${decimal(settings.irradiance)} W/m2`, settings.irradiance < 350 ? "Low light" : "Stable", settings.irradiance < 350 ? "Watch" : "Normal"],
  ];
  const componentRows = [
    ["PV Module", "Generating DC power", relayOn ? "Online" : "Isolated", panelState],
    ["Sensor Bus", "INA219, DS18B20, DHT22, BH1750", "Sampling", "Live"],
    ["ESP32 Controller", "TinyML inference and baseline update", "Running", "42 ms"],
    ["XAI Engine", "Reason, confidence, corrective action", "Ready", `${confidence}%`],
    ["IoT Cloud", "Dashboard sync and notifications", "Synced", "Live"],
    ["Relay Driver", "Control signal amplification", relayOn ? "Armed" : "Protecting", relayOn ? "Safe" : "Trip active"],
    ["Relay Module", "Panel isolation and reconnection", relayOn ? "ON" : "OFF", relayOn ? "Connected" : "Panel isolated"],
    ["Cleaning Unit", "Pump and motorized wiper", diagnosis === "Dust Accumulation" && topScore >= 55 ? "Recommended" : "Standby", diagnosis === "Dust Accumulation" ? "Dust mode" : "Ready"],
  ];
  const reasons = {
    "Partial Shading": `Irradiance is ${decimal(settings.irradiance)} W/m2 and output is below the adaptive daylight baseline. Inspect the panel surface for temporary shade.`,
    "Dust Accumulation": `Conversion efficiency is ${decimal(efficiency)}%, lower than the configured clean-panel baseline. Inspect the surface and use the cleaning unit if needed.`,
    "Panel Aging": `The long-term efficiency pattern is below the calibrated expectation. Schedule a visual inspection during the next maintenance window.`,
    Hotspot: `Panel temperature is ${decimal(settings.panelTemp)} C. Check for heat concentration and confirm that ventilation is unobstructed.`,
    "Loose Connection": `PV voltage is ${decimal(settings.voltage)} V against a ${decimal(settings.nominalVoltage)} V nominal setting. Inspect terminals and cable connections.`,
  };

  return {
    settings,
    power,
    efficiency,
    health,
    criticalFault,
    relayOn,
    faultBars,
    diagnosis,
    confidence,
    risk,
    maintenanceWindow,
    sensorRows,
    componentRows,
    insight: reasons[diagnosis],
    dimCells: Math.min(12, Math.max(0, Math.round((100 - health) / 4))),
  };
}

function createExport({ range, metrics }) {
  const rows = [
    ["PV Digital Twin Report"],
    ["Range", range.label],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Sensor", "Reading", "Secondary reading", "Status"],
    ...metrics.sensorRows.map(([sensor, , primary, secondary, state]) => [sensor, primary, secondary, state]),
    [],
    ["Fault diagnosis", "Probability"],
    ...metrics.faultBars.map(([label, value]) => [label, `${value}%`]),
    [],
    ["Component", "Status", "Signal"],
    ...metrics.componentRows.map(([component, , status, signal]) => [component, status, signal]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `pv-digital-twin-${range.label.toLowerCase().replaceAll(" ", "-")}-report.csv`;
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
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notice, setNotice] = useState("");
  const range = timeRanges[rangeKey];
  const today = useMemo(formatToday, []);
  const metrics = useMemo(() => getTwinMetrics(settings), [settings]);
  const scaledChartBars = range.chartBars.map((height) => clamp(Math.round(height * (metrics.power / 168.3)), 8, 100));
  const widget = activeWidget === "environment"
    ? {
      title: "Environmental Context",
      detail: "The digital twin is using the current solar and ambient readings in its health assessment.",
      metrics: [["Irradiance", `${decimal(metrics.settings.irradiance)} W/m2`], ["Ambient", `${decimal(metrics.settings.ambientTemp)} C`], ["Humidity", `${decimal(metrics.settings.humidity)}% RH`]],
    }
    : activeWidget === "protection"
      ? {
        title: "Self-Healing Protection",
        detail: metrics.relayOn
          ? "Relay protection is armed and the panel remains connected to the load."
          : "A critical condition has been detected. The relay has isolated the panel from the load.",
        metrics: [["Relay", metrics.relayOn ? "ON" : "OFF"], ["Protection", metrics.relayOn ? "Armed" : "Active"], ["Panel", metrics.relayOn ? "Connected" : "Isolated"]],
      }
      : null;

  useEffect(() => {
    setSettings(restoreSettings());
  }, []);

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

  function updateSetting(key, nextValue) {
    const value = Number(nextValue);
    if (!Number.isFinite(value)) return;
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function saveSettings(event) {
    event.preventDefault();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setNotice("Settings saved.");
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
    window.localStorage.removeItem(STORAGE_KEY);
    setNotice("Demo values restored.");
  }

  function addWidget(widgetId) {
    setActiveWidget(widgetId);
    setIsWidgetMenuOpen(false);
    const [, label] = widgetOptions.find(([id]) => id === widgetId) ?? [];
    setNotice(`${label} was added to the dashboard.`);
  }

  function exportReport() {
    createExport({ range, metrics });
    setNotice("The CSV report has been downloaded.");
  }

  const summaryCards = [
    ["Panel Health", `${metrics.health}%`, metrics.health >= 86 ? "Healthy" : "Needs attention", metrics.health >= 86 ? "Thermal and electrical condition" : "Performance stress detected", metrics.health < 75 ? "negative" : metrics.health < 86 ? "watch" : ""],
    ["Power Output", `${decimal(metrics.power)} W`, `${decimal(metrics.settings.voltage)} V x ${decimal(metrics.settings.current, 2)} A`, "INA219 sensor reading", ""],
    ["Efficiency", `${decimal(metrics.efficiency)}%`, metrics.efficiency >= 82 ? "Within range" : "Below baseline", "PV conversion status", metrics.efficiency < 70 ? "negative" : metrics.efficiency < 82 ? "watch" : ""],
    ["Fault Risk", metrics.risk, `${metrics.confidence}% confidence`, `${metrics.diagnosis} is the current leading diagnosis`, metrics.risk === "Critical" ? "negative" : metrics.risk === "Watch" ? "watch" : ""],
  ];

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
          {navItems.map(([label, target]) => (
            <a href={`#${target}`} key={target}>{label}</a>
          ))}
        </nav>

        <div className="controller-card">
          <span>ESP32 Status</span>
          <strong>{metrics.criticalFault ? "Protecting" : "Running"}</strong>
          <p>{metrics.criticalFault ? "Protection active" : "Monitoring active"}</p>
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
              <button type="button" aria-expanded={isRangeMenuOpen} aria-haspopup="menu" onClick={() => setIsRangeMenuOpen((isOpen) => !isOpen)}>
                {range.label} <span aria-hidden="true">v</span>
              </button>
              {isRangeMenuOpen && (
                <div className="action-menu" role="menu" aria-label="Choose dashboard period">
                  {Object.entries(timeRanges).map(([key, value]) => (
                    <button type="button" className={key === rangeKey ? "selected" : ""} key={key} onClick={() => selectRange(key)} role="menuitem">
                      {value.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={exportReport}>Export</button>
            <div className="toolbar-menu">
              <button type="button" className="primary-button" aria-expanded={isWidgetMenuOpen} aria-haspopup="menu" onClick={() => setIsWidgetMenuOpen((isOpen) => !isOpen)}>
                Add Widget
              </button>
              {isWidgetMenuOpen && (
                <div className="action-menu widget-menu" role="menu" aria-label="Add a dashboard widget">
                  {widgetOptions.map(([id, label]) => (
                    <button type="button" key={id} onClick={() => addWidget(id)} role="menuitem">
                      <strong>{label}</strong>
                      <small>{id === "environment" ? "Use live irradiance, temperature, and humidity values." : "Show the relay and panel isolation state."}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <p className="date-context">Showing {range.label.toLowerCase()} data - {today}</p>

        <section className="summary-grid" aria-label="PV health summary">
          {summaryCards.map(([label, value, delta, note, tone]) => (
            <article className="summary-card" key={label}>
              <div><span>{label}</span></div>
              <strong>{value}</strong>
              <p className={tone}>{delta}</p>
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
              <select aria-label="Power chart range" value={rangeKey} onChange={(event) => selectRange(event.target.value)}>
                <option value="today">Today</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </div>
            <div className="chart-area" aria-label={`Bar chart of PV output for ${range.chartLabel}`}>
              {scaledChartBars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
              <div className="chart-tooltip">
                <strong>{decimal(metrics.power)} W</strong>
                <small>Current fused sensor reading</small>
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
              <b>{metrics.health}%</b>
            </div>
            <div className="panel-visual" aria-label="Solar panel digital twin visual">
              {Array.from({ length: 30 }).map((_, index) => <i key={index} className={index < metrics.dimCells ? "dim" : ""} />)}
            </div>
            <div className="twin-status">
              <span className={metrics.relayOn ? "" : "alert"}>{metrics.relayOn ? "Relay ON" : "Relay OFF"}</span>
              <span className={metrics.criticalFault ? "alert" : ""}>{metrics.criticalFault ? "Panel isolated" : "No critical fault"}</span>
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
              {metrics.sensorRows.map(([sensor, role, primary, secondary, state]) => (
                <div key={sensor}>
                  <strong>{sensor}</strong>
                  <p>{role}</p>
                  <span>{primary}</span>
                  <span>{secondary}</span>
                  <em className={getStatusTone(state)}>{state}</em>
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
              <b>{metrics.confidence}%</b>
            </div>
            <div className="fault-bars">
              {metrics.faultBars.map(([label, value, color]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div><i style={{ width: `${value}%`, background: color }} /></div>
                  <strong>{value}%</strong>
                </div>
              ))}
            </div>
            <p className="insight">XAI reason: {metrics.insight}</p>
          </article>

          <article className={`maintenance-card ${metrics.criticalFault ? "critical-maintenance" : ""}`} id="maintenance">
            <span>Predictive Maintenance</span>
            <h2>{metrics.maintenanceWindow}</h2>
            <p>{metrics.criticalFault ? "The self-healing relay has isolated the panel. Inspect the condition before reconnecting the load." : `Inspection timing is based on current health, panel temperature, irradiance, and the leading XAI diagnosis: ${metrics.diagnosis}.`}</p>
            <button type="button" onClick={() => setNotice(`Maintenance note created: ${metrics.diagnosis} - ${metrics.maintenanceWindow}.`)}>Create service note</button>
          </article>

          {widget && (
            <article className="widget-card">
              <div className="card-header">
                <div>
                  <span>Added Widget</span>
                  <h2>{widget.title}</h2>
                </div>
                <button type="button" onClick={() => setActiveWidget(null)}>Remove</button>
              </div>
              <p>{widget.detail}</p>
              <div className="widget-metrics">
                {widget.metrics.map(([label, value]) => (
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
            <span className={`sync-state ${metrics.criticalFault ? "alert" : ""}`}>{metrics.criticalFault ? "Protection active" : "System ready"}</span>
          </div>
          <table>
            <thead>
              <tr><th>Component</th><th>Purpose</th><th>Status</th><th>Signal</th></tr>
            </thead>
            <tbody>
              {metrics.componentRows.map(([component, purpose, status, signal]) => (
                <tr key={component}>
                  <td>{component}</td>
                  <td>{purpose}</td>
                  <td><span className={getStatusTone(status)}>{status}</span></td>
                  <td>{signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-centre" id="admin-centre" aria-labelledby="admin-title">
          <div className="admin-heading">
            <div>
              <span>Admin Centre</span>
              <h2 id="admin-title">Configure the live digital twin</h2>
            </div>
          </div>
          <form onSubmit={saveSettings}>
            <div className="admin-groups">
              {adminGroups.map((group) => (
                <fieldset key={group.title}>
                  <legend>{group.title}</legend>
                  <div className="settings-grid">
                    {group.fields.map(([key, label, unit, step, minimum]) => (
                      <label key={key}>
                        <span>{label}</span>
                        <div>
                          <input type="number" inputMode="decimal" min={minimum} step={step} value={settings[key]} onChange={(event) => updateSetting(key, event.target.value)} />
                          <small>{unit}</small>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="admin-actions">
              <button type="button" onClick={resetSettings}>Reset values</button>
              <button type="submit" className="save-button">Save settings</button>
            </div>
          </form>
        </section>
      </section>

      {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}
    </main>
  );
}
