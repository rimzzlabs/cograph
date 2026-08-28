# rts — library conventions

Conventions for specific libraries. Apply a section only when the project uses
that library. These extend the core rules in [SKILL.md](./SKILL.md); the core
rules still hold (function style, `Result` errors, and so on).

## TanStack Query

### Manage query keys centrally

Do not scatter raw array keys (`["user", id]`) across the codebase. Keys drift,
and cache reads stop matching cache writes.

When you first add TanStack Query to a project, **ask the user** how they want
to manage keys, and offer two paths:

1. Install a key-management library (for example `@lukemorales/query-key-factory`).
2. Write a small typed key factory in the repo.

Then use the chosen factory everywhere.

```ts
// hand-written factory (or the equivalent from a library)
const userKeys = {
  all: ["users"] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
}
```

### Let the key and signal flow through `queryFn`

Do not close over a hoisted key variable inside `queryFn`. Read the key from the
context argument that TanStack Query passes in, so the value that drives the
cache is the same value the fetch uses — predictable, with no second source of
truth.

Always forward `ctx.signal` to the network request, so TanStack Query can cancel
in-flight requests (unmount, refetch, key change).

```ts
function userQuery(id: string) {
  return {
    queryKey: userKeys.detail(id),
    queryFn: async (ctx) => {
      // key flows from context, not from a hoisted variable
      const [, , userId] = ctx.queryKey
      const res = await fetch(`/users/${userId}`, { signal: ctx.signal })
      // queryFn is a throw boundary — see SKILL.md rule 7
      if (!res.ok) throw new Error("User not found")
      return res.json() as Promise<User>
    },
  }
}
```

## Zustand

### Always use the `immer` middleware

Write updates as draft mutations through `immer`. It keeps reducers readable and
avoids hand-written spread trees. Prerequisite: `immer` must be installed.

### Use the `persist` middleware for persistence

When state must survive reloads, use the built-in `persist` middleware. Do not
reimplement persistence by hand.

```ts
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"

interface BearState {
  bears: number
  addBear: () => void
}

const useBearStore = create<BearState>()(
  persist(
    immer((set) => ({
      bears: 0,
      addBear: () =>
        set((state) => {
          state.bears += 1 // immer draft mutation
        }),
    })),
    { name: "bear-store" },
  ),
)
```

### Auto-selectors — ask first

When you set up Zustand in a project for the first time, **ask the user** whether
they want auto-generated selectors. If yes, generate a `.use` accessor so the
store reads as `useBearStore.use.useSortedBears()`.

Keep the `use` prefix on every selector name — React 19 requires hook-style
names, and each selector is a hook. So a `bears` value is read with
`useBearStore.use.useBears()`, and a derived `sortedBears` with
`useBearStore.use.useSortedBears()`.

```ts
// createSelectors, adapted to keep the `use` prefix on each selector
function createSelectors<S extends { getState: () => object }>(store: S) {
  const withUse = store as S & { use: Record<string, unknown> }
  withUse.use = {}
  for (const key of Object.keys(store.getState())) {
    const name = `use${key[0].toUpperCase()}${key.slice(1)}`
    withUse.use[name] = () => store((state: Record<string, unknown>) => state[key])
  }
  return withUse
}
```

See the Zustand "Auto Generating Selectors" guide for the base pattern this
adapts: https://zustand.docs.pmnd.rs/guides/auto-generating-selectors

## React Hook Form

Use the React Hook Form API — do not manage form state by hand.

When the form uses a UI library (shadcn/ui, Base UI, or similar), bind each field
through that library's field component together with RHF's `control`. Do not
spread `...register()` onto the library's styled inputs. The field component
wires value, `onChange`, error state, and accessibility for you; `register()`
bypasses that and drifts from the library's contract.

Component names differ per library (`<Field />`, `<FormField />`) — check the
library's form documentation for the exact API.

```tsx
// ✗ spreading register onto a UI-library input
<Input {...register("email")} />

// ✓ bind through the library's field component + RHF control
<Field
  control={form.control}
  name="email"
  render={({ field }) => <Input {...field} />}
/>
```

See the shadcn/ui form docs for a concrete integration:
https://ui.shadcn.com/docs/components/form

## Dates

When a project needs date handling for the first time, **ask the user** whether
to add a date library (`date-fns`) or stay with the built-in `Date`.

If the application must be timezone-aware, recommend `date-fns` (with
`date-fns-tz` for zones) rather than hand-rolled `Date` math — manual timezone
handling is a common source of off-by-one and DST bugs. Keep parsing and
formatting in one place, not scattered across components.
