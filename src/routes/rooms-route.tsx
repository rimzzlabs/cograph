import "@fontsource-variable/jetbrains-mono"
import "@fontsource/ibm-plex-sans/400.css"
import "@fontsource/ibm-plex-sans/500.css"
import "@fontsource/ibm-plex-sans/600.css"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router"
import { BrandMark } from "@/components/brand-mark"
import { LandingLabel } from "@/components/landing/landing-label"
import { RoomsCreateForm } from "@/components/rooms/rooms-create-form"
import { RoomsRoomCard } from "@/components/rooms/rooms-room-card"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  deleteRoom,
  fetchRoomsDirectory,
  type RoomsDirectory,
  type RoomsResult,
} from "@/lib/rooms/api"

export function RoomsRoute() {
  const [directory, setDirectory] = useState<RoomsResult<RoomsDirectory> | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback((signal?: AbortSignal) => {
    return fetchRoomsDirectory(signal)
      .then(setDirectory)
      .catch(() => {})
  }, [])

  // Syncing with the Worker API is the one effect this page needs; everything
  // else derives from the result value or runs in an event handler.
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  async function onDelete(id: string) {
    setDeletingId(id)
    setDeleteError(null)
    const result = await deleteRoom(id)
    if (!result.ok) setDeleteError(result.error)
    await load()
    setDeletingId(null)
  }

  return (
    <div className="flex min-h-full flex-col font-landing-sans">
      <header className="border-line border-b bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Cograph home"
              className="cursor-pointer rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <BrandMark />
            </Link>
            <span className="font-landing-display text-ink-muted text-sm">
              / <span className="text-ink">rooms</span>
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <LandingLabel>room_directory</LandingLabel>
        <h1 className="mt-4 font-landing-display font-semibold text-2xl text-ink tracking-tight">
          Pick a room
        </h1>
        <p className="mt-3 max-w-[56ch] text-ink-muted text-sm leading-relaxed">
          Every room is one shared board behind its own Durable Object. Anyone can join any room —
          and anyone can delete one, because there are no accounts here.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section aria-label="All rooms" className="min-w-0">
            {deleteError ? (
              <p className="mb-4 text-danger text-sm" role="alert">
                {deleteError}
              </p>
            ) : null}
            <ul className="grid gap-4 sm:grid-cols-2">
              <RoomsRoomCard id="demo" name="demo" isDemo />
              {directory?.ok
                ? directory.value.rooms.map((room) => (
                    <RoomsRoomCard
                      key={room.id}
                      id={room.id}
                      name={room.name}
                      createdAt={room.createdAt}
                      onDelete={onDelete}
                      deleting={deletingId === room.id}
                    />
                  ))
                : null}
            </ul>
            {directory === null ? (
              <p className="mt-4 text-ink-muted text-sm">Loading the room list…</p>
            ) : null}
            {directory !== null && !directory.ok ? (
              <p className="mt-4 text-danger text-sm" role="alert">
                {directory.error}
              </p>
            ) : null}
            {directory?.ok && directory.value.rooms.length === 0 ? (
              <p className="mt-6 text-ink-muted text-sm">
                No created rooms yet. Yours can be the first.
              </p>
            ) : null}
          </section>

          <section aria-label="Create a room" className="min-w-0">
            <div className="rounded-2xl bg-linear-to-br from-human/50 via-line to-agent/50 p-px shadow-soft">
              <div className="rounded-[calc(1rem-1px)] bg-surface p-5">
                <h2 className="font-landing-display text-ink text-sm">create_room</h2>
                <p className="mt-2 text-ink-muted text-xs leading-relaxed">
                  One per person, twenty in total — the free tier pays for all of this.
                </p>
                <div className="mt-4">
                  {directory?.ok ? (
                    <RoomsCreateForm directory={directory.value} />
                  ) : (
                    <p className="text-ink-muted text-sm">Loading…</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
