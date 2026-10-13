import { useEffect, useRef, useState } from "react"

const FRAME_PADDING = 32
const MIN_SCALE = 0.55

// Scales content of a fixed size down to fit its frame, never below
// MIN_SCALE. At the minimum the frame scrolls instead.
export const useFitScale = (contentWidth: number, contentHeight: number) => {
    const [scale, setScale] = useState(1)
    const frameRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const frame = frameRef.current
        if (!frame) {
            return
        }

        const updateScale = () => {
            const availableWidth = frame.clientWidth - FRAME_PADDING
            const availableHeight = frame.clientHeight - FRAME_PADDING
            if (availableWidth <= 0 || availableHeight <= 0) {
                return
            }

            const nextScale = Math.max(
                MIN_SCALE,
                Math.min(
                    1,
                    availableWidth / contentWidth,
                    availableHeight / contentHeight,
                ),
            )
            setScale((current) =>
                Math.abs(current - nextScale) < 0.01 ? current : nextScale,
            )
        }

        const observer = new ResizeObserver(updateScale)
        observer.observe(frame)
        updateScale()

        return () => observer.disconnect()
    }, [contentHeight, contentWidth])

    return {
        frameRef: frameRef,
        scale: scale,
        isScrollable: scale <= MIN_SCALE,
    }
}
