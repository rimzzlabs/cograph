---
name: rts
description: >-
  TypeScript/JavaScript conventions. Apply automatically whenever
  writing or editing JavaScript, TypeScript, JSX, or TSX code (.js/.jsx/.ts/.tsx)
  — functions, types, error handling, comments, file size, exports, naming,
  React composition, accessibility (WAI-ARIA), and library conventions for
  TanStack Query and Zustand. Use for any new code or refactor in these
  languages.
---

# rts — TypeScript/JavaScript conventions

Apply these rules to all JavaScript, TypeScript, JSX, and TSX code. They keep
code declarative, low in cognitive load, and easy to maintain. Follow them for
new code and when you refactor existing code.

## 1. Use the `function` keyword; keep arrow functions inline

Declare every top-level (module-scope) function with the `function` keyword.
This includes React components and hooks. Use arrow functions only inline —
inside a block, a callback, or a returned expression.

```ts
// ✓ top-level declaration
export function getUser(id: string) {
  return db.users.find((user) => user.id === id)
}

// ✗ top-level arrow
export const getUser = (id: string) => { /* ... */ }

// ✓ inline arrow in a callback
const ids = users.map((user) => user.id)
```

```tsx
// ✓ components and hooks use the function keyword too
export function UserCard(props: UserCardProps) {
  return <div>{props.name}</div>
}

function useUser(id: string) {
  // ...
}

// ✗ top-level arrow component
export const UserCard = (props: UserCardProps) => <div>{props.name}</div>
```

## 2. At most 2 parameters; use an object beyond that

A function takes 2 parameters at most. When you have more than 2 logical
arguments, collapse **all** of them into a single object — do not keep one
positional argument and push the rest into an options object.

```ts
// ✓ one object holds everything
function createUser(params: CreateUserParams) { /* ... */ }

// ✗ three positional params
function createUser(name: string, age: number, email: string) { /* ... */ }

// ✗ dodging the cap by splitting into primary + rest
function createUser(name: string, rest: { age: number; email: string }) { /* ... */ }
```

A true 2-argument function is fine (for example `slice(list, count)`); the rule
only forces a single object once the count would exceed 2.

## 3. Minimize side effects

Keep functions pure. Allow side effects only when the task is inherently an
effect — for example, opening a connection to an external service (WebSocket,
database, message queue). Isolate those effects; do not mix them into pure
logic. (Updating React state from an event handler is not the kind of side
effect this rule restricts — see rule 16 for effects.)

## 4. Prefer declarative code; use imperative only for performance

Prefer declarative constructs (`map`, `filter`, `reduce`, composition). Use
imperative loops only for performance — for example, iterating over very large
data, where a plain loop is measurably faster. Say why in a comment when you do.

```ts
// ✓ declarative
const names = users.map((user) => user.name)

// ✓ imperative — justified by scale
// hot path: avoids allocating an intermediate array over ~1e6 rows
for (let i = 0; i < rows.length; i += 1) {
  total += rows[i].amount
}
```

## 5. No bare `.filter(Boolean)` or `.sort()` — write the callback

Always pass an explicit predicate or comparator. It states intent and avoids
surprises (coercion, default string sort). Do not sort in place — use the
non-mutating `toSorted` so the source array is untouched.

```ts
// ✗
const clean = list.filter(Boolean)
const ordered = nums.sort()            // bare + mutates the source
const ordered2 = nums.sort((a, b) => a - b) // still mutates the source

// ✓
const clean = list.filter((item) => item !== null)
const ordered = nums.toSorted((a, b) => a - b)
```

Escape hatch (rule 4): for a very large array in a hot path, an in-place
`sort((a, b) => ...)` avoids the copy `toSorted` makes — use it there, with an
explicit comparator, on an array you own.

## 6. Comment only complex or expensive work

Let simple code describe itself. Add a comment only when a function, class, or
expression does expensive or complex work — explain the "why", not the "what".

```ts
// ✓ no comment needed
function fullName(user: User) {
  return `${user.firstName} ${user.lastName}`
}

// ✓ comment earns its place
// Debounced to one call per frame; resize fires ~60x/second on drag.
function onResize() { /* ... */ }
```

## 7. Errors: value in the frontend, thrown in the backend

- **Frontend files:** do not throw. Return the error as a value, so the UI can
  render it. The failure must reach the interface, not crash it.
- **Backend files:** throw errors. At a protocol boundary (REST and similar),
  map the thrown error to a known error with the correct status code, and return
  that.
- **Library boundaries that expect a throw:** some libraries use a thrown error
  as their error channel. TanStack Query (`queryFn`, `mutationFn`) and React
  error boundaries are the common cases — they turn a throw into error state for
  the UI. There you must throw; a returned `Result` breaks `isError` / `error`.
  Keep your own pure functions returning `Result`, and throw only at that
  boundary.

Return errors with a `Result` union:

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

```ts
// ✓ frontend — error as value
async function loadUser(id: string): Promise<Result<User>> {
  const res = await api.get(`/users/${id}`)
  if (!res.ok) return { ok: false, error: new Error("User not found") }
  return { ok: true, value: await res.json() }
}

// ✓ consume it — the failure reaches the UI, never crashes it
const result = await loadUser(id)
if (!result.ok) return renderError(result.error)
renderUser(result.value)

// ✓ backend — throw, then map at the boundary
function getUser(id: string) {
  const user = db.users.find((row) => row.id === id)
  if (!user) throw new NotFoundError("user", id)
  return user
}

// ✓ TanStack Query — the boundary expects a throw
//   (key comes from a factory; signal flows from ctx — see LIBRARIES.md)
function userQuery(id: string) {
  return {
    queryKey: userKeys.detail(id),
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const res = await api.get(`/users/${id}`, { signal })
      if (!res.ok) throw new Error("User not found") // becomes query.error
      return res.json() as Promise<User>
    },
  }
}
```

## 8. Cap files at 600–800 lines

Keep a file under ~600–800 lines. When a file is about to cross that, move a
function or expression into another file. Smaller files are easier to read,
review, and maintain.

## 9. Prefer `interface` over `type`

Declare object shapes with `interface`. Use `type` only when required — for
example, discriminated unions, primitive aliases, or mapped/conditional types.

```ts
// ✓
interface User {
  id: string
  name: string
}

// ✓ type is required here
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number }
```

## 10. Do not destructure object parameters inline

Destructure inside the function body, not in the parameter list. If the object
has more than 5 keys, do not destructure at all — access via the parameter.

```ts
// ✗ inline destructure
function createUser({ name, age }: CreateUserParams) { /* ... */ }

// ✓ destructure in the body
function createUser(params: CreateUserParams) {
  const { name, age } = params
  // ...
}

// ✓ more than 5 keys — no destructure
function render(props: WidgetProps) {
  return <div title={props.title}>{props.label}</div>
}
```

## 11. Keep cognitive load low

Write code a reader can hold in their head. Short functions, clear names, few
branches. This reinforces rule 8 — long files and long functions raise
cognitive load. Split before that happens.

## 12. Prefer named exports over default exports

Export with named exports. This applies to utility functions and JSX
components — named exports keep import names consistent and make refactors and
find-references reliable. Use a default export only where a framework requires
it, such as a Next.js `page.tsx`, `layout.tsx`, or route file.

```ts
// ✓ named
export function formatDate(date: Date) { /* ... */ }
export function UserCard(props: UserCardProps) { /* ... */ }

// ✗ default for a util or component
export default function formatDate(date: Date) { /* ... */ }

// ✓ framework requires default — Next.js page
export default function Page() { /* ... */ }
```

## 13. Name files in kebab-case; group components by what they render

Name directories and files in kebab-case. For JSX components, put the files in a
directory named for the feature, and name each file for the part it renders.
Grouping by render target keeps a feature's pieces together and readable.

```
user-table/
  user-table.tsx               # the top-level table
  user-table-list.tsx          # the list / body
  user-table-list-row.tsx      # a single row
  user-table-list-toolbar.tsx  # search, filter, and other controls
  user-table-pagination.tsx    # pager controls
```

## 14. Prefer composition over configuration in JSX

Build UI by composing small components. Do not grow one component with many props
or boolean flags to change what it renders. Composition keeps each piece simple
and reusable; a wall of configuration props does the opposite.

Export each part as its own named component, the way shadcn/ui does. Do not
attach subcomponents as properties — no `Card.Header` dot notation. Callers
import and compose the raw components by name (see rule 12).

```tsx
// ✗ configuration — flags crammed into one prop list
<Card title="User" bordered hasFooter footerText="Save" onFooterClick={save} />

// ✓ composition — flat, separately exported components (shadcn style)
<Card>
  <CardHeader>User</CardHeader>
  <CardBody>{/* ... */}</CardBody>
  <CardFooter>
    <Button onClick={save}>Save</Button>
  </CardFooter>
</Card>
```

When an interactive component needs to share local state across its parts, ask
the user how to share it: React Context, or a state library such as Zustand. Pick
Context for small, self-contained widget state; reach for Zustand when the state
is larger, shared more widely, or needs middleware (see the Zustand section in
[LIBRARIES.md](./LIBRARIES.md)).

## 15. Meet WAI-ARIA for interactive UI

Every interactive UI must comply with WAI-ARIA. Reach for the correct native
element first (`button`, `a`, `label`, `input`) — it brings roles, focus, and
keyboard behavior for free. Add ARIA only to fill real gaps: an accessible name
(`aria-label` / `aria-labelledby`), state (`aria-expanded`, `aria-selected`,
`aria-disabled`), and keyboard handling for custom widgets.

```tsx
// ✗ a div pretending to be a button — no role, no keyboard, no name
<div className="btn" onClick={close}>×</div>

// ✓ native element with an accessible name
<button type="button" aria-label="Close dialog" onClick={close}>×</button>
```

## 16. Do not reach for `useEffect` by default

Most effects are avoidable, and avoidable effects cause bugs (extra renders,
stale state, race conditions). Before you write `useEffect`, apply the guidance
in React's "You Might Not Need an Effect":

- **Deriving data from props or state?** Compute it during render — no state, no
  effect.
- **Responding to a user action?** Do the work in the event handler.
- **Resetting state when a prop changes?** Use a `key`, not an effect.
- **Caching an expensive result?** Use `useMemo`.

Use `useEffect` only to synchronize with an external system — a subscription, a
non-React widget, an analytics ping — where nothing else fits.

```tsx
// ✗ effect to derive state from other state
const [fullName, setFullName] = useState("")
useEffect(() => {
  setFullName(`${first} ${last}`)
}, [first, last])

// ✓ derive during render
const fullName = `${first} ${last}`
```

Reference: https://react.dev/learn/you-might-not-need-an-effect

## 17. Avoid barrel files

Do not create `index.ts` files whose only job is to re-export other modules.
Barrel files invite circular-dependency traps, defeat tree-shaking (the bundler
pulls the whole barrel to reach one symbol), and slow builds and editor tooling.
Import from the module that actually defines the symbol.

Escape hatch: a published package's single public entry point (its `exports` /
`main`) is a legitimate barrel — a deliberate boundary, not an internal hub.

```ts
// ✗ src/components/index.ts — a re-export hub
export * from "./user-card"
export * from "./user-table"

// ✗ importing through the barrel
import { UserCard } from "@/components"

// ✓ import from the defining module
import { UserCard } from "@/components/user-card"
```

## 18. Do not over-extract

Prefer one linear, readable function over a scatter of tiny single-use helpers.
Fragmenting a single flow into micro-functions spreads it across the file and
raises cognitive load (rule 11) — the opposite of what the split promised.

Extract a function when the piece is **reused**, is **worth testing on its own**,
or has a name that genuinely clarifies intent. Do not extract only to shrink a
line count. This balances rule 8: split a *file* when it grows, but do not
shatter a *function* to get there.

```ts
// ✗ over-extracted — one flow smeared across single-use helpers
function getTax(order: Order) { return order.total * 0.1 }
function getShipping(order: Order) { return order.total > 100 ? 0 : 5 }
function getGrandTotal(order: Order) {
  return order.total + getTax(order) + getShipping(order)
}

// ✓ linear and readable; extract a piece later if it gets reused
function getGrandTotal(order: Order) {
  const tax = order.total * 0.1
  const shipping = order.total > 100 ? 0 : 5
  return order.total + tax + shipping
}
```

## 19. Duplicate until the abstraction is obvious

Do not abstract on the first sight of similarity. Code that merely *looks* alike
today — but changes for different reasons — turns a shared helper into a coupling
trap that grows flags and special cases. Wait for the third occurrence, or for a
real shared reason to change, before you extract. Duplication is cheaper than the
wrong abstraction.

Escape hatch: obvious, stable, single-reason logic (a currency formatter, a date
parser) can be shared straight away — the rule targets *speculative* abstraction,
not clearly-shared utilities.

```ts
// invoice rounding follows tax law; cart rounding follows display preference.
// ✗ merging them now couples tax rules to UI rules
function roundMoney(value: number) { return Math.round(value * 100) / 100 }

// ✓ let the two live apart until a genuine third, shared case appears
```

## Library conventions

Some libraries have their own conventions. When a project uses one of these,
follow [LIBRARIES.md](./LIBRARIES.md):

- **TanStack Query** — query-key management, key/`signal` flow through `queryFn`.
- **Zustand** — `immer` and `persist` middleware, optional auto-selectors.
- **React Hook Form** — bind fields through the UI library's field component, not
  `register()`.
- **Dates** — ask before adding a date library; prefer `date-fns` for
  timezone-aware work.
