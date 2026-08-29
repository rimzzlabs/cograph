// Automated accessibility check of the board editing surface.
//
// Serves the built app, launches Chrome headless, and drives the board with
// trusted keyboard and mouse input through the DevTools protocol. It asserts
// the ARIA names on nodes and edges, the keyboard path to the context menu,
// focus return on close, the keyboard connect flow, and the live region.
// This does not replace a pass with a real screen reader.
//
//   CHROME_BIN=/path/to/chrome pnpm test:a11y
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

const chrome = resolveChrome()
if (!chrome) {
  console.error("No Chrome binary. Set CHROME_BIN.")
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
  res.writeHead(200, { "Content-Type": MIME[extname(target)] ?? "application/octet-stream" })
  res.end(readFileSync(target))
})
await new Promise((resolve) => server.listen(APP_PORT, "127.0.0.1", resolve))

const profile = join(tmpdir(), `cograph-a11y-${Date.now()}`)
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--no-sandbox",
    `--remote-debugging-port=${CDP_PORT}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--window-size=1280,800",
    `http://127.0.0.1:${APP_PORT}/r/a11y`,
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

async function key(params) {
  const { key: name, code, keyCode, modifiers = 0, text } = params
  const base = { key: name, code, windowsVirtualKeyCode: keyCode, modifiers, text }
  await send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", ...base })
  await send("Input.dispatchKeyEvent", { type: "keyUp", ...base })
}

async function until(label, expression, timeoutMs = 8000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(expression)) return true
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  check(label, false, `timed out on ${expression}`)
  return false
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// --- Arrange: two services on the board, added through the visible button ---
await until(
  "app renders",
  `[...document.querySelectorAll("button")].some((b) => b.textContent.includes("+ Service"))`,
)
// Let the provider settle first: the live region stays silent until the board
// is synced or has given up connecting, so additions before that never speak.
await wait(2000)
await evaluate(
  `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("+ Service")).click()`,
)
await wait(300)
await evaluate(
  `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("+ Service")).click()`,
)
await until("two nodes render", `document.querySelectorAll(".react-flow__node").length === 2`)

// --- Names and roles ---
const nodeAria = await evaluate(
  `document.querySelector('.react-flow__node')?.getAttribute("aria-label")`,
)
check("node carries an accessible name", nodeAria === "service-1, service", String(nodeAria))

// --- Live region ---
await until(
  "live region announced the additions",
  `/Added service-2./.test(document.querySelector('[role="status"][aria-live]')?.textContent ?? "")`,
)
check("live region announced the additions", true)

// --- Keyboard path to the menu, focus into it ---
await evaluate(`document.querySelector(".react-flow__node").focus()`)
await key({ key: "F10", code: "F10", keyCode: 121, modifiers: 8 })
await wait(400)
check(
  "Shift+F10 opens the menu",
  await evaluate(`document.querySelector('[role="menu"]') !== null`),
)
check(
  "focus moves into the menu",
  await evaluate(`document.activeElement?.closest('[role="menu"]') !== null`),
)

// --- Escape closes, focus returns to the node ---
await key({ key: "Escape", code: "Escape", keyCode: 27 })
await wait(400)
check("Escape closes the menu", await evaluate(`document.querySelector('[role="menu"]') === null`))
check(
  "focus returns to the node",
  await evaluate(`document.activeElement?.classList.contains("react-flow__node") === true`),
)

// --- Keyboard connect: select two nodes with the keyboard, press C ---
await evaluate(`document.querySelectorAll(".react-flow__node")[0].focus()`)
await key({ key: "Enter", code: "Enter", keyCode: 13 })
await wait(200)
// React Flow reads the multi-select modifier from window key events, and the
// key is platform-native: Meta on macOS, Control elsewhere. Dispatch the key
// for the platform the check runs on, or the second Enter replaces the
// selection instead of adding to it.
const multiKey =
  process.platform === "darwin"
    ? { key: "Meta", code: "MetaLeft", windowsVirtualKeyCode: 91, modifiers: 4 }
    : { key: "Control", code: "ControlLeft", windowsVirtualKeyCode: 17, modifiers: 2 }
await send("Input.dispatchKeyEvent", {
  type: "rawKeyDown",
  key: multiKey.key,
  code: multiKey.code,
  windowsVirtualKeyCode: multiKey.windowsVirtualKeyCode,
  modifiers: multiKey.modifiers,
})
await evaluate(`document.querySelectorAll(".react-flow__node")[1].focus()`)
await key({ key: "Enter", code: "Enter", keyCode: 13, modifiers: multiKey.modifiers })
await send("Input.dispatchKeyEvent", {
  type: "keyUp",
  key: multiKey.key,
  code: multiKey.code,
  windowsVirtualKeyCode: multiKey.windowsVirtualKeyCode,
})
await wait(200)
const selected = await evaluate(`document.querySelectorAll(".react-flow__node.selected").length`)
check("two nodes selected by keyboard", selected === 2, `selected=${selected}`)

await key({ key: "c", code: "KeyC", keyCode: 67, text: "c" })
await wait(400)
check(
  "C opens the connect dialog",
  await evaluate(
    `document.querySelector('[role="dialog"]')?.textContent.includes("Connect services") === true`,
  ),
)
await evaluate(
  `[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent === "Connect")?.click()`,
)
await wait(400)
const edgeAria = await evaluate(
  `document.querySelector(".react-flow__edge")?.getAttribute("aria-label")`,
)
check(
  "edge carries an accessible name",
  /service-\d calls service-\d/.test(edgeAria ?? ""),
  String(edgeAria),
)
const liveAfter = await evaluate(
  `document.querySelector('[role="status"][aria-live]')?.textContent`,
)
check(
  "live region announced the dependency",
  /New dependency:/.test(liveAfter ?? ""),
  String(liveAfter),
)

ws.close()
cleanup(failed ? 1 : 0)
