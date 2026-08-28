import { useEffect, useState } from "react"
import type { BoardConnection } from "@/lib/yjs/board-connection"
import type { Participant } from "@/stores/session-store"

export interface PresenceState {
  participant: Participant
  selection: string[]
  cursor: { x: number; y: number } | null
}

export interface AgentPresence {
  participant: Participant
  cursor: { x: number; y: number } | null
}

interface UsePresenceParams {
  board: BoardConnection | null
  me: Participant
  selection: string[]
  /** The local agent, once it has acted. Rides this client's awareness state. */
  agent: AgentPresence | null
}

/**
 * Publishes the local participant into Yjs awareness and reports everyone else.
 *
 * One identity can hold several awareness entries, because every tab opens its
 * own connection. States are therefore grouped by participant id and collapsed
 * to the most recently updated one, so a person in two tabs appears once.
 *
 * An agent does not open its own connection. It rides its human's awareness
 * state as the `agentParticipant` field, and the read side lifts it out as a
 * participant of its own — a seat, a colour, and a cursor.
 */
export function usePresence(params: UsePresenceParams) {
  const { board, me, selection, agent } = params
  const [others, setOthers] = useState<PresenceState[]>([])

  useEffect(() => {
    if (!board) return

    const { awareness } = board.provider
    awareness.setLocalStateField("participant", me)
    awareness.setLocalStateField("selection", selection)
    awareness.setLocalStateField("agentParticipant", agent?.participant ?? null)
    awareness.setLocalStateField("agentCursor", agent?.cursor ?? null)

    function readOthers() {
      const newest = new Map<string, { state: PresenceState; lastUpdated: number }>()

      const offer = (participantId: string, lastUpdated: number, state: PresenceState) => {
        const existing = newest.get(participantId)
        if (existing && existing.lastUpdated >= lastUpdated) return
        newest.set(participantId, { lastUpdated, state })
      }

      for (const [clientId, state] of awareness.getStates()) {
        if (clientId === awareness.clientID) continue

        const value = state as Partial<PresenceState> & {
          agentParticipant?: Participant | null
          agentCursor?: { x: number; y: number } | null
        }
        const lastUpdated = awareness.meta.get(clientId)?.lastUpdated ?? 0

        // Another tab of this same person carries the same participant ids, so
        // the newest-wins grouping below collapses it for agents too.
        if (value.participant && value.participant.id !== me.id) {
          offer(value.participant.id, lastUpdated, {
            participant: value.participant,
            selection: value.selection ?? [],
            cursor: value.cursor ?? null,
          })
        }

        if (value.agentParticipant && value.agentParticipant.id !== `${me.id}:agent`) {
          offer(value.agentParticipant.id, lastUpdated, {
            participant: value.agentParticipant,
            selection: [],
            cursor: value.agentCursor ?? null,
          })
        }
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
  }, [board, me, selection, agent])

  return others
}

export function publishCursor(
  board: BoardConnection | null,
  cursor: { x: number; y: number } | null,
) {
  board?.provider.awareness.setLocalStateField("cursor", cursor)
}
