// Whether the Optimizer priorities section is open, kept separately for the
// Plan tab ("board"), the All boards tab ("all") and its Ariel section
// ("ariel").
export type PrioritiesScope = "board" | "all" | "ariel"

const keyFor = (scope: PrioritiesScope) => `daevanion:priorities-open:${scope}`

export const readPrioritiesOpen = (scope: PrioritiesScope) => {
    try {
        return window.localStorage.getItem(keyFor(scope)) === "true"
    } catch {
        // Storage is blocked; start closed.
        return false
    }
}

export const writePrioritiesOpen = (scope: PrioritiesScope, open: boolean) => {
    try {
        window.localStorage.setItem(keyFor(scope), String(open))
    } catch {
        // Only lasts until the page reloads.
    }
}
