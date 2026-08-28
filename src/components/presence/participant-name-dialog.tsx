import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const MAX_NAME_LENGTH = 32

interface ParticipantNameDialogProps {
  open: boolean
  currentName: string
  onSubmit: (name: string) => void
  onClose: () => void
}

export function ParticipantNameDialog(props: ParticipantNameDialogProps) {
  const { open, currentName, onSubmit, onClose } = props

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        {/* The form mounts with the dialog, so its state resets on each open. */}
        {open ? <ParticipantNameForm currentName={currentName} onSubmit={onSubmit} /> : null}
      </DialogContent>
    </Dialog>
  )
}

interface ParticipantNameFormProps {
  currentName: string
  onSubmit: (name: string) => void
}

function ParticipantNameForm(props: ParticipantNameFormProps) {
  const errorId = useId()
  const [draft, setDraft] = useState(props.currentName)
  const [error, setError] = useState<string | null>(null)

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
    props.onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Your display name</DialogTitle>
        <DialogDescription>
          Everyone on this board sees this name. Your colour comes from it.
        </DialogDescription>
      </DialogHeader>

      <Input
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
      />

      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button variant="ghost">Cancel</Button>} />
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
