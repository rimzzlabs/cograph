# Cograph

A shared architecture graph where your agent has a cursor.

Cograph is a real-time collaborative board for system architecture and service dependencies. People
and AI agents edit the same graph at the same time. An agent is a participant, not a chat box: it
has an identity, a seat in the participant list, and a permission set.

Cograph uses the [WebMCP](https://github.com/webmachinelearning/webmcp) browser API
(`document.modelContext`).

## What makes it different

The tool surface is a function of application state. A tool that you cannot use right now is not
registered. It does not exist for the agent, so the agent cannot call it and get an error.

| Board state           | Tools the agent can call                                   |
| --------------------- | ---------------------------------------------------------- |
| Any                   | `describe_board`, `find_blast_radius`, `find_dependencies` |
| Role permits editing  | adds `add_service`, `simulate_failure`                     |
| One service selected  | adds `update_selected_service`, `delete_selected_service`  |
| Two services selected | adds `connect_selected_services`                           |
| A service is down     | adds `resolve_incident`                                    |
| Role is viewer        | read-only tools only                                       |

Registration and removal use an `AbortSignal`. React effect cleanup calls `controller.abort()`, so
the agent's tool list follows the UI exactly.

The **Agent tool surface** panel shows the live list. Select and deselect nodes on the canvas to
watch the list grow and shrink.

## Trust

`read_service_notes` carries `untrustedContentHint: true`. Notes are written by other participants.
Their text goes into the agent's context, so it is data to report, never instructions to obey.

Read-only tools carry `readOnlyHint: true`. Destructive tools carry `destructiveHint: true`. The
inspector panel shows these as badges.

## Stack

- **Vite + React 19 + TypeScript** — single-page app
- **@xyflow/react** (React Flow 12) — graph canvas, fully controlled
- **Yjs** — CRDT document, one per room
- **Cloudflare Workers + Durable Objects** — one Durable Object per room relays the Yjs sync and
  awareness protocols, and persists the document
- **Tailwind CSS 4**, **Biome** (code), **Prettier** (Markdown and YAML only)

Yjs owns the graph. React Flow renders it. Local edits write to the document and come back through
the snapshot, so there is one source of truth.

## Run it

```bash
pnpm install
pnpm dev
```

Open the printed URL. The app redirects to `/r/demo`.

To see more than one person, open the same URL in an incognito window or in a second browser. A
second tab in the same browser shows the same person, because one browser profile holds one
identity.

To see the agent tools, use Chrome 149 or later with `chrome://flags/#enable-webmcp-testing`
enabled, or open the app in the ChatGPT in-app browser. Brave does not ship the API, with any flag.

The first tool call gives the agent a seat: a participant chip, a colour from the same name rule
that people use, and a cursor that moves to the node each tool call touches.

To edit by hand: right-click the canvas to add a service, right-click a node or an edge for edit and
delete, double-click a node to open the editor, and drag between handles to connect. Backspace
deletes the selection.

## Commands

| Command            | What it does                        |
| ------------------ | ----------------------------------- |
| `pnpm dev`         | Start Vite and the Worker           |
| `pnpm build`       | Type-check and build                |
| `pnpm deploy`      | Build and deploy to Cloudflare      |
| `pnpm typecheck`   | Type-check only                     |
| `pnpm test:color`  | Check the participant colour rules  |
| `pnpm test:webmcp` | Drive the tools through real Chrome |
| `pnpm lint`        | Biome check                         |
| `pnpm lint:fix`    | Biome check and write fixes         |
| `pnpm format`      | Prettier on Markdown and YAML       |
| `pnpm cf-typegen`  | Regenerate Cloudflare binding types |

Run `pnpm cf-typegen` after you change `wrangler.jsonc`.

## Layout

```
src/
  components/board/      Canvas and custom nodes
  components/presence/   Participant list
  components/agent/      Live tool-surface inspector
  lib/mcp/               WebMCP types, useAgentTool, board tool surface
  lib/yjs/               Document connection and mutations
  lib/graph/             Traversal: dependents, dependencies, cycles, paths
  lib/presence/          Awareness
  stores/                Zustand stores
worker/
  index.ts               Routes /api/room/:id to the room
  room.ts                Durable Object: Yjs sync, awareness, persistence
```

## License

MIT. See [LICENSE](./LICENSE).
