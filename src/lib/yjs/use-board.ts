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
