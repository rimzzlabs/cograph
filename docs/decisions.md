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

All five open questions are answered:

1. Use OKLCH, not hex.
2. Do not block the first load. Show a temporary name in the header. A dialog changes it.
3. Apply a minimum hue distance of 30 degrees across every present participant.
4. One identity shows one cursor. The most recent session wins.
5. An agent uses the same colour rule. It gets no reserved colour.

Answer 3 costs stability. A guaranteed hue distance and a colour that never moves cannot both hold.
The hue of a peer can move when another participant joins. The colour of the local user never moves.

Status: implemented, and verified in a browser on 2026-08-28. See entry 012 for a correction to the
colour rule.

**Consequence for the demo:** two tabs in one browser will show one person. The video must use an
incognito window or a second browser to show multiplayer use.

See: https://github.com/rimzzlabs/cograph/issues/1

---

## 012 — Anchor the hue grid on the local user

**Date:** 2026-08-28

We implemented RFC #1. One part of the agreed design was wrong, and we corrected it.

The RFC said that each peer starts at the hue of its name, and then steps by 30 degrees until it
clears the placed hues. That rule does not give the guarantee. Each participant steps on its own
grid, so twelve arbitrary start hues can still land closer than 30 degrees. A check with 12
participants produced a closest pair of 21 degrees.

The fix is one shared grid. The local user takes the exact hue of the local name. That hue anchors
12 slots, spaced 30 degrees apart. Each peer takes the slot nearest the hue of its name, and probes
forward when the slot is taken. A check with 12 participants now produces exactly 30 degrees.

The local user still keeps the exact hue of their own name, so the original rule holds.

`scripts/color-check.ts` holds the check. Run it with `pnpm test:color`. It covers the collision
rule, the spacing guarantee, the order independence, and the behaviour above 12 participants.

---

## 013 — WebMCP is verified against Chrome, and the agent has a seat

**Date:** 2026-08-28

We probed the real API headless, over CDP, against Chrome for Testing 152 with
`--enable-webmcp-testing`. The entry point is `document.modelContext`, exactly as the explainer
says. Our side of the boundary was already correct: the tool callback receives parsed object args
and returns a `{ content, isError }` object.

Two wire-format facts differ from our first types. `RegisteredTool.inputSchema` is a serialized JSON
string, and `executeTool` takes a JSON string in and returns a JSON string out. The engine never
validates args against the schema, so our structured error results are the only feedback an agent
gets.

**Brave 152 does not ship the API.** The strings are in the binary, but the supplement never
installs, with every flag enabled. Use Chrome.

The agent is now a visible participant. It does not open its own connection. It rides its human's
awareness state as an `agentParticipant` field, and the read side lifts it into a seat of its own: a
chip, the name-hash colour, and a cursor that moves to the node its tool call touched. The agent has
no seat until its first call, so an idle page shows no phantom participant.

`scripts/webmcp-check.mjs` proves the loop end to end: it serves the build, launches Chrome
headless, and drives the board through the browser's own `executeTool`. 17 checks pass, and two of
them assert the agent's seat and the engine-reported tool count from the page itself. Run it with
`CHROME_BIN=<chrome> pnpm test:webmcp`.

---

## 014 — Give humans an editing surface

**Date:** 2026-08-28

Manual testing in Chrome surfaced the gap at once: the agent had six tools, and a person had none.
There was no way to add a node without the console.

The board now has a right-click menu. On the canvas it adds a service of any kind at the clicked
position. On a node it opens edit and delete. On an edge it changes the kind or deletes. A toolbar
button covers touch and keyboard users, and a native dialog edits the label, the kind, and the note.
Backspace deletion now writes through to the shared document, which it silently did not before.

Every path writes through the same Yjs mutations that the agent tools use. A human edit and an agent
edit are the same operation with a different author.

A viewer role gets no menu, no toolbar, and no keyboard deletion — the same rule that hides the
agent's mutating tools.

---

## Open risks

- **The ChatGPT in-app browser is untested.** Chrome is verified by `pnpm test:webmcp`. The
  challenge names ChatGPT's browser as a judging surface, and nothing here has touched it.
- **The repository is private.** The submission needs a public repository with a license file at the
  root. Keep it private until near the deadline, then flip it.
