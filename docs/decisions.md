# Decisions

A record of what we decided, and why. Add a new entry each time the project changes direction. Keep
the newest entry at the bottom.

---

## 001 — Build idea E: agents as participants on a shared graph

**Date:** 2026-08-28

We build a real-time collaborative board. People and AI agents edit the same graph at the same time.

Idea E was first rated low, because one judge opens the URL alone and sees no other person. We
changed the frame to remove that risk. The agent is a participant. It has an identity, a seat in the
participant list, and a permission set. One person plus their agent is already two actors.
Multi-person use is now a bonus, not a condition.

**Rejected:** ideas C and D, a federated consent layer. The cross-origin part depends on browser
support we cannot confirm. Idea E carries no such external risk.

---

## 002 — Name the project Cograph

**Date:** 2026-08-28

"Cograph" joins `co-` (together) with `graph`. It is also a term from graph theory. The name is
short, it is easy to say in a video, and no product uses it.

Tagline: _A shared architecture graph where your agent has a cursor._

**Rejected:** Quorum (a blockchain product uses the name), Ensemble (says nothing about graphs),
Downstream (says nothing about collaboration).

---

## 003 — Make the artefact an architecture and dependency graph

**Date:** 2026-08-28

A graph gives the agent work that a person cannot do quickly by eye. Examples are blast radius,
cycle detection, and path finding. A free-form sticky-note board does not.

Every judge on the panel has read an architecture diagram during an incident. The problem needs no
explanation in the video.

---

## 004 — Use a Vite single-page app, not Astro

**Date:** 2026-08-28

Astro reduces JavaScript for pages that are mostly static. This app is fully interactive. Every part
of it syncs live.

The tool surface must read global application state, such as selection, role, and connection status.
That needs one React tree with one state root. Astro islands are independent by design and work
against this.

**Rejected:** Astro with React islands. Also rejected: a Turborepo monorepo. One package is enough
for one app and one Worker.

---

## 005 — Use React Flow, and render with DOM and SVG

**Date:** 2026-08-28

`@xyflow/react` version 12 supplies pan, zoom, drag, selection, edge routing, and a minimap. This
saves about 1.5 days.

Do not render the board into a `<canvas>` element. A `<canvas>` is an opaque bitmap. This hackathon
is about pages that agents can read and act on. Real DOM elements also give text editing, focus, and
accessibility at no cost.

React Flow runs fully controlled. Yjs owns the graph. React Flow renders it. Local edits write to
the Yjs document and return through the snapshot. There is one source of truth.

---

## 006 — Sync with Yjs over a Cloudflare Durable Object

**Date:** 2026-08-28

One Durable Object holds one board. It relays the Yjs sync and awareness protocols between peers. It
persists the encoded document to storage on a 2 second debounce.

The Durable Object speaks the standard y-websocket wire protocol. The browser therefore uses the
`y-websocket` client package unchanged. We do not write a provider.

The Worker serves the built assets and the board sockets from one origin. One `wrangler deploy`
ships everything. This also keeps the `Permissions-Policy` header in one place, which WebMCP needs.

---

## 007 — Make the tool surface a function of application state

**Date:** 2026-08-28

This is the core design. It is also the highest-scoring behaviour under the "WebMCP Leverage"
criterion.

A tool that you cannot use right now is not registered. It does not exist for the agent. The agent
cannot call it and receive an error.

`useAgentTool()` takes a specification or `null`. It registers on a specification and unregisters on
`null`, through an `AbortSignal`. React effect cleanup calls `controller.abort()`. The agent's tool
list therefore follows the user interface exactly.

The effect is keyed on the declarative part of the specification only. The `execute` function is
read through a ref. A new closure on each render does not churn the agent's tool list.

Tools carry annotations. `readOnlyHint` marks tools that do not mutate. `destructiveHint` marks
tools that delete. `untrustedContentHint` marks `read_service_notes`, because other participants
write those notes and their text enters the agent's context.

---

## 008 — Use Biome for code and Prettier for Markdown and YAML

**Date:** 2026-08-28

Biome formats and lints TypeScript, JavaScript, JSON, and CSS. Biome does not support YAML or
Markdown. Prettier covers those two formats only.

`biome migrate` rewrote the accessibility rules to `preset: "none"`. This disabled accessibility
linting. We set it back to `preset: "recommended"`. Check this setting after any future migration.

---

## 009 — Commit the generated Cloudflare types and the editor settings

**Date:** 2026-08-28

The Vite template ignores `worker-configuration.d.ts`. We track it instead. A judge who clones the
repository must be able to run `pnpm install` and then `pnpm build`. Without the file, the
type-check step fails.

The template also ignores all of `.vscode`. We track `.vscode/settings.json`, so that every
contributor uses the workspace TypeScript version.

---

## 010 — Deviations from the standard scaffold

**Date:** 2026-08-28

The house scaffold always adds shadcn/ui. We did not. This app needs a panel, chips, and badges. We
wrote those directly against the Tailwind theme tokens. `src/components/ui/` stays empty and
available.

The house scaffold never runs `git init`. The repository was initialised separately.

---

## 011 — Propose a stable presence identity for each browser profile

**Date:** 2026-08-28

The current code makes a new identity on each page load. It also names every person "You". We wrote
RFC #1 to fix this.

The proposal keeps the identity in `localStorage`. That store is scoped to one browser profile. Two
tabs therefore show one person. An incognito window or a second browser shows a different person.
The read step groups the awareness states by participant id, because each tab opens its own
connection.

The user sets a display name. A hash of the name gives a hue. The lightness and the chroma stay
fixed, so every colour is legible on the dark canvas. When two participants share a name, only the
colour of the peer moves.

Status: proposed, not implemented. Five open questions remain in the issue.

**Consequence for the demo:** two tabs in one browser will show one person. The video must use an
incognito window or a second browser to show multiplayer use.

See: https://github.com/rimzzlabs/cograph/issues/1

---

## Open risks

- **WebMCP is unverified in a browser.** `src/lib/mcp/types.ts` declares `document.modelContext`
  from the specification explainer. The code compiles. That proves nothing about Chrome. Test in
  Chrome 149 or later with `chrome://flags/#enable-webmcp-testing`, and in the ChatGPT in-app
  browser. `src/lib/mcp/use-agent-tool.ts` is the only file to change if the shipped API differs.
- **Live cursors are not wired.** `publishCursor()` exists. Nothing calls it. This is the feature
  that proves the tagline.
- **No agent participant is created yet.** `Participant.kind` accepts `"agent"` and the chip renders
  a badge. Nothing produces one.
- **The repository is private.** The submission needs a public repository with a license file at the
  root.
