// Whether the Optimizer priorities section is open, kept separately for the
// Plan tab ("board") and the All boards tab ("all").
export type PrioritiesScope = "board" | "all"

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
