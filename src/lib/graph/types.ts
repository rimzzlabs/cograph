export type ServiceKind = "service" | "datastore" | "queue" | "external" | "gateway"

export type EdgeKind = "calls" | "reads" | "writes" | "publishes"

export interface GraphNodeData extends Record<string, unknown> {
  label: string
  kind: ServiceKind
  /** Free text owned by whichever participant last edited it. Never trusted. */
  note: string
  /** Participant id that last wrote this node, for provenance in the UI. */
  authorId: string
}

export interface GraphNode {
  id: string
  position: { x: number; y: number }
  data: GraphNodeData
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  kind: EdgeKind
}

export const SERVICE_KINDS: readonly ServiceKind[] = [
  "service",
  "datastore",
  "queue",
  "external",
  "gateway",
]

export const EDGE_KINDS: readonly EdgeKind[] = ["calls", "reads", "writes", "publishes"]
