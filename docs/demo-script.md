# Demo script: two humans, two agents, one board

Target length: 3 minutes. Record at 1080p or higher. Record the browser windows only, not the
desktop.

## Prepare before recording

1. Deploy the latest build with `pnpm run deploy`.
2. Open Chrome with `chrome://flags/#enable-webmcp-testing` enabled.
3. Open the room in a normal window. Set the display name to your name.
4. Open the same room in an incognito window. Set a different display name.
5. Connect an agent in both windows.
6. Open a fresh room and click **Example** to seed the board.
7. Close the tool inspector's call log if it is long. A clean log reads better.

## Beat 1 — Cold open (0:00 to 0:20)

Show the seeded board in the normal window.

Say: "This is Cograph, a shared architecture graph where your agent has a cursor. This is our
checkout system: a gateway, two services, a datastore, a queue, and Stripe."

## Beat 2 — Two humans (0:20 to 0:40)

Show both windows side by side. Move the mouse in each window. Drag `web-app` in the incognito
window.

Say: "Two people, live cursors, one board. Every edit syncs through a CRDT, so nobody overwrites
anybody."

## Beat 3 — The agent takes a seat (0:40 to 1:20)

In the normal window, ask the agent: **"Describe this board."**

Point at the top bar when the agent's chip appears, and at the cursor that moves to the node it
reads.

Say: "The agent is not a chat box. Its first tool call gives it a seat: a name, a colour from the
same rule people get, and a cursor. Watch the sidebar — that list is every tool the agent can call
right now, mirrored from the browser engine itself."

## Beat 4 — The tool surface follows the UI (1:20 to 2:00)

Click one node. Point at the sidebar as two tools appear. Shift-click a second node. Point as
`connect_selected_services` appears. Click the pane. Point as they vanish.

Say: "The tool list is a function of application state. A tool you cannot use right now does not
exist for the agent. Select one service, the agent can edit it. Select two, it can connect them.
Deselect, and those tools are gone — removed through an AbortSignal, not left to error."

Open the viewer link in the incognito window. Show its shorter tool list.

Say: "A viewer link shrinks the surface the same way. This agent can read the board. It cannot touch
it."

## Beat 5 — Incident (2:00 to 2:40)

In the normal window, ask the agent: **"Simulate a failure of postgres. What breaks?"**

Show both windows. The `postgres` card turns red with a "down" pill. The impacted services turn
amber — in both windows.

Say: "Postgres is down. The blast radius is computed by every client from shared state, so my
teammate sees the same incident. And look at the sidebar: `resolve_incident` exists only while
something is down."

In the incognito window, ask its agent: **"What is the state of this board?"** Show that its
`describe_board` reports the DOWN service.

Back in the normal window, ask: **"Resolve the incident."** Show the board recover in both windows,
and `resolve_incident` vanish from the sidebar.

## Beat 6 — Close (2:40 to 3:00)

Show the tool inspector badges: read, destructive, untrusted.

Say: "Notes are written by other people, so the tool that reads them is marked untrusted — data,
never instructions. Cograph: a shared architecture graph where your agent has a cursor. Try it at
cograph.rimzzlabs.workers.dev."

## Fallbacks

- If the agent narrates too slowly, cut the wait. Judges watch the board, not the chat.
- If a tool call fails on camera, click the pane, re-select, and ask again. The registration follows
  the UI, so a clean state gives a clean call.
- Two tabs in one browser show one person (decision 011). Always use the incognito window for the
  second human.
