import { Box } from "@chakra-ui/react"
import { useRouterState } from "@tanstack/react-router"
import { useLayoutEffect, useRef } from "react"

// Never reaches the end; finishing happens when loading stops.
const GROW_MS = 8000
const FINISH_MS = 500

// Uses the Web Animations API so it runs off the main thread, which board
// renders block.
export const NavigationProgress = () => {
    const isLoading = useRouterState({ select: (state) => state.isLoading })

    const barRef = useRef<HTMLDivElement>(null)
    const growRef = useRef<{ animation: Animation; startedAt: number }>(null)

    // Layout effect so the bar starts before paint.
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

        const grow = growRef.current

        if (!grow) return

        growRef.current = null
        // Animation time lags after a long render; catch it up before reading.
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
