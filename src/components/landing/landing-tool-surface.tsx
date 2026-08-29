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
        <h2 className="font-bold text-3xl text-ink tracking-tight">
          The tool surface follows the UI
        </h2>
        <p className="mt-5 max-w-[52ch] text-ink-muted leading-relaxed">
          Cograph registers its tools on{" "}
          <code className="font-mono text-[0.85em] text-ink">document.modelContext</code>, the
          WebMCP browser API. A tool you cannot use right now is not registered — it does not exist
          for the agent, so the agent cannot call it and get an error.
        </p>
        <p className="mt-4 max-w-[52ch] text-ink-muted leading-relaxed">
          Select a service on the canvas and{" "}
          <code className="font-mono text-[0.85em] text-ink">update_selected_service</code> appears
          in the agent's hands. Deselect it, and the tool is gone.
        </p>
      </div>

      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[26rem] border-collapse text-left">
          <caption className="sr-only">Which tools the agent can call in each board state</caption>
          <thead>
            <tr className="border-line border-b">
              <th
                scope="col"
                className="pb-3 font-medium text-ink-muted text-xs uppercase tracking-wider"
              >
                Board state
              </th>
              <th
                scope="col"
                className="pb-3 font-medium text-ink-muted text-xs uppercase tracking-wider"
              >
                Tools the agent can call
              </th>
            </tr>
          </thead>
          <tbody>
            {TOOL_SURFACE_ROWS.map((row) => (
              <tr key={row.state} className="border-line border-b last:border-0">
                <th
                  scope="row"
                  className="w-[38%] py-3 pr-4 align-top font-normal text-ink text-sm"
                >
                  {row.state}
                </th>
                <td className="py-3 align-top text-ink-muted text-sm">
                  {row.tools.length === 0 ? (
                    "read-only tools only"
                  ) : (
                    <>
                      {row.prefix ? `${row.prefix} ` : null}
                      {row.tools.map((tool, index) => (
                        <span key={tool}>
                          {index > 0 ? ", " : null}
                          <code className="font-mono text-[0.85em] text-ink">{tool}</code>
                        </span>
                      ))}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
