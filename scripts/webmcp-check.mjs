// End-to-end check of the WebMCP tool surface against a real Chromium engine.
//
// Serves the built app, launches Chrome headless with the WebMCP flag, and
// drives the board's tools through `document.modelContext` itself — the same
// path a browser agent uses. Requires a build (`pnpm build`) and a Chrome
// binary with WebMCP compiled in (Chrome 149+; Brave does not ship it):
//
//   CHROME_BIN=/path/to/chrome pnpm test:webmcp
//
// Without CHROME_BIN, the script looks for a `chrome` on PATH.
import { execFileSync, spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { extname, join } from "node:path"

const DIST = new URL("../dist/client/", import.meta.url).pathname
const CDP_PORT = 9533
const APP_PORT = 9534

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

const chrome = resolveChrome()
if (!chrome) {
  console.error(
    "No Chrome binary. Set CHROME_BIN, e.g.\n" +
      "  npx @puppeteer/browsers install chrome@stable\n" +
      "  CHROME_BIN=<printed path> pnpm test:webmcp",
  )
  process.exit(1)
}
if (!existsSync(join(DIST, "index.html"))) {
  console.error("No build found. Run `pnpm build` first.")
  process.exit(1)
}

const server = createServer((req, res) => {
  const path = new URL(req.url, "http://x").pathname
  const file = join(DIST, path)
  const target = existsSync(file) && extname(path) ? file : join(DIST, "index.html")
  res.writeHead(200, {
    "Content-Type": MIME[extname(target)] ?? "application/octet-stream",
    "Origin-Agent-Cluster": "?1",
    "Permissions-Policy": "tools=(self)",
  })
  res.end(readFileSync(target))
})
await new Promise((resolve) => server.listen(APP_PORT, "127.0.0.1", resolve))

const profile = join(tmpdir(), `cograph-webmcp-${Date.now()}`)
const browser = spawn(
  chrome,
  [
    "--headless=new",
    // The downloaded Chrome for Testing binary has no sandbox helper on
    // distros that restrict unprivileged user namespaces.
    "--no-sandbox",
    `--remote-debugging-port=${CDP_PORT}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--enable-webmcp-testing",
    "--enable-features=WebMCP,WebMCPTesting,DeclarativeWebmcp",
    // Chrome for Testing 152 on macOS also needs the Blink runtime features
    // switched on, or document.modelContext never appears.
    "--enable-blink-features=WebMCP,WebMCPTesting",
    `http://127.0.0.1:${APP_PORT}/r/e2e`,
  ],
  { stdio: "ignore" },
)

function cleanup(code) {
  browser.kill("SIGKILL")
  server.close()
  process.exit(code)
}

await new Promise((resolve) => setTimeout(resolve, 3000))

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

// The app registers tools from a mount effect; poll until they appear.
let toolNames = []
for (let attempt = 0; attempt < 20; attempt += 1) {
  toolNames = await evaluate(
    "document.modelContext ? document.modelContext.getTools().then(ts => ts.map(t => t.name)) : []",
  )
  if (toolNames.length > 0) break
  await new Promise((resolve) => setTimeout(resolve, 500))
}

check("document.modelContext exists", await evaluate("!!document.modelContext"))

const baseline = [
  "describe_board",
  "find_blast_radius",
  "find_dependencies",
  "find_dependency_cycles",
  "read_service_notes",
  "add_service",
]
for (const name of baseline) {
  check(`baseline tool registered: ${name}`, toolNames.includes(name))
}
const gated = ["update_selected_service", "delete_selected_service", "connect_selected_services"]
for (const name of gated) {
  check(`selection-gated tool absent: ${name}`, !toolNames.includes(name))
}

async function callTool(name, args) {
  const raw = await evaluate(`
    document.modelContext.getTools().then(async (tools) => {
      const tool = tools.find((t) => t.name === ${JSON.stringify(name)})
      if (!tool) return JSON.stringify({ content: [{ type: "text", text: "TOOL NOT FOUND" }], isError: true })
      return document.modelContext.executeTool(tool, ${JSON.stringify(JSON.stringify(args))})
    })
  `)
  return JSON.parse(raw)
}

const added = await callTool("add_service", { label: "redis", kind: "datastore" })
check("add_service succeeds", !added.isError, added.content[0]?.text)

const described = await callTool("describe_board", {})
check(
  "describe_board sees the added service",
  !described.isError && described.content[0].text.includes("redis"),
  described.content[0]?.text.split("\n")[0],
)

const duplicate = await callTool("add_service", { label: "redis", kind: "datastore" })
check(
  "duplicate add returns a structured error",
  duplicate.isError === true && duplicate.content[0].text.includes("exists"),
)

const blast = await callTool("find_blast_radius", { service: "redis" })
check("find_blast_radius answers", !blast.isError, blast.content[0]?.text)

const unknown = await callTool("find_blast_radius", { service: "nope" })
check(
  "unknown service returns a structured error naming known services",
  unknown.isError === true && unknown.content[0].text.includes("redis"),
)

// The first tool call gives the agent its seat: a participant chip with the
// agent badge, and a cursor pinned to the node the call touched.
await new Promise((resolve) => setTimeout(resolve, 500))
const pageText = await evaluate("document.body.innerText")
check("agent appears in the participant list", pageText.includes("'s agent"))
check(
  "engine tool count is visible in the inspector",
  /The browser engine reports \d+ registered tool/.test(pageText),
)

ws.close()
cleanup(failed ? 1 : 0)
