import type { StateStorage } from "zustand/middleware"

/**
 * localStorage throws in some privacy modes rather than returning null, so the
 * probe below is a write, not a feature check. When it fails the identity lives
 * in memory instead, which correctly makes each tab its own person.
 */
export function createIdentityStorage(): StateStorage {
  const probe = "cograph:probe"

  try {
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    const memory = new Map<string, string>()
    return {
      getItem: (name) => memory.get(name) ?? null,
      setItem: (name, value) => {
        memory.set(name, value)
      },
      removeItem: (name) => {
        memory.delete(name)
      },
    }
  }
}
