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
      const states: PresenceState[] = []
      for (const [clientId, state] of awareness.getStates()) {
        if (clientId === awareness.clientID) continue
        const value = state as Partial<PresenceState>
        if (value.participant) {
          states.push({
            participant: value.participant,
            selection: value.selection ?? [],
            cursor: value.cursor ?? null,
          })
        }
      }
      setOthers(states)
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
