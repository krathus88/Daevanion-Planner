import { useCallback, useLayoutEffect, useRef } from "react"

// A function that never changes but always runs the latest `callback`, so a
// handler that closes over state doesn't re-render every memo'd row. Only
// call it from events, not while rendering.
export const useLatestCallback = <Args extends unknown[]>(
    callback: (...args: Args) => void,
) => {
    const latest = useRef(callback)

    useLayoutEffect(() => {
        latest.current = callback
    })

    return useCallback((...args: Args) => {
        latest.current(...args)
    }, [])
}
