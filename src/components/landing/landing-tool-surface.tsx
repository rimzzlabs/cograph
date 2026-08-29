import { Badge } from "@/components/ui/badge"

interface ToolSurfaceRow {
  state: string
  tools: string[]
  prefix?: string
}

const TOOL_SURFACE_ROWS: ToolSurfaceRow[] = [
  {
    state: "Any",
    tools: [
      "describe_board",
      "find_blast_radius",
      "find_dependencies",
      "find_dependency_cycles",
      "read_service_notes",
    ],
  },
  { state: "Role permits editing", prefix: "adds", tools: ["add_service", "simulate_failure"] },
  {
    state: "One service selected",
    prefix: "adds",
    tools: ["update_selected_service", "delete_selected_service"],
  },
  { state: "Two services selected", prefix: "adds", tools: ["connect_selected_services"] },
  { state: "A service is down", prefix: "adds", tools: ["resolve_incident"] },
  { state: "Role is viewer", tools: [] },
]

export function LandingToolSurface() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="min-w-0">
        <h2 className="font-landing-display font-semibold text-2xl text-ink tracking-tight">
          The tool surface follows the UI
        </h2>
        <p className="mt-5 max-w-[52ch] text-ink-muted leading-relaxed">
          Cograph registers its tools on{" "}
          <code className="font-landing-display text-[0.85em] text-ink">document.modelContext</code>
          , the WebMCP browser API. A tool you cannot use right now is not registered — it does not
          exist for the agent, so the agent cannot call it and get an error.
        </p>
        <p className="mt-4 max-w-[52ch] text-ink-muted leading-relaxed">
          Select a service on the canvas and{" "}
          <code className="font-landing-display text-[0.85em] text-ink">
            update_selected_service
          </code>{" "}
          appears in the agent's hands. Deselect it, and the tool is gone.
        </p>
      </div>

      <div className="min-w-0 rounded-2xl border border-line bg-surface shadow-soft">
        <div className="flex items-center justify-between border-line border-b px-5 py-3">
          <h3 className="font-landing-display text-ink text-sm">Agent tool surface</h3>
          <Badge variant="secondary">follows board state</Badge>
        </div>
        <div className="overflow-x-auto px-5 pb-2">
          <table className="w-full min-w-[24rem] border-collapse text-left">
            <caption className="sr-only">
              Which tools the agent can call in each board state
            </caption>
            <tbody>
              {TOOL_SURFACE_ROWS.map((row) => (
                <tr key={row.state} className="border-line border-b last:border-0">
                  <th
                    scope="row"
                    className="w-[38%] py-3.5 pr-4 align-top font-normal text-ink text-sm"
                  >
                    {row.state}
                  </th>
                  <td className="py-3 align-top">
                    {row.tools.length === 0 ? (
                      <span className="text-ink-muted text-sm">read-only tools only</span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {row.prefix ? (
                          <span className="text-ink-muted text-sm">{row.prefix}</span>
                        ) : null}
                        {row.tools.map((tool) => (
                          <code
                            key={tool}
                            className="rounded-md border border-line bg-surface-raised px-1.5 py-0.5 font-landing-display text-[0.72rem] text-ink"
                          >
                            {tool}
                          </code>
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
