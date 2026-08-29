import { ArrowLeftRightIcon, ArrowRightIcon } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EdgeKind, GraphNode } from "@/lib/graph/types"
import { EDGE_KINDS } from "@/lib/graph/types"

export interface ConnectPair {
  source: GraphNode
  target: GraphNode
}

export interface ConnectDialogResult {
  source: string
  target: string
  kind: EdgeKind
}

interface BoardConnectDialogProps {
  pair: ConnectPair | null
  onSubmit: (result: ConnectDialogResult) => void
  onClose: () => void
}

/** The keyboard path to connect two selected services. */
export function BoardConnectDialog(props: BoardConnectDialogProps) {
  const { pair, onSubmit, onClose } = props

  return (
    <Dialog
      open={pair !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        {pair ? <BoardConnectForm pair={pair} onSubmit={onSubmit} /> : null}
      </DialogContent>
    </Dialog>
  )
}

interface BoardConnectFormProps {
  pair: ConnectPair
  onSubmit: (result: ConnectDialogResult) => void
}

function BoardConnectForm(props: BoardConnectFormProps) {
  const kindId = useId()
  const [reversed, setReversed] = useState(false)
  const [kind, setKind] = useState<EdgeKind>("calls")

  const from = reversed ? props.pair.target : props.pair.source
  const to = reversed ? props.pair.source : props.pair.target

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    props.onSubmit({ source: from.id, target: to.id, kind })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Connect services</DialogTitle>
        <DialogDescription>
          The dependency points from {from.data.label} to {to.data.label}.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-2 text-ink text-sm">
        <span className="rounded-md bg-surface-raised px-2 py-1">{from.data.label}</span>
        <ArrowRightIcon className="size-4 text-ink-muted" aria-hidden="true" />
        <span className="rounded-md bg-surface-raised px-2 py-1">{to.data.label}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Swap direction"
          onClick={() => setReversed((value) => !value)}
        >
          <ArrowLeftRightIcon />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={kindId}>Kind</Label>
        <Select value={kind} onValueChange={(value) => setKind(value as EdgeKind)}>
          <SelectTrigger id={kindId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDGE_KINDS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="ghost">Cancel</Button>} />
        <Button type="submit">Connect</Button>
      </DialogFooter>
    </form>
  )
}
