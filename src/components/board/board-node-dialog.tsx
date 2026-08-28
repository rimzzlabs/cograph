import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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

/** Edits a service's label, kind, and note. */
export function BoardNodeDialog(props: BoardNodeDialogProps) {
  const { node, onSubmit, onClose } = props

  return (
    <Dialog
      open={node !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent>
        {/* The form mounts with the dialog, so it loads the edited node fresh. */}
        {node ? <BoardNodeForm node={node} onSubmit={onSubmit} /> : null}
      </DialogContent>
    </Dialog>
  )
}

interface BoardNodeFormProps {
  node: GraphNode
  onSubmit: (result: NodeDialogResult) => void
}

function BoardNodeForm(props: BoardNodeFormProps) {
  const labelId = useId()
  const kindId = useId()
  const noteId = useId()
  const [label, setLabel] = useState(props.node.data.label)
  const [kind, setKind] = useState<ServiceKind>(props.node.data.kind)
  const [note, setNote] = useState(props.node.data.note)
  const [error, setError] = useState<string | null>(null)

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

    props.onSubmit({ label: trimmed, kind, note: note.trim().slice(0, MAX_NOTE_LENGTH) })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Edit service</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor={labelId}>Label</Label>
        <Input
          id={labelId}
          value={label}
          onChange={(event) => {
            setLabel(event.target.value)
            setError(null)
          }}
          maxLength={MAX_LABEL_LENGTH}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={kindId}>Kind</Label>
        <Select value={kind} onValueChange={(value) => setKind(value as ServiceKind)}>
          <SelectTrigger id={kindId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_KINDS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={noteId}>Note</Label>
        <Textarea
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          className="resize-none"
        />
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-xs">
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
