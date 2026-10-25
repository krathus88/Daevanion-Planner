import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabaseClient"

type AuthState =
    | { status: "loading" }
    | {
          status: "signedOut"
          // Why the last Discord login was refused, e.g. not on the list.
          error: string | null
      }
    | {
          status: "signedIn"
          name: string
          // On the reporters allowlist: their reports are shared.
          isReporter: boolean
      }

const ERROR_PARAMS = ["error", "error_code", "error_description"]

// A refused login comes back with the reason in the URL's hash or query.
const takeLoginError = () => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const query = new URLSearchParams(window.location.search)
    const error =
        hash.get("error_description") ?? query.get("error_description")

    if (error === null) {
        return null
    }

    for (const param of ERROR_PARAMS) {
        query.delete(param)
    }

    const search = query.size > 0 ? `?${query}` : ""

    window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${search}`,
    )

    return error
}

let loginError = takeLoginError()
let state: AuthState = { status: "loading" }
let started = false
// Drops allowlist answers for a session that has since changed.
let latestCheck = 0
const listeners = new Set<() => void>()

const setState = (next: AuthState) => {
    state = next

    for (const listener of listeners) {
        listener()
    }
}

const getName = (session: Session) => {
    const metadata = session.user.user_metadata
    const customClaims = metadata.custom_claims

    return (
        customClaims?.global_name ??
        metadata.full_name ??
        metadata.name ??
        "Discord user"
    )
}

const applySession = async (session: Session | null) => {
    const check = ++latestCheck

    if (!session) {
        setState({ status: "signedOut", error: loginError })

        return
    }

    const wasReporter = state.status === "signedIn" && state.isReporter

    setState({
        status: "signedIn",
        name: getName(session),
        isReporter: wasReporter,
    })

    const { data, error } = await supabase.rpc("is_reporter")

    if (check === latestCheck) {
        setState({
            status: "signedIn",
            name: getName(session),
            isReporter: !error && data === true,
        })
    }
}

const start = () => {
    if (started) {
        return
    }

    started = true
    supabase.auth.onAuthStateChange((_event, session) => {
        // Supabase calls made inside this callback deadlock, so run after it.
        setTimeout(() => {
            void applySession(session)
        }, 0)
    })
}

export const readAuth = () => {
    return state
}

export const subscribeToAuth = (onChange: () => void) => {
    start()
    listeners.add(onChange)

    return () => {
        listeners.delete(onChange)
    }
}

export const signIn = async () => {
    loginError = null
    await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo: window.location.href },
    })
}

export const signOut = async () => {
    await supabase.auth.signOut()
}
