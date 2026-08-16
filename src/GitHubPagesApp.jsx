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

const chartBars = [32, 44, 36, 52, 67, 73, 61, 78, 84, 72, 88, 93];

export default function GitHubPagesApp() {
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
            <button type="button">Today</button>
            <button type="button">Export</button>
            <button type="button" className="primary-button">Add Widget</button>
          </div>
        </header>

        <section className="summary-grid" aria-label="PV health summary">
          {summaryCards.map(([label, value, delta, note]) => (
            <article className="summary-card" key={label}>
              <div>
                <span>{label}</span>
                <button type="button" aria-label={`${label} menu`}>...</button>
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
              <select aria-label="Power chart range" defaultValue="12h">
                <option value="12h">Last 12 hours</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </div>
            <div className="chart-area" aria-label="Bar chart of PV output">
              {chartBars.map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
              <div className="chart-tooltip">
                <strong>168.3 W</strong>
                <small>Peak after baseline correction</small>
              </div>
            </div>
            <div className="chart-labels">
              <span>06:00</span>
              <span>09:00</span>
              <span>12:00</span>
              <span>15:00</span>
              <span>18:00</span>
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
            <button type="button">Create service note</button>
          </article>
        </section>

        <section className="component-table">
          <div className="card-header">
            <div>
              <span>System Components</span>
              <h2>Hardware and control chain</h2>
            </div>
            <button type="button">View logs</button>
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
    </main>
  );
}
