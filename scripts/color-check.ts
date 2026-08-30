import {
  hueFromText,
  MINIMUM_HUE_DISTANCE,
  resolveParticipantHues,
} from "../src/lib/identity/participant-color.ts"

function distance(first: number, second: number) {
  const direct = Math.abs(first - second)
  return Math.min(direct, 360 - direct)
}

function check(label: string, passed: boolean, detail = "") {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`)
  if (!passed) process.exitCode = 1
}

function peer(id: string, name: string) {
  return { id, name }
}

// 1. The local hue is always the hue of the local name.
const me = peer("id-me", "Rizki Citra")
const solo = resolveParticipantHues({ me, peers: [] }).hues
check("local hue comes from the local name", solo.get("id-me") === hueFromText("Rizki Citra"))

// 2. Two peers with the same name get different hues, and the local user keeps its own.
const twins = resolveParticipantHues({
  me,
  peers: [peer("id-a", "Dimas"), peer("id-b", "Dimas")],
}).hues
check(
  "same name, different hues",
  twins.get("id-a") !== twins.get("id-b"),
  `${twins.get("id-a")} vs ${twins.get("id-b")}`,
)
check("local hue unmoved by a peer collision", twins.get("id-me") === hueFromText("Rizki Citra"))

// 3. Minimum distance holds for every pair, up to 12 participants.
const names = [
  "Ana",
  "Budi",
  "Citra",
  "Dewi",
  "Eko",
  "Fajar",
  "Gita",
  "Hana",
  "Iwan",
  "Joko",
  "Kirana",
]
const many = names.map((name, index) => peer(`id-${index}`, name))
const spread = resolveParticipantHues({ me, peers: many }).hues
const values = [...spread.values()]
let worst = 360
for (let i = 0; i < values.length; i += 1) {
  for (let j = i + 1; j < values.length; j += 1) {
    worst = Math.min(worst, distance(values[i] as number, values[j] as number))
  }
}
check(
  `12 participants keep ${MINIMUM_HUE_DISTANCE} degrees apart`,
  worst >= MINIMUM_HUE_DISTANCE,
  `closest pair = ${worst}deg`,
)

// 4. Determinism: the same input gives the same output.
const first = resolveParticipantHues({ me, peers: many }).hues
const second = resolveParticipantHues({ me, peers: [...many].reverse() }).hues
check(
  "peer order does not change the assignment",
  [...first].every(([id, hue]) => second.get(id) === hue),
)

// 5. An agent is spaced from people by the same rule.
const withAgent = resolveParticipantHues({
  me,
  peers: [peer("id-h", "Budi"), peer("id-agent", "Scout")],
}).hues
check(
  "an agent is spaced from a person",
  distance(withAgent.get("id-h") as number, withAgent.get("id-agent") as number) >=
    MINIMUM_HUE_DISTANCE,
)

// 6. Feeding the slots back in reproduces the assignment. The hook adjusts
// state during render on this guarantee; without it, rendering would loop.
const round1 = resolveParticipantHues({ me, peers: many })
const round2 = resolveParticipantHues({ me, peers: many, cache: round1.slots })
check(
  "resolving with its own slots is a fixed point",
  [...round1.hues].every(([id, hue]) => round2.hues.get(id) === hue) &&
    [...round1.slots].every(([id, slot]) => round2.slots.get(id) === slot),
)

// 7. The cache's purpose: a peer keeps its hue when an unrelated peer leaves.
const stayed = many.filter((participant) => participant.id !== "id-0")
const afterLeave = resolveParticipantHues({ me, peers: stayed, cache: round1.slots })
check(
  "a peer keeps its hue when another leaves",
  stayed.every(
    (participant) => afterLeave.hues.get(participant.id) === round1.hues.get(participant.id),
  ),
)

// 8. Above 12 participants the circle is full but nothing breaks.
const crowd = Array.from({ length: 20 }, (_, index) => peer(`id-c${index}`, `Person ${index}`))
const crowded = resolveParticipantHues({ me, peers: crowd }).hues
check("21 participants still all get a hue", crowded.size === 21)
check(
  "every hue is inside the circle",
  [...crowded.values()].every((hue) => hue >= 0 && hue < 360),
)
