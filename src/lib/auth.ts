const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

const getAuthUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, "")}${path}`

export async function hasActiveSession(signal?: AbortSignal): Promise<boolean> {
    const response = await fetch(getAuthUrl("/auth/session"), {
        credentials: "include",
        signal,
    })

    if (response.status === 401) return false
    if (!response.ok) throw new Error("Unable to check your session")

    return true
}

export function getDiscordOAuthUrl(): string {
    return getAuthUrl("/auth/discord")
}
