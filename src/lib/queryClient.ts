import { QueryClient } from "@tanstack/react-query"
import { api } from "./api"

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: async ({ queryKey, signal }) => {
                const { data } = await api.get(queryKey[0] as string, {
                    signal,
                })
                return data
            },
        },
    },
})
