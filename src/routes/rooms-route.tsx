import { useEffect, useState } from "react"
import { Link } from "react-router"
import { RoomsCreateForm } from "@/components/rooms/rooms-create-form"
import { RoomsRoomCard } from "@/components/rooms/rooms-room-card"
import { ThemeToggle } from "@/components/theme-toggle"
import { fetchRoomsDirectory, type RoomsDirectory, type RoomsResult } from "@/lib/rooms/api"

export function RoomsRoute() {
  const [directory, setDirectory] = useState<RoomsResult<RoomsDirectory> | null>(null)

  // Syncing with the Worker API is the one effect this page needs; everything
  // else derives from the result value.
  useEffect(() => {
    const controller = new AbortController()
    fetchRoomsDirectory(controller.signal)
      .then(setDirectory)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-line border-b bg-surface px-4 py-2">
        <div>
          <Link
            to="/"
            className="cursor-pointer rounded-sm font-semibold text-ink text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Cograph
          </Link>
          <p className="text-ink-muted text-xs">rooms</p>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <h1 className="font-semibold text-2xl text-ink tracking-tight">Rooms</h1>
        <p className="mt-2 max-w-[56ch] text-ink-muted text-sm leading-relaxed">
          Every room is one shared board behind its own Durable Object. Join any of them, or create
          your own — one per person, so the free tier stays safe.
        </p>

        <section aria-label="Create a room" className="mt-8">
          {directory === null ? (
            <p className="text-ink-muted text-sm">Loading the room list…</p>
          ) : directory.ok ? (
            <RoomsCreateForm directory={directory.value} />
          ) : (
            <p className="text-danger text-sm" role="alert">
              {directory.error}
            </p>
          )}
        </section>

        <section aria-label="All rooms" className="mt-10">
          <ul className="grid gap-4 sm:grid-cols-2">
            <RoomsRoomCard id="demo" name="demo" isDemo />
            {directory?.ok
              ? directory.value.rooms.map((room) => (
                  <RoomsRoomCard
                    key={room.id}
                    id={room.id}
                    name={room.name}
                    createdAt={room.createdAt}
                  />
                ))
              : null}
          </ul>
          {directory?.ok && directory.value.rooms.length === 0 ? (
            <p className="mt-6 text-ink-muted text-sm">
              No created rooms yet. Yours can be the first.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  )
}
