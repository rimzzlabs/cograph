import { useEffect, useId, useRef, useState } from "react"

const MAX_NAME_LENGTH = 32

interface ParticipantNameDialogProps {
  open: boolean
  currentName: string
  onSubmit: (name: string) => void
  onClose: () => void
}

/**
 * Uses the native dialog element, so focus trapping, Escape, and the backdrop
 * come from the platform. The effect below only mirrors React state onto the
 * element's imperative open and close methods.
 */
export function ParticipantNameDialog(props: ParticipantNameDialogProps) {
  const { open, currentName, onSubmit, onClose } = props

  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const errorId = useId()
  const [draft, setDraft] = useState(currentName)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = draft.trim()
    if (trimmed.length === 0) {
      setError("Enter a name.")
      return
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`Use ${MAX_NAME_LENGTH} characters or fewer.`)
      return
    }

    setError(null)
    onSubmit(trimmed)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto rounded-lg border border-line bg-surface p-0 text-ink backdrop:bg-black/60"
    >
      <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-3 p-4">
        <h2 id={titleId} className="font-semibold text-sm">
          Your display name
        </h2>
        <p className="text-ink-muted text-xs">
          Everyone on this board sees this name. Your colour comes from it.
        </p>

        <input
          // The dialog exists only to edit this field, so focus belongs here.
          autoFocus
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(null)
          }}
          maxLength={MAX_NAME_LENGTH}
          aria-label="Display name"
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          className="rounded-md border border-line bg-surface-raised px-2 py-1.5 text-sm outline-none focus-visible:border-human"
        />

        {error ? (
          <p id={errorId} role="alert" className="text-danger text-xs">
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
