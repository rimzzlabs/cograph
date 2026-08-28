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
const solo = resolveParticipantHues({ me, peers: [] })
check("local hue comes from the local name", solo.get("id-me") === hueFromText("Rizki Citra"))

// 2. Two peers with the same name get different hues, and the local user keeps its own.
const twins = resolveParticipantHues({
  me,
  peers: [peer("id-a", "Dimas"), peer("id-b", "Dimas")],
})
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
const spread = resolveParticipantHues({ me, peers: many })
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
const first = resolveParticipantHues({ me, peers: many })
const second = resolveParticipantHues({ me, peers: [...many].reverse() })
check(
  "peer order does not change the assignment",
  [...first].every(([id, hue]) => second.get(id) === hue),
)

// 5. An agent is spaced from people by the same rule.
const withAgent = resolveParticipantHues({
  me,
  peers: [peer("id-h", "Budi"), peer("id-agent", "Scout")],
})
check(
  "an agent is spaced from a person",
  distance(withAgent.get("id-h") as number, withAgent.get("id-agent") as number) >=
    MINIMUM_HUE_DISTANCE,
)

// 6. Above 12 participants the circle is full but nothing breaks.
const crowd = Array.from({ length: 20 }, (_, index) => peer(`id-c${index}`, `Person ${index}`))
const crowded = resolveParticipantHues({ me, peers: crowd })
check("21 participants still all get a hue", crowded.size === 21)
check(
  "every hue is inside the circle",
  [...crowded.values()].every((hue) => hue >= 0 && hue < 360),
)
