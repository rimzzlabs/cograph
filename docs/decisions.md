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

## 015 — Rebuild the UI on shadcn with Base UI primitives

**Date:** 2026-08-28

Decision 010 skipped shadcn because the app then had only a panel and some chips. The app now has
dialogs, a menu, form fields, buttons, and badges. That surface earns a component system. The house
convention is shadcn. The primitive layer is Base UI, because the user chose it over Radix.

Init choices, pinned: CLI `shadcn@4.19.0`, `init -b base -p nova`, CSS variables on, RTL off. The
CLI lives in `devDependencies`. The Geist font from the preset is removed — the app keeps the system
font stack.

The OKLCH tokens in `src/index.css` stay the source of truth. Each shadcn contract variable
(`background`, `foreground`, `primary`, `muted`, `accent`, `destructive`, `border`, `ring`, and the
rest) is an alias of one of our tokens. The app has one theme, and it is dark: the tokens sit on
`:root`, and `index.html` sets `class="dark"` so the components' `dark:` variants stay active.

One CLI trap: the CLI reads the root `tsconfig.json` to resolve the `@` alias. Ours is a
solution-style file with no `paths`, so the CLI wrote a literal `@/` directory. The root file now
carries `compilerOptions.paths`, and `shadcn add` lands in `src/`.

The button follows the design references: a vertical gradient made of white and black overlay stops
on `bg-primary`, a hairline inner highlight, a soft shadow, a brighter ramp on hover, and
`active:scale-[0.97]` with a 150 ms transition. `motion-reduce:` disables the transition and the
scale. Tailwind 4 registers gradient stops with `@property`, so the hover ramp eases instead of
snapping.

The board's right-click menu could not use the ContextMenu primitive, because React Flow owns the
right-click and reports the target (pane, node, or edge). The menu is a controlled Base UI Menu
anchored to the pointer position through a virtual anchor. The primitive supplies focus, arrow keys,
Home and End, typeahead, and dismissal — which pays down part of the #8 debt.

The two dialogs moved from native `dialog` elements to the Base UI Dialog. The form mounts with the
dialog, so its state resets on each open — no sync effect. Chips and badges sit on the shared
`Badge`; the participant colour still comes in through an inline `style`.

Bundle cost, gzip: JS 179 kB → 233 kB, CSS 6.4 kB → 11 kB. About 54 kB for the whole primitive
layer. Accepted.

**Rejected:** Radix as the primitive layer (the user chose Base UI); keeping the hand-rolled
components (the a11y debt in #8 was growing); replacing our tokens with the shadcn palette (the
theme is part of the product).

---

## 016 — A stacked avatar row with a real idle signal

**Date:** 2026-08-28

The topbar listed every participant as a full-width chip, which does not scale past a few members.
The topbar now shows a stack of circle avatars — initials on the participant colour, a bot glyph for
an agent — capped at 5, with an overflow bubble that counts the rest. A click on the stack opens a
popover with the full member list. Only the member's own row carries an edit control, wired to the
existing name dialog.

An online member wears a ring. A member idle for more than 1 minute loses it. Yjs awareness cannot
supply that signal on its own: y-websocket renews awareness for every open tab, so an idle tab never
expires. Each client therefore publishes its own `lastActiveAt` into awareness — stamped on pointer,
key, and wheel input, throttled to one write per 10 seconds — and every reader derives the online
state locally. The agent's seat gets its stamp from each tool call. A 15-second timer re-checks the
rings, so they expire without any local input.

**Rejected:** treating awareness presence as the online signal (it never goes idle); publishing a
computed `online` boolean (it would go stale the moment the publisher goes idle — the reader must
own the clock).

---

## 017 — Recolour the theme: calm warm neutrals, no blue

**Date:** 2026-08-29

The user rejected the blue accent and the gradient buttons. The direction is now calm and smooth.

The neutrals move from cold blue-grey (hue 264) to warm stone (hue ~80), at lower chroma. The
primary accent moves from blue (240) to sage green (150). The agent token moves to a calm lavender
(300). The danger and warn tokens drop chroma, so alerts read clearly without shouting. The
`ui-ux-pro-max` design search returned "mindful green + calm lavender" for this brief, and the
palette follows it.

The default and secondary buttons lose their white-and-black gradient overlays and inner highlight.
They are now flat, with a soft shadow and a 200 ms ease-out hover. The base radius grows from
0.625rem to 0.75rem. Node cards get the larger radius and a softer shadow.

The participant identity colours do not change. Their lightness and chroma stay at 0.74 and 0.15,
because hue spacing carries identity and `pnpm test:color` covers the rules. Two hardcoded blues
outside the token file are corrected: the cursor outline now reads `var(--color-canvas)`, and the
participant-list fallback hue moves to 150.

**Rejected:** a light theme (the product is a dark canvas, decision 015 stands); new display fonts
(decision 015 keeps the system stack, and calm comes from colour and motion here).

---

## 018 — Lavender primary, and a node card that shows its kind

**Date:** 2026-08-29

The user rejected the sage primary from entry 017. The primary accent is now a calm lavender (oklch
0.75 0.11 300). The design database returned "calm lavender" for the same calm brief, so the palette
keeps a verified source. The sage hue moves to the agent token, which colours datastore nodes and
chart-2. The warm stone neutrals from entry 017 stay.

The node card is rebuilt. Each service kind now has a lucide icon in a small tinted chip: Box,
Database, Layers, Globe, and Network. The icon sits beside the visible label, so it carries
`aria-hidden`. The kind caption is capitalised, and the label truncates instead of wrapping.

The handles were 6 px dots in a near-surface colour, and users could not find them. They are now 12
px circles with a 2 px canvas-colour border, so they read as sockets on the card edge. They tint to
the primary on hover.

The selection ring was a flat 2 px outline against the border. It now uses a 2 px ring with a 2 px
canvas-colour offset, so a selected card shows a clear halo that no border colour can hide.

**Rejected:** Phosphor icons (the icon search suggested them, but the repository already ships
lucide-react through shadcn); kind-coloured handles (two colour systems on one card edge reads
noisy, and the calm brief wins).

---

## 019 — Four handles, floating edges, and controlled selection

**Date:** 2026-08-29

Manual testing showed three faults. An edge stayed glued to its stored side, so a moved node dragged
its edge across its own card. A node gave no hover feedback. And a click on the pane did not clear
the selection.

Each node now has one handle per side. Every handle is type "source", and the canvas runs with
`ConnectionMode.Loose`, so a drag between any two handles connects. The stored edge keeps only its
source and target ids.

The rendered edge no longer uses the stored handle at all. `BoardFloatingEdge` reads the live
positions of both nodes and connects the two closest sides. The dominant axis picks the side pair.
The edge therefore realigns during the drag, not only after release.

Selection is now controlled from the session store, the same way Yjs owns the graph. The nodes and
edges given to React Flow carry a `selected` flag computed from the store, and `onPaneClick` clears
the store. Before this, React Flow kept selection in its internal state only, and a pane click could
not clear what the store held. The node card also gets a hover state: a raised surface and a deeper
shadow.

**Rejected:** storing the chosen handle per edge and rewriting it on drag release (write traffic for
a render concern, and the CRDT would sync cosmetic churn); separate source and target handles per
side (eight handles per card reads noisy, and Loose mode makes them redundant).

---

## 020 — Apply select changes in the same tick

**Date:** 2026-08-29

Entry 019 made selection controlled, and a click then showed its ring late. The ring waited for the
next unrelated re-render, such as a cursor publish or a snapshot arrival.

The cause sits in React Flow's controlled mode. A click mutates the internal node lookup silently
and emits a `select` change through `onNodesChange`. React Flow does not apply the change itself.
Our handler only processed `position` and `remove`, so no React state changed at click time. The
`onSelectionChange` effect only fired when a later update recomputed its selector.

`onNodesChange` and `onEdgesChange` now fold `select` changes into the session store in the same
tick. The ring, the store, and the agent tool surface update with the click. `onSelectionChange`
stays as a safety net for any other selection path.

One more latency hid in CSS. The ring utility is a box-shadow, and the card animates box-shadow over
200 ms for hover. The selected state now uses an outline, which is not in the transition list, so it
lands instantly.

---

## 021 — An Example button that teaches the canvas

**Date:** 2026-08-29

A new user opens an empty board and does not know the gestures. The tool inspector explains the
agent, but nothing explains the canvas.

The top-left panel now has an Example button beside the Service button. One click seeds a small
checkout system: a gateway, two services, a datastore, a queue, and one external service. Every
service kind appears once, and the edges show calls, reads, and publishes. Each node's note teaches
one gesture: drag, double-click, the four handles, the right-click menu, and Backspace. The view
then frames the whole example.

The seed writes through the same Yjs mutations that humans and agent tools use, inside one
transaction, so peers receive one sync burst. Labels deduplicate against the live board, so a second
click cannot break the agent's label-based lookup. `addNode` gained an optional `note` field for
this.

**Rejected:** a modal tutorial (a board that shows is better than a dialog that tells, and the notes
double as `read_service_notes` demo content); seeding only on an empty board (the demo room is
rarely empty).

---

## 022 — One selection writer, and an idempotent store

**Date:** 2026-08-29

A multi-select on the canvas crashed with React's "Maximum update depth exceeded".

The cause was two writers on one piece of state. Entry 020 made `onNodesChange` apply select changes
into the session store. The `onSelectionChange` prop stayed as a safety net, and it is not one:
React Flow fires it from an effect whenever its derived selection arrays change identity. Every
store write re-syncs the controlled props, which changes those identities, which fires the echo,
which wrote the store again. `setSelection` assigned fresh arrays unconditionally, so the cycle
never reached a fixed point. A single click survived only because React Flow's `checkEquality` kept
node references stable enough to calm the effect. A multi-select did not.

Two changes, and each alone breaks the loop. `onSelectionChange` is removed — select changes in
`onNodesChange` and `onEdgesChange` are the single writer. And `setSelection` now bails out when the
incoming ids equal the current ids. The compare ignores order on purpose: the store keeps click
order, which `connect_selected_services` reads as direction, and React Flow echoes the same set in
document order.

---

## 024 — Incident mode: a shared outage with a derived blast radius

**Date:** 2026-08-29

Entry 023 is on the viewer-link branch. This entry is the incident feature.

A node now carries an optional `status` field in the shared document. `simulate_failure` marks a
service down, and `resolve_incident` restores every down service. Humans get the same power in the
node context menu, through the same mutation. A down card shows a solid danger border, a danger icon
chip, and a "down" pill.

The impact is derived, never stored. Every client walks the dependents of each down service and
tints them amber. The old `find_blast_radius` text claimed a highlight "for everyone", and that was
only true locally — the session store is not shared. The status flag is in the Yjs document, so the
outage and its blast radius are now truly shared state.

`resolve_incident` registers only while a service is down. The option list itself tells the agent
whether an incident exists — the state-scoped surface from decision 007, applied to a story the
video can tell. Impact highlight moved from danger to amber, so cause (down, danger) and effect
(impacted, amber) read differently.

**Rejected:** storing the affected set in the document (derivable state drifts, and dependents
change when edges change mid-incident); an incident banner UI (the board already shows it, and the
hackathon clock is real).

---

## Open risks

- **The ChatGPT in-app browser is untested.** Chrome is verified by `pnpm test:webmcp`. The
  challenge names ChatGPT's browser as a judging surface, and nothing here has touched it.
- **The repository is private.** The submission needs a public repository with a license file at the
  root. Keep it private until near the deadline, then flip it.
