// Drive the live cograph /r/demo board through document.modelContext,
// the same path a WebMCP browser agent uses. Chrome setup mirrors
// scripts/webmcp-check.mjs:
//
//   CHROME_BIN=/path/to/chrome node scripts/drive-demo.mjs
//
// Covers the full 16-tool surface: the cursor-bubble narration,
// label-addressed edge tools, relative move, and the agent selection ring.
// The run deletes its own "claude-agent" node at the end, so the demo board
// is clean for the next take. If a crashed run leaves the node behind, the
// next add_service shows a danger bubble and the demo continues.
//
// Env overrides: DEMO_URL (room URL, point at a local build to rehearse),
// PAUSE_MS (beat length, default 3000), ATTACH_PORT (reuse a running Chrome).
import { execFileSync, spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

function resolveChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN
  try {
    return execFileSync("which", ["chrome"], { encoding: "utf8" }).trim() || null
  } catch {
    return null
  }
}

const CHROME = resolveChrome()
if (!CHROME && !process.env.ATTACH_PORT) {
  console.error("No Chrome binary. Set CHROME_BIN to a build that ships WebMCP (Chrome 149+).")
  process.exit(1)
}
const ATTACH_PORT = process.env.ATTACH_PORT ? Number(process.env.ATTACH_PORT) : null
const CDP_PORT = ATTACH_PORT ?? 9550 + (process.pid % 40)
// DEMO_URL lets a rehearsal run against a local build before the live room.
const URL_TO_OPEN = process.env.DEMO_URL ?? "https://cograph.rimzzlabs.com/r/demo"
const TARGET_HOST = new URL(URL_TO_OPEN).host
const PAUSE_MS = process.env.PAUSE_MS ? Number(process.env.PAUSE_MS) : 3000

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = join(tmpdir(), `cograph-live-${process.pid}`)
const browser = ATTACH_PORT
  ? { kill: () => {} }
  : spawn(
      CHROME,
      [
        "--headless=new",
        "--no-sandbox",
        `--remote-debugging-port=${CDP_PORT}`,
        "--remote-allow-origins=*",
        `--user-data-dir=${profile}`,
        "--no-first-run",
        "--enable-webmcp-testing",
        "--enable-features=WebMCP,WebMCPTesting,DeclarativeWebmcp",
        "--enable-blink-features=WebMCP,WebMCPTesting",
        URL_TO_OPEN,
      ],
      { stdio: "ignore" },
    )

function cleanup(code) {
  browser.kill("SIGKILL")
  process.exit(code)
}

await sleep(4000)

// Only attach to the cograph page target, never a new-tab or browser_ui target.
let page = null
for (let attempt = 0; attempt < 20 && !page; attempt += 1) {
  const targets = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)
    .then((r) => r.json())
    .catch(() => [])
  page = targets.find((t) => t.type === "page" && t.url.includes(TARGET_HOST)) ?? null
  if (!page) await sleep(1000)
}
if (!page) {
  console.error("Chrome exposed no cograph page target")
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
    timeout: 20000,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? "evaluate failed")
  }
  return result.result.value
}

async function listTools() {
  return evaluate(
    "document.modelContext ? document.modelContext.getTools().then(ts => ts.map(t => t.name)) : []",
  )
}

async function callTool(name, args, attempt = 0) {
  if (attempt === 0) console.log(`\n>>> ${name} ${JSON.stringify(args)}`)
  let raw
  try {
    raw = await evaluate(`
      document.modelContext.getTools().then(async (tools) => {
        const tool = tools.find((t) => t.name === ${JSON.stringify(name)})
        if (!tool) return JSON.stringify({ content: [{ type: "text", text: "TOOL NOT FOUND" }], isError: true })
        return document.modelContext.executeTool(tool, ${JSON.stringify(JSON.stringify(args))})
      })
    `)
  } catch (error) {
    // The engine can fail a call on a just-registered tool with a transient
    // UnknownError while the call still executes. One settled retry is enough.
    if (attempt >= 2) throw error
    await sleep(500)
    return callTool(name, args, attempt + 1)
  }
  const result = JSON.parse(raw)
  const text = result.content.map((p) => p.text).join("\n")
  // A retry that finds the tool gone means the first attempt landed and the
  // tool unregistered itself (resolve_incident does this by design).
  if (attempt > 0 && result.isError && text === "TOOL NOT FOUND") {
    const note = "(the first attempt landed; the tool has already unregistered itself)"
    console.log(note)
    return { content: [{ type: "text", text: note }], text: note }
  }
  console.log(`${result.isError ? "ERROR: " : ""}${text}`)
  return { ...result, text }
}

// Wait for the board connection and tool registration.
let tools = []
for (let attempt = 0; attempt < 30; attempt += 1) {
  tools = await listTools()
  if (tools.length > 0) break
  await sleep(500)
}

console.log(`modelContext present: ${await evaluate("!!document.modelContext")}`)
console.log(`registered tools (${tools.length}): ${tools.join(", ")}`)
if (tools.length === 0) cleanup(1)

// ---- Act 1: read the board. The bubble streams the summary at the centroid.

// The Yjs snapshot arrives after the websocket handshake; wait for real content.
let board = await callTool("describe_board", {})
for (let attempt = 0; attempt < 20 && board.text.includes("empty"); attempt += 1) {
  await sleep(1000)
  board = await callTool("describe_board", {})
}
await sleep(PAUSE_MS)

// Parse labels; find the service with the largest blast radius for the finale.
const labels = [...board.text.matchAll(/^- (.+?) \(/gm)].map((m) => m[1])
console.log(`\nparsed services: ${labels.join(", ")}`)

await callTool("find_dependency_cycles", {})
await sleep(PAUSE_MS)

let star = labels[0]
let starCount = -1
for (const label of labels) {
  const blast = await callTool("find_blast_radius", { service: label })
  const match = blast.text.match(/^(\d+) services break/)
  const count = match ? Number(match[1]) : 0
  if (count > starCount) {
    star = label
    starCount = count
  }
  await sleep(1500)
}
console.log(`\nservice with widest blast radius: ${star} (${starCount} affected)`)

await callTool("find_dependencies", { service: star })
await sleep(PAUSE_MS)

await callTool("read_service_notes", { service: labels[0] })
await sleep(PAUSE_MS)

// ---- Act 2: build. Add next to the star, then tuck the new card below it.

await callTool("add_service", { label: "claude-agent", kind: "service", near: star })
await sleep(PAUSE_MS)

await callTool("move_service", { service: "claude-agent", direction: "below", of: star })
await sleep(PAUSE_MS)

// The dashed ring shows everyone what the agent is working with.
await callTool("select_services", { services: ["claude-agent", star] })
await sleep(PAUSE_MS)

// ---- Act 3: the edge lifecycle. Connect, get corrected, retype, flip, cut.

await callTool("connect_services", { source: "claude-agent", target: star, kind: "calls" })
await sleep(PAUSE_MS)

// A deliberate duplicate: the refusal shows as a danger bubble on camera.
await callTool("connect_services", { source: "claude-agent", target: star, kind: "writes" })
await sleep(PAUSE_MS)

await callTool("set_dependency_kind", { source: "claude-agent", target: star, kind: "writes" })
await sleep(PAUSE_MS)

await callTool("reverse_dependency", { source: "claude-agent", target: star })
await sleep(PAUSE_MS)

await callTool("disconnect_services", { source: star, target: "claude-agent" })
await sleep(PAUSE_MS)

// ---- Act 4: the incident, then leave the board the way we found it.

await callTool("simulate_failure", { service: star })
await sleep(1000)

const during = await listTools()
console.log(`\ntools during incident (${during.length}): ${during.join(", ")}`)
console.log(`resolve_incident appeared: ${during.includes("resolve_incident")}`)
await sleep(PAUSE_MS)

await callTool("resolve_incident", {})
await sleep(PAUSE_MS)

const after = await listTools()
console.log(`\ntools after resolve (${after.length}): ${after.join(", ")}`)

await callTool("select_services", { services: [] })
await sleep(1000)

await callTool("delete_service", { service: "claude-agent" })
await sleep(PAUSE_MS)

await callTool("describe_board", {})

// Leave a moment for the last Yjs sync to flush before killing the browser.
await sleep(1500)
ws.close()
cleanup(0)
