import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { QueryClient, type Query } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import type { ReactNode } from "react"
import { PERSIST_MAX_AGE_MS } from "./queryCache"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is asked for when a page needs it, never on focus or
            // reconnect: network work runs only while the tab is visible.
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            gcTime: PERSIST_MAX_AGE_MS,
        },
    },
})

// localStorage throws in some private windows: then nothing is saved.
const getStorage = () => {
    try {
        return window.localStorage
    } catch {
        return undefined
    }
}

const persister = createSyncStoragePersister({
    storage: getStorage(),
    key: "daevanion:query-cache:v1",
})

// Only answers a query asked to keep, and only once they're in.
const shouldPersist = (query: Query) => {
    return query.meta?.persist === true && query.state.status === "success"
}

// TanStack Query for the app, its opted-in answers saved in the browser so a
// reload or another tab reuses them.
export const QueryProvider = ({ children }: { children: ReactNode }) => {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister: persister,
                maxAge: PERSIST_MAX_AGE_MS,
                dehydrateOptions: { shouldDehydrateQuery: shouldPersist },
            }}
        >
            {children}
        </PersistQueryClientProvider>
    )
}
