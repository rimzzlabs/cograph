import { ChevronDown } from "lucide-react"
import { LandingLabel } from "@/components/landing/landing-label"

interface FaqItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is Cograph production software?",
    answer:
      "No. It is an experiment around a draft browser API. The board works and the sync is real, but treat it like a demo, not a system of record.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. Pick a name and enter a room. Rooms are public shared documents, so keep secrets off the board.",
  },
  {
    question: "Which browsers can run the agent?",
    answer:
      "Chrome 149 or later with the WebMCP flag enabled, or the ChatGPT in-app browser. Every other browser still gets the full human experience — the board never needs the agent to work.",
  },
  {
    question: "What happens when two people edit at once?",
    answer:
      "The graph is a Yjs CRDT. Concurrent edits merge without locks or conflicts, and one Durable Object per room relays and persists the document.",
  },
  {
    question: "Why can I only create one room?",
    answer:
      "Cograph runs on the Cloudflare free tier, and every room is its own Durable Object. One created room per person and a global cap keep the object count safe. The demo room is exempt and always open.",
  },
  {
    question: "What stops the agent from wrecking the board?",
    answer:
      "The same thing that stops a person: a role. A viewer's agent gets read-only tools, destructive tools carry a label so an agent can ask before calling one, and notes written by other participants arrive marked as untrusted data.",
  },
]

export function LandingFaq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24">
      <div className="max-w-2xl">
        <LandingLabel>honest_questions</LandingLabel>
        <h2 className="mt-4 font-landing-display font-semibold text-2xl text-ink tracking-tight">
          Questions you should ask
        </h2>
        <p className="mt-4 text-ink-muted leading-relaxed">
          Honest answers, because the demo is public and the API is a draft.
        </p>

        <div className="mt-8">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group border-line border-t last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-ink text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink-muted transition-transform duration-200 ease-out group-open:rotate-180"
                />
              </summary>
              <p className="pb-5 text-ink-muted text-sm leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
