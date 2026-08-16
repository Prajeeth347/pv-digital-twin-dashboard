import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the photovoltaic monitoring site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Digital Twin Dashboard/);
  assert.match(html, /INA219/);
  assert.match(html, /DS18B20/);
  assert.match(html, /DHT22/);
  assert.match(html, /BH1750/);
  assert.match(html, /Predictive Maintenance/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("starter preview dependency has been removed", async () => {
  const packageJson = await readFile(
    new URL("../package.json", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
