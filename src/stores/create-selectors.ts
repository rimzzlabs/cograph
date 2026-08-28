import type { StoreApi, UseBoundStore } from "zustand"

type SelectorApi<T> = {
  [K in keyof T as `use${Capitalize<string & K>}`]: () => T[K]
}

/**
 * Adds a `.use` accessor so state reads as `useBoardStore.use.useSelection()`.
 * The `use` prefix is kept on every selector because each one is a hook and
 * React 19 enforces hook naming.
 */
export function createSelectors<T extends object, S extends UseBoundStore<StoreApi<T>>>(store: S) {
  const withUse = store as S & { use: SelectorApi<T> }
  const accessors: Record<string, unknown> = {}

  for (const key of Object.keys(store.getState())) {
    const name = `use${key.charAt(0).toUpperCase()}${key.slice(1)}`
    accessors[name] = () => store((state) => state[key as keyof T])
  }

  withUse.use = accessors as SelectorApi<T>
  return withUse
}
