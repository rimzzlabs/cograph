import { useEffect, useState } from "react"
import type { BoardConnection } from "@/lib/yjs/board-connection"
import type { Participant } from "@/stores/session-store"

export interface PresenceState {
  participant: Participant
  selection: string[]
  cursor: { x: number; y: number } | null
}

interface UsePresenceParams {
  board: BoardConnection | null
  me: Participant
  selection: string[]
}

/**
 * Publishes the local participant into Yjs awareness and reports everyone else.
 *
 * One identity can hold several awareness entries, because every tab opens its
 * own connection. States are therefore grouped by participant id and collapsed
 * to the most recently updated one, so a person in two tabs appears once.
 *
 * An agent acting through the tool surface is published the same way a person
 * is, so it shows up in the participant list with its own identity.
 */
export function usePresence(params: UsePresenceParams) {
  const { board, me, selection } = params
  const [others, setOthers] = useState<PresenceState[]>([])

  useEffect(() => {
    if (!board) return

    const { awareness } = board.provider
    awareness.setLocalStateField("participant", me)
    awareness.setLocalStateField("selection", selection)

    function readOthers() {
      const newest = new Map<string, { state: PresenceState; lastUpdated: number }>()

      for (const [clientId, state] of awareness.getStates()) {
        if (clientId === awareness.clientID) continue

        const value = state as Partial<PresenceState>
        const participant = value.participant
        if (!participant) continue

        // Another tab of this same person, not a peer.
        if (participant.id === me.id) continue

        const lastUpdated = awareness.meta.get(clientId)?.lastUpdated ?? 0
        const existing = newest.get(participant.id)
        if (existing && existing.lastUpdated >= lastUpdated) continue

        newest.set(participant.id, {
          lastUpdated,
          state: {
            participant,
            selection: value.selection ?? [],
            cursor: value.cursor ?? null,
          },
        })
      }

      const collapsed = Array.from(newest.values(), (entry) => entry.state)
      setOthers(
        collapsed.toSorted((first, second) =>
          first.participant.id.localeCompare(second.participant.id),
        ),
      )
    }

    readOthers()
    awareness.on("change", readOthers)
    return () => awareness.off("change", readOthers)
  }, [board, me, selection])

  return others
}

export function publishCursor(
  board: BoardConnection | null,
  cursor: { x: number; y: number } | null,
) {
  board?.provider.awareness.setLocalStateField("cursor", cursor)
}
