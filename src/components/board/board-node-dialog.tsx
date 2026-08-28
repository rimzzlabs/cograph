import { useEffect, useId, useRef, useState } from "react"
import type { GraphNode, ServiceKind } from "@/lib/graph/types"
import { SERVICE_KINDS } from "@/lib/graph/types"

const MAX_LABEL_LENGTH = 48
const MAX_NOTE_LENGTH = 280

export interface NodeDialogResult {
  label: string
  kind: ServiceKind
  note: string
}

interface BoardNodeDialogProps {
  node: GraphNode | null
  onSubmit: (result: NodeDialogResult) => void
  onClose: () => void
}

/** Edits a service's label, kind, and note in a native dialog element. */
export function BoardNodeDialog(props: BoardNodeDialogProps) {
  const { node, onSubmit, onClose } = props

  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [label, setLabel] = useState("")
  const [kind, setKind] = useState<ServiceKind>("service")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Sync with the external dialog element, and reload the form when the
  // edited node changes.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (node && !dialog.open) {
      setLabel(node.data.label)
      setKind(node.data.kind)
      setNote(node.data.note)
      setError(null)
      dialog.showModal()
    }
    if (!node && dialog.open) dialog.close()
  }, [node])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = label.trim()
    if (trimmed.length === 0) {
      setError("Enter a label.")
      return
    }
    if (trimmed.length > MAX_LABEL_LENGTH) {
      setError(`Use ${MAX_LABEL_LENGTH} characters or fewer.`)
      return
    }

    onSubmit({ label: trimmed, kind, note: note.trim().slice(0, MAX_NOTE_LENGTH) })
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto rounded-lg border border-line bg-surface p-0 text-ink backdrop:bg-black/60"
    >
      <form onSubmit={handleSubmit} className="flex w-96 flex-col gap-3 p-4">
        <h2 id={titleId} className="font-semibold text-sm">
          Edit service
        </h2>

        <label className="flex flex-col gap-1 text-ink-muted text-xs">
          Label
          <input
            value={label}
            onChange={(event) => {
              setLabel(event.target.value)
              setError(null)
            }}
            maxLength={MAX_LABEL_LENGTH}
            className="rounded-md border border-line bg-surface-raised px-2 py-1.5 text-ink text-sm outline-none focus-visible:border-human"
          />
        </label>

        <label className="flex flex-col gap-1 text-ink-muted text-xs">
          Kind
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as ServiceKind)}
            className="rounded-md border border-line bg-surface-raised px-2 py-1.5 text-ink text-sm outline-none focus-visible:border-human"
          >
            {SERVICE_KINDS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-ink-muted text-xs">
          Note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={MAX_NOTE_LENGTH}
            rows={3}
            className="resize-none rounded-md border border-line bg-surface-raised px-2 py-1.5 text-ink text-sm outline-none focus-visible:border-human"
          />
        </label>

        {error ? (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-ink-muted text-xs hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-human px-3 py-1.5 font-medium text-canvas text-xs"
          >
            Save
          </button>
        </div>
      </form>
    </dialog>
  )
}
