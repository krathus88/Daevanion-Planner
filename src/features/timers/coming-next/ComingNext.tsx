import { useTimers } from "@timers/hooks/useTimers"
import { ComingNextStrip } from "./ComingNextStrip"

export const ComingNext = () => {
    const {
        now,
        comingNext,
        settings,
        changeShowComingNext,
        changeComingNextPosition,
    } = useTimers()

    const handleToggle = () => {
        changeShowComingNext(!settings.showComingNext)
    }

    if (comingNext.length === 0) {
        return null
    }

    return (
        <ComingNextStrip
            entries={comingNext}
            now={now}
            position={settings.comingNextPosition}
            open={settings.showComingNext}
            onToggle={handleToggle}
            onMove={changeComingNextPosition}
        />
    )
}
