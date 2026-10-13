import { Box } from "@chakra-ui/react"
import { useRouterState } from "@tanstack/react-router"
import { useLayoutEffect, useRef } from "react"

// Never reaches the end on its own; the real finish happens when loading stops.
const GROW_MS = 8000
// Fills the rest of the bar, then fades out.
const FINISH_MS = 500

// A thin bar across the top of the page while a route loads. Rendering a
// board blocks the main thread, so the bar animates `transform` and `opacity`
// with the Web Animations API, which the browser runs off the main thread.
export const NavigationProgress = () => {
    const isLoading = useRouterState({ select: (state) => state.isLoading })

    const barRef = useRef<HTMLDivElement>(null)
    const growRef = useRef<{ animation: Animation; startedAt: number }>(null)

    // A layout effect, so the bar starts before the browser paints.
    useLayoutEffect(() => {
        const bar = barRef.current

        if (!bar) return

        if (isLoading) {
            bar.getAnimations().forEach((animation) => animation.cancel())
            growRef.current = {
                animation: bar.animate(
                    [
                        { opacity: 1, transform: "scaleX(0)" },
                        { opacity: 1, transform: "scaleX(0.9)" },
                    ],
                    {
                        duration: GROW_MS,
                        easing: "cubic-bezier(0.1, 0.7, 0.2, 1)",
                        fill: "forwards",
                    },
                ),
                startedAt: performance.now(),
            }

            return
        }

        // Nothing to finish when no load was shown, e.g. on first render.
        const grow = growRef.current

        if (!grow) return

        growRef.current = null
        // Animation time only moves between frames, so after a long render it
        // lags behind what the screen shows. Catch it up before reading it.
        grow.animation.currentTime = performance.now() - grow.startedAt

        const { transform } = getComputedStyle(bar)

        grow.animation.cancel()
        bar.animate(
            [
                { opacity: 1, transform: transform },
                { offset: 0.4, opacity: 1, transform: "scaleX(1)" },
                { opacity: 0, transform: "scaleX(1)" },
            ],
            { duration: FINISH_MS, easing: "ease-out", fill: "forwards" },
        )
    }, [isLoading])

    return (
        <Box
            ref={barRef}
            pos="fixed"
            top="0"
            left="0"
            zIndex="banner"
            w="full"
            h="0.5"
            bg="app.accent"
            opacity="hidden"
            transformOrigin="left"
            pointerEvents="none"
            aria-hidden
        />
    )
}
