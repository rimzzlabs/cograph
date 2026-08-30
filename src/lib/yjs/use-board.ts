import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { type BoardConnection, connectToBoard } from "./board-connection"

/** Opens the room connection and tears it down when the room changes or unmounts. */
export function useBoardConnection(roomId: string) {
  const [board, setBoard] = useState<BoardConnection | null>(null)

  useEffect(() => {
    const connection = connectToBoard(roomId)
    setBoard(connection)

    return () => {
      setBoard(null)
      connection.destroy()
    }
  }, [roomId])

  return board
}

const EMPTY_SNAPSHOT = { nodes: [], edges: [] }

export function useBoardSnapshot(board: BoardConnection | null) {
  const store = useMemo(
    () => ({
      subscribe: (listener: () => void) => board?.subscribe(listener) ?? (() => {}),
      getSnapshot: () => board?.getSnapshot() ?? EMPTY_SNAPSHOT,
    }),
    [board],
  )

  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}

/**
 * True once the provider has finished its first sync, so the UI can tell a
 * still-loading board from a truly empty one. A connection that fails also
 * settles to true: the board still works locally, and waiting longer would
 * hold the canvas hostage.
 */
export function useBoardSynced(board: BoardConnection | null) {
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!board) {
      setSynced(false)
      return
    }
    if (board.provider.synced) {
      setSynced(true)
      return
    }

    setSynced(false)
    function onSync(isSynced: boolean) {
      if (isSynced) setSynced(true)
    }
    // A connect that never succeeds emits no "disconnected" status — only
    // "connection-error". Both mean the same here: stop waiting for a sync.
    function onFailure() {
      setSynced(true)
    }
    board.provider.on("sync", onSync)
    board.provider.on("connection-error", onFailure)
    return () => {
      board.provider.off("sync", onSync)
      board.provider.off("connection-error", onFailure)
    }
  }, [board])

  return synced
}

export function useConnectionStatus(board: BoardConnection | null) {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")

  useEffect(() => {
    if (!board) return

    function onStatus(event: { status: string }) {
      setStatus(event.status === "connected" ? "connected" : "disconnected")
    }

    board.provider.on("status", onStatus)
    return () => board.provider.off("status", onStatus)
  }, [board])

  return status
}
