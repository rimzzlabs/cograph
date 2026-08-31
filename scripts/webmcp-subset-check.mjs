// Checks the app against a WebMCP subset implementation: a
// document.modelContext that has registerTool and nothing else — no
// EventTarget, no getTools, no toolchange event. The ChatGPT desktop in-app
// browser ships this shape. The app must mount and register its tools
// through the stub without a crash.
//
//   CHROME_BIN=/path/to/chrome pnpm test:webmcp:subset
import { execFileSync, spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { extname, join } from "node:path"

const DIST = new URL("../dist/client/", import.meta.url).pathname
const CDP_PORT = 9543
const APP_PORT = 9544

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
}

let failed = false
function check(label, passed, detail = "") {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`)
  if (!passed) failed = true
}

function resolveChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN
  try {
    return execFileSync("which", ["chrome"], { encoding: "utf8" }).trim() || null
  } catch {
    return null
  }
}

const CHROME = resolveChrome()
if (!CHROME) {
  console.error("No Chrome binary. Set CHROME_BIN.")
  process.exit(1)
}
if (!existsSync(new URL("../dist/client/index.html", import.meta.url).pathname)) {
  console.error("No build found. Run `pnpm build` first.")
  process.exit(1)
}

const server = createServer((req, res) => {
  const path = new URL(req.url, "http://x").pathname
  const file = join(DIST, path)
  const target = existsSync(file) && extname(path) ? file : join(DIST, "index.html")
  res.writeHead(200, { "Content-Type": MIME[extname(target)] ?? "application/octet-stream" })
  res.end(readFileSync(target))
})
await new Promise((resolve) => server.listen(APP_PORT, "127.0.0.1", resolve))

const profile = join(tmpdir(), `cograph-subset-${Date.now()}`)
// No WebMCP flags on purpose: the only modelContext is the injected stub.
const browser = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    `--remote-debugging-port=${CDP_PORT}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "about:blank",
  ],
  { stdio: "ignore" },
)

function cleanup(code) {
  browser.kill("SIGKILL")
  server.close()
  process.exit(code)
}

await new Promise((resolve) => setTimeout(resolve, 2500))

const targets = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`).then((r) => r.json())
const page = targets.find((t) => t.type === "page")
if (!page) {
  console.error("Chrome exposed no page target")
  cleanup(1)
}

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = () => reject(new Error("CDP connect failed"))
})

let nextId = 1
function send(method, params) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.id !== id) return
      ws.removeEventListener("message", onMessage)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
    }
    ws.addEventListener("message", onMessage)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout: 15000,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? "evaluate failed")
  }
  return result.result.value
}

await send("Page.enable", {})
// The stub mirrors what the ChatGPT desktop docs guarantee: registerTool as a
// function, nothing else. It must be installed before any app script runs.
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `
    window.__pageErrors = []
    window.addEventListener("error", (e) => window.__pageErrors.push(String(e.message)))
    window.__stubTools = []
    // Shadow the native prototype getter: a plain assignment is silently
    // ignored when the binary ships real WebMCP.
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool) {
          window.__stubTools.push(tool.name)
          return Promise.resolve()
        },
      },
    })
  `,
})
await send("Page.navigate", { url: `http://127.0.0.1:${APP_PORT}/r/subset` })

let toolNames = []
for (let attempt = 0; attempt < 20; attempt += 1) {
  toolNames = await evaluate("window.__stubTools ?? []")
  if (toolNames.length >= 10) break
  await new Promise((resolve) => setTimeout(resolve, 500))
}

const errors = await evaluate("window.__pageErrors ?? []")
check("no uncaught page errors", errors.length === 0, errors.join("; "))
check(
  "app mounted (root has children)",
  await evaluate("document.getElementById('root')?.children.length > 0"),
)
check(`tools registered through subset stub (${toolNames.length})`, toolNames.length >= 10)
check("describe_board among them", toolNames.includes("describe_board"))
check(
  "inspector reports tools callable",
  await evaluate("document.body.innerText.includes('callable right now')"),
)

cleanup(failed ? 1 : 0)
