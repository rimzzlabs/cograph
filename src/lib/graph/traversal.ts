import type { GraphEdge, GraphNode } from "./types"

interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/**
 * Every node that would be affected if `rootId` failed — the blast radius.
 * Walks the reverse direction of dependency edges, breadth first.
 */
export function findDependents(graph: Graph, rootId: string) {
  const incoming = new Map<string, string[]>()
  for (const edge of graph.edges) {
    const list = incoming.get(edge.target)
    if (list) list.push(edge.source)
    else incoming.set(edge.target, [edge.source])
  }

  const seen = new Set<string>([rootId])
  const ordered: string[] = []
  const queue = [rootId]

  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const dependent of incoming.get(current) ?? []) {
      if (seen.has(dependent)) continue
      seen.add(dependent)
      ordered.push(dependent)
      queue.push(dependent)
    }
  }

  return ordered
}

export function findDependencies(graph: Graph, rootId: string) {
  const outgoing = new Map<string, string[]>()
  for (const edge of graph.edges) {
    const list = outgoing.get(edge.source)
    if (list) list.push(edge.target)
    else outgoing.set(edge.source, [edge.target])
  }

  const seen = new Set<string>([rootId])
  const ordered: string[] = []
  const queue = [rootId]

  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const dependency of outgoing.get(current) ?? []) {
      if (seen.has(dependency)) continue
      seen.add(dependency)
      ordered.push(dependency)
      queue.push(dependency)
    }
  }

  return ordered
}

/**
 * Iterative three-colour DFS. Recursion would be simpler but a pasted diagram
 * can nest deeply enough to overflow the stack.
 */
export function findCycles(graph: Graph) {
  const outgoing = new Map<string, string[]>()
  for (const edge of graph.edges) {
    const list = outgoing.get(edge.source)
    if (list) list.push(edge.target)
    else outgoing.set(edge.source, [edge.target])
  }

  const state = new Map<string, "open" | "done">()
  const cycles: string[][] = []

  for (const node of graph.nodes) {
    if (state.has(node.id)) continue

    const path: string[] = []
    const stack: Array<{ id: string; next: number }> = [{ id: node.id, next: 0 }]
    state.set(node.id, "open")
    path.push(node.id)

    while (stack.length > 0) {
      const frame = stack[stack.length - 1] as { id: string; next: number }
      const neighbours = outgoing.get(frame.id) ?? []

      if (frame.next >= neighbours.length) {
        state.set(frame.id, "done")
        path.pop()
        stack.pop()
        continue
      }

      const neighbour = neighbours[frame.next] as string
      frame.next += 1

      if (state.get(neighbour) === "open") {
        const start = path.indexOf(neighbour)
        if (start !== -1) cycles.push(path.slice(start))
        continue
      }

      if (state.get(neighbour) === "done") continue

      state.set(neighbour, "open")
      path.push(neighbour)
      stack.push({ id: neighbour, next: 0 })
    }
  }

  return cycles
}

export function findPath(graph: Graph, fromId: string, toId: string) {
  const outgoing = new Map<string, string[]>()
  for (const edge of graph.edges) {
    const list = outgoing.get(edge.source)
    if (list) list.push(edge.target)
    else outgoing.set(edge.source, [edge.target])
  }

  const previous = new Map<string, string>()
  const seen = new Set<string>([fromId])
  const queue = [fromId]

  while (queue.length > 0) {
    const current = queue.shift() as string
    if (current === toId) {
      const path = [toId]
      let step = toId
      while (step !== fromId) {
        step = previous.get(step) as string
        path.unshift(step)
      }
      return path
    }

    for (const neighbour of outgoing.get(current) ?? []) {
      if (seen.has(neighbour)) continue
      seen.add(neighbour)
      previous.set(neighbour, current)
      queue.push(neighbour)
    }
  }

  return null
}
