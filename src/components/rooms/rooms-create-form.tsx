import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createRoom, type RoomsDirectory } from "@/lib/rooms/api"

const BLOCKED_REASONS: Record<string, string> = {
  already_created: "You already created a room. One per person keeps the demo affordable.",
  room_limit: "All room slots are taken. Join an existing room instead.",
}

export function RoomsCreateForm(props: { directory: RoomsDirectory }) {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const blockedReason = props.directory.reason ? BLOCKED_REASONS[props.directory.reason] : null

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)

    const result = await createRoom(name)
    if (!result.ok) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    navigate(`/rooms/${result.value.id}`)
  }

  if (blockedReason) {
    return <p className="max-w-[48ch] text-ink-muted text-sm leading-relaxed">{blockedReason}</p>
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md">
      <Label htmlFor="room-name">Room name</Label>
      <div className="mt-2 flex flex-col gap-2">
        <Input
          id="room-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="payments-team"
          maxLength={40}
          required
          aria-describedby="room-name-help"
        />
        <Button type="submit" disabled={submitting} className="cursor-pointer">
          {submitting ? "Creating…" : "Create room"}
        </Button>
      </div>
      <p id="room-name-help" className="mt-2 min-h-lh text-ink-muted text-xs" role="status">
        {error ?? "One room per person. Letters, numbers, and dashes."}
      </p>
    </form>
  )
}
