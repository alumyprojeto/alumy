// Driver de screenshots via Chromium CDP (sem dependências — usa WebSocket nativo do Node 22).
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = "http://localhost:3100";
const OUT = "/tmp/shots";
mkdirSync(OUT, { recursive: true });
const cookie = readFileSync("/tmp/cookie.txt", "utf8").trim();

const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

// Telas a capturar: [arquivo, url, largura, altura, descrição]
const TELAS = [
  ["1-login", "/login", 420, 860, "Login (mobile)"],
  ["2-painel", "/painel", 1100, 1200, "Painel da gestão (desktop)"],
  ["3-obras", "/obras", 1100, 1000, "Lista de obras"],
  ["4-obra-detalhe", "/obras/2", 1100, 1900, "Detalhe da obra — timeline"],
  ["5-obra-mobile", "/obras/2", 420, 1700, "Obra no celular"],
  ["6-admin", "/admin/usuarios", 1100, 1100, "Admin de usuários"],
  ["7-nova-obra", "/obras/nova", 1100, 900, "Nova obra"],
];

async function cdp(ws, id, method, params = {}, sessionId) {
  const msg = { id, method, params };
  if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
}

async function main() {
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "about:blank",
  ], { stdio: "ignore" });

  // espera o endpoint subir
  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch("http://localhost:9222/json/version");
      const j = await r.json();
      wsUrl = j.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
    await sleep(250);
  }
  if (!wsUrl) throw new Error("Chromium CDP não subiu");

  const ws = new WebSocket(wsUrl);
  await new Promise((res) => (ws.onopen = res));

  let msgId = 1;
  const pending = new Map();
  const waiters = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
    for (const w of waiters) w(m);
  };
  const call = (method, params, sessionId) =>
    new Promise((res) => {
      const id = msgId++;
      pending.set(id, res);
      cdp(ws, id, method, params, sessionId);
    });

  // cria um alvo (aba) e anexa
  const { targetId } = await call("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await call("Target.attachToTarget", { targetId, flatten: true });
  const S = sessionId;

  await call("Page.enable", {}, S);
  await call("Network.enable", {}, S);
  // injeta o cookie de sessão (httpOnly ok via CDP)
  await call("Network.setCookie", {
    name: "alumy_sessao",
    value: cookie,
    domain: "localhost",
    path: "/",
    httpOnly: true,
  }, S);

  for (const [arq, url, w, h, desc] of TELAS) {
    await call("Emulation.setDeviceMetricsOverride", {
      width: w, height: h, deviceScaleFactor: w < 500 ? 2 : 1, mobile: w < 500,
    }, S);

    // navega e espera o load
    const loaded = new Promise((res) => {
      const fn = (m) => {
        if (m.method === "Page.loadEventFired" && m.sessionId === S) {
          waiters.splice(waiters.indexOf(fn), 1);
          res();
        }
      };
      waiters.push(fn);
    });
    await call("Page.navigate", { url: BASE + url }, S);
    await Promise.race([loaded, sleep(8000)]);
    await sleep(1200); // fontes/render

    const { data } = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, S);
    const { writeFileSync } = await import("node:fs");
    writeFileSync(`${OUT}/${arq}.png`, Buffer.from(data, "base64"));
    console.log(`📸 ${arq}.png — ${desc}`);
  }

  ws.close();
  chrome.kill();
  console.log("OK");
}

main().catch((e) => { console.error(e); process.exit(1); });
