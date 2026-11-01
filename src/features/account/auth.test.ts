// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"

const supabase = vi.hoisted(() => {
    return {
        authCallback: null as
            ((event: string, session: unknown) => void) | null,
        rpcResult: { data: false, error: null } as {
            data: unknown
            error: unknown
        },
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
    }
})

vi.mock("./supabaseClient", () => {
    return {
        supabase: {
            auth: {
                onAuthStateChange: (
                    callback: (event: string, session: unknown) => void,
                ) => {
                    supabase.authCallback = callback
                },
                signInWithOAuth: supabase.signInWithOAuth,
                signOut: supabase.signOut,
            },
            rpc: async () => {
                return supabase.rpcResult
            },
        },
    }
})

const session = (metadata: object = {}) => {
    return { user: { id: "user-1", user_metadata: metadata } }
}

// A fresh module, as on a page load at the current URL.
const load = async () => {
    vi.resetModules()

    const auth = await import("./auth")
    const listener = vi.fn()

    auth.subscribeToAuth(listener)

    return { ...auth, listener: listener }
}

const emit = async (
    auth: Awaited<ReturnType<typeof load>>,
    value: unknown,
    status: string,
) => {
    supabase.authCallback?.("EVENT", value)
    await vi.waitFor(() => {
        expect(auth.readAuth().status).toBe(status)
    })
}

beforeEach(() => {
    supabase.authCallback = null
    supabase.rpcResult = { data: false, error: null }
    supabase.signInWithOAuth.mockReset()
    supabase.signOut.mockReset()
    window.history.replaceState(null, "", "/timers")
})

describe("auth state", () => {
    it("starts loading until Supabase answers", async () => {
        const auth = await load()

        expect(auth.readAuth()).toEqual({ status: "loading" })
    })

    it("reads no session as signed out", async () => {
        const auth = await load()

        await emit(auth, null, "signedOut")

        expect(auth.readAuth()).toEqual({ status: "signedOut", error: null })
        expect(auth.listener).toHaveBeenCalled()
    })

    it("signs in, then learns about the allowlist", async () => {
        supabase.rpcResult = { data: true, error: null }

        const auth = await load()

        await emit(auth, session(), "signedIn")
        await vi.waitFor(() => {
            expect(auth.readAuth()).toMatchObject({ isReporter: true })
        })
    })

    it("treats an allowlist error as not a reporter", async () => {
        supabase.rpcResult = { data: true, error: { message: "x" } }

        const auth = await load()

        await emit(auth, session(), "signedIn")
        await new Promise((resolve) => {
            setTimeout(resolve, 0)
        })

        expect(auth.readAuth()).toMatchObject({ isReporter: false })
    })

    it.each([
        [{ custom_claims: { global_name: "Global" }, name: "x" }, "Global"],
        [{ full_name: "Full", name: "x" }, "Full"],
        [{ name: "Name" }, "Name"],
        [{}, "Discord user"],
    ])("picks a display name from %j", async (metadata, name) => {
        const auth = await load()

        await emit(auth, session(metadata), "signedIn")

        expect(auth.readAuth()).toMatchObject({ name: name })
    })
})

describe("a refused login", () => {
    it("reads the reason from the URL's hash and cleans the URL", async () => {
        window.history.replaceState(
            null,
            "",
            "/timers?tab=boss#error=denied&error_description=Not+on+the+list",
        )

        const auth = await load()

        await emit(auth, null, "signedOut")

        expect(auth.readAuth()).toEqual({
            status: "signedOut",
            error: "Not on the list",
        })
        expect(window.location.search).toBe("?tab=boss")
        expect(window.location.hash).toBe("")
    })

    it("reads the reason from the query too", async () => {
        window.history.replaceState(
            null,
            "",
            "/timers?error=denied&error_code=x&error_description=Nope&tab=boss",
        )

        const auth = await load()

        await emit(auth, null, "signedOut")

        expect(auth.readAuth()).toMatchObject({ error: "Nope" })
        expect(window.location.search).toBe("?tab=boss")
    })

    it("leaves a normal URL alone", async () => {
        window.history.replaceState(null, "", "/timers?tab=boss#keep")

        await load()

        expect(window.location.search).toBe("?tab=boss")
        expect(window.location.hash).toBe("#keep")
    })

    it("forgets the reason on the next login attempt", async () => {
        window.history.replaceState(
            null,
            "",
            "/timers#error_description=Refused",
        )

        const auth = await load()

        await auth.signIn()
        await emit(auth, null, "signedOut")

        expect(auth.readAuth()).toMatchObject({ error: null })
    })
})

describe("signing in and out", () => {
    it("uses Discord and comes back to this page", async () => {
        const auth = await load()

        await auth.signIn()

        expect(supabase.signInWithOAuth).toHaveBeenCalledWith({
            provider: "discord",
            options: { redirectTo: window.location.href },
        })
    })

    it("signs out through Supabase", async () => {
        const auth = await load()

        await auth.signOut()

        expect(supabase.signOut).toHaveBeenCalled()
    })

    it("stops telling a listener that left", async () => {
        vi.resetModules()

        const auth = await import("./auth")
        const listener = vi.fn()
        const unsubscribe = auth.subscribeToAuth(listener)

        unsubscribe()
        supabase.authCallback?.("EVENT", null)
        await new Promise((resolve) => {
            setTimeout(resolve, 5)
        })

        expect(listener).not.toHaveBeenCalled()
    })
})
