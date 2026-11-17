// The longest a query's answer is kept, in the browser too: queries that
// persist (`meta: { persist: true }`) set their staleTime within it.
export const PERSIST_MAX_AGE_MS = 10 * 60 * 1000
