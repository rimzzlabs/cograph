import { Check, Eye } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface ShareViewLinkProps {
  roomId: string
}

/**
 * Copies a read-only link to this room. A participant who opens it gets the
 * viewer role: no editing surface, and an agent with read-only tools.
 */
export function ShareViewLink(props: ShareViewLinkProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  async function copy() {
    const url = new URL(`/rooms/${props.roomId}`, window.location.origin)
    url.searchParams.set("role", "viewer")

    try {
      await navigator.clipboard.writeText(url.toString())
    } catch {
      // The clipboard can be blocked outside a secure context. Show the link
      // itself, so the user can still copy it by hand.
      window.prompt("Copy the view link:", url.toString())
      return
    }

    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void copy()}>
      {copied ? <Check aria-hidden="true" /> : <Eye aria-hidden="true" />}
      {copied ? "Copied" : "View link"}
    </Button>
  )
}
