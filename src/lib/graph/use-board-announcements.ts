import { useEffect, useRef, useState } from "react"
import type { BoardConnection, BoardSnapshot } from "@/lib/yjs/board-connection"
import { useBoardSynced } from "@/lib/yjs/use-board"

interface UseBoardAnnouncementsParams {
  board: BoardConnection | null
  snapshot: BoardSnapshot
  /** Participant id to display name, for author attribution. */
  names: Map<string, string>
  meId: string
}

/**
 * Turns board deltas into a sentence for an aria-live region, so a change made
 * by a peer or by the agent reaches a screen reader. Diffing starts only after
 * the first full sync — joining a board must not read the whole graph aloud.
 * A board that cannot reach the server still announces its local edits.
 */
export function useBoardAnnouncements(params: UseBoardAnnouncementsParams) {
  const { board, snapshot, names, meId } = params
  const [message, setMessage] = useState("")
  const ready = useBoardSynced(board)
  const previous = useRef<BoardSnapshot | null>(null)

  useEffect(() => {
    const before = previous.current
    previous.current = snapshot
    if (!ready || !before || before === snapshot) return

    const beforeNodes = new Map(before.nodes.map((node) => [node.id, node]))
    const afterNodes = new Map(snapshot.nodes.map((node) => [node.id, node]))
    const label = (id: string) =>
      afterNodes.get(id)?.data.label ?? beforeNodes.get(id)?.data.label ?? "a service"

    const parts: string[] = []

    for (const node of snapshot.nodes) {
      const old = beforeNodes.get(node.id)
      if (!old) {
        const author = node.data.authorId === meId ? null : names.get(node.data.authorId)
        parts.push(author ? `${author} added ${node.data.label}.` : `Added ${node.data.label}.`)
        continue
      }
      if (old.data.label !== node.data.label) {
        parts.push(`${old.data.label} renamed to ${node.data.label}.`)
      }
    }
    for (const node of before.nodes) {
      if (!afterNodes.has(node.id)) parts.push(`Removed ${node.data.label}.`)
    }

    const beforeEdges = new Map(before.edges.map((edge) => [edge.id, edge]))
    const afterEdges = new Map(snapshot.edges.map((edge) => [edge.id, edge]))

    for (const edge of snapshot.edges) {
      const old = beforeEdges.get(edge.id)
      if (!old) {
        parts.push(`New dependency: ${label(edge.source)} ${edge.kind} ${label(edge.target)}.`)
        continue
      }
      if (old.kind !== edge.kind) {
        parts.push(`${label(edge.source)} now ${edge.kind} ${label(edge.target)}.`)
      }
    }
    for (const edge of before.edges) {
      if (!afterEdges.has(edge.id)) {
        parts.push(`Dependency removed: ${label(edge.source)} ${edge.kind} ${label(edge.target)}.`)
      }
    }

    if (parts.length > 0) setMessage(parts.join(" "))
  }, [snapshot, ready, names, meId])

  return message
}
