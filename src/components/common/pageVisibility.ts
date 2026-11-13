// Whether the page can be seen: its tab is the open one in a window that
// isn't minimized (a window on another monitor counts). Another tab, or a
// minimized window, hides it. Without a document (node tests) it's visible.
export const isPageVisible = () => {
    return (
        typeof document === "undefined" ||
        document.visibilityState === "visible"
    )
}

// Calls `onChange` each time the page is shown or hidden.
export const subscribeToPageVisibility = (onChange: () => void) => {
    if (typeof document === "undefined") {
        return () => {}
    }

    document.addEventListener("visibilitychange", onChange)

    return () => {
        document.removeEventListener("visibilitychange", onChange)
    }
}

// Runs `task` now, then every `intervalMs`. The countdown keeps going while
// the page is hidden, but a run that falls due then waits until the page
// is shown again, and runs at once.
export const pollWhileVisible = (task: () => void, intervalMs: number) => {
    let dueAt = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = () => {
        clearTimeout(timer)

        if (!isPageVisible()) {
            return
        }

        const wait = dueAt - Date.now()

        if (wait > 0) {
            timer = setTimeout(tick, wait)

            return
        }

        dueAt = Date.now() + intervalMs
        timer = setTimeout(tick, intervalMs)
        task()
    }

    // Hidden, the countdown's timer may run late (browsers slow them down),
    // so being shown again checks the time itself.
    const stopWatching = subscribeToPageVisibility(tick)

    tick()

    return () => {
        clearTimeout(timer)
        stopWatching()
    }
}
