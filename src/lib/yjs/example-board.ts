import type { ServiceKind } from "@/lib/graph/types"
import { type BoardConnection, LOCAL_ORIGIN } from "./board-connection"
import { addNode, connectNodes } from "./mutations"

interface ExampleNode {
  key: string
  label: string
  kind: ServiceKind
  position: { x: number; y: number }
  note: string
}

/**
 * A small checkout system, laid out left to right. Every service kind appears
 * once, three edge kinds appear, and each note teaches one canvas gesture.
 */
const EXAMPLE_NODES: ExampleNode[] = [
  {
    key: "gateway",
    label: "edge-gateway",
    kind: "gateway",
    position: { x: -440, y: -40 },
    note: "Every request enters here. Right-click me for edit and delete.",
  },
  {
    key: "web",
    label: "web-app",
    kind: "service",
    position: { x: -180, y: -40 },
    note: "Drag me around. My edges follow my closest side.",
  },
  {
    key: "api",
    label: "api",
    kind: "service",
    position: { x: 80, y: -40 },
    note: "Double-click me to open the editor and change this note.",
  },
  {
    key: "db",
    label: "postgres",
    kind: "datastore",
    position: { x: 340, y: -150 },
    note: "Drag from one of my four round handles to draw a new edge.",
  },
  {
    key: "queue",
    label: "jobs",
    kind: "queue",
    position: { x: 340, y: 70 },
    note: "The moving edge means that api publishes events to me.",
  },
  {
    key: "billing",
    label: "stripe",
    kind: "external",
    position: { x: 80, y: 170 },
    note: "Click me, then press Backspace to delete me. I am safe to lose.",
  },
]

const EXAMPLE_EDGES = [
  { source: "gateway", target: "web", kind: "calls" },
  { source: "web", target: "api", kind: "calls" },
  { source: "api", target: "db", kind: "reads" },
  { source: "api", target: "queue", kind: "publishes" },
  { source: "api", target: "billing", kind: "calls" },
] as const

interface SeedExampleParams {
  board: BoardConnection
  authorId: string
  /** Labels already on the board, so the example never duplicates one. */
  existingLabels: ReadonlySet<string>
}

/**
 * Writes the example graph through the same mutations that humans and agent
 * tools use. One outer transaction, so peers receive one sync burst.
 */
export function seedExampleBoard(params: SeedExampleParams) {
  const { board, authorId, existingLabels } = params

  const taken = new Set(Array.from(existingLabels, (label) => label.toLowerCase()))
  const idsByKey = new Map<string, string>()

  board.doc.transact(() => {
    for (const example of EXAMPLE_NODES) {
      const node = addNode({
        board,
        label: uniqueLabel(example.label, taken),
        kind: example.kind,
        authorId,
        position: example.position,
        note: example.note,
      })
      idsByKey.set(example.key, node.id)
    }

    for (const edge of EXAMPLE_EDGES) {
      const source = idsByKey.get(edge.source)
      const target = idsByKey.get(edge.target)
      if (source && target) connectNodes({ board, source, target, kind: edge.kind })
    }
  }, LOCAL_ORIGIN)
}

function uniqueLabel(base: string, taken: Set<string>) {
  let candidate = base
  for (let suffix = 2; taken.has(candidate.toLowerCase()); suffix += 1) {
    candidate = `${base}-${suffix}`
  }
  taken.add(candidate.toLowerCase())
  return candidate
}
