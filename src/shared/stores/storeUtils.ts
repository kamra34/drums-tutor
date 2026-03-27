/**
 * User-scoped store utilities.
 *
 * Problem: Zustand persist stores read from localStorage once on init.
 * Changing localStorage externally does NOT update the in-memory state.
 *
 * Solution: After modifying localStorage, we force each store to re-read
 * by calling store.persist.rehydrate() — which re-loads from the (now updated)
 * localStorage key.
 */

// Store references — set by each store on init to avoid circular imports.
// Each store calls registerStore() when it's created.
const _stores: Map<string, { persist: { rehydrate: () => void } }> = new Map()

export function registerStore(key: string, store: { persist: { rehydrate: () => void } }) {
  _stores.set(key, store)
}

// Keys that contain user-specific data
const USER_STORE_KEYS = [
  'drum-tutor-user',    // progress, exercise results, skill profile
  'drum-tutor-ai',      // Anthropic API key, chat messages
]

let _currentUserId: string | null = null

export function getCurrentUserId(): string | null {
  return _currentUserId
}

/**
 * Called on login/register — loads this user's data into the active stores.
 */
export function initUserStores(userId: string): void {
  _currentUserId = userId
  localStorage.setItem('drum-tutor-current-user', userId)

  for (const baseKey of USER_STORE_KEYS) {
    const userKey = `${baseKey}:${userId}`
    const saved = localStorage.getItem(userKey)
    if (saved) {
      localStorage.setItem(baseKey, saved)
    } else {
      localStorage.removeItem(baseKey)
    }
  }

  // Force Zustand stores to re-read from the updated localStorage
  rehydrateStores()
}

/**
 * Called on logout — saves current data to user's namespace, clears active keys,
 * and resets in-memory store state.
 */
export function clearUserStores(): void {
  const userId = _currentUserId || localStorage.getItem('drum-tutor-current-user')

  // Save current in-memory data to user-namespaced keys before clearing
  if (userId) {
    for (const baseKey of USER_STORE_KEYS) {
      const current = localStorage.getItem(baseKey)
      if (current) {
        localStorage.setItem(`${baseKey}:${userId}`, current)
      }
    }
  }

  // Clear active (non-namespaced) keys
  for (const baseKey of USER_STORE_KEYS) {
    localStorage.removeItem(baseKey)
  }

  localStorage.removeItem('drum-tutor-current-user')
  _currentUserId = null

  // Force Zustand stores to re-read (they'll get defaults since keys are gone)
  rehydrateStores()
}

/**
 * Force all persisted Zustand stores to re-read their state from localStorage.
 * This is the critical step — without it, stores keep stale in-memory data.
 */
function rehydrateStores(): void {
  for (const store of _stores.values()) {
    try { store.persist.rehydrate() } catch { /* ok */ }
  }
}

/**
 * Persist current stores to user namespace (called periodically).
 */
export function saveUserStores(): void {
  const userId = _currentUserId
  if (!userId) return

  for (const baseKey of USER_STORE_KEYS) {
    const current = localStorage.getItem(baseKey)
    if (current) {
      localStorage.setItem(`${baseKey}:${userId}`, current)
    }
  }
}

// Auto-save on page close + periodically
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', saveUserStores)
  setInterval(saveUserStores, 30000)
}
