import { useTimers } from "@timers/hooks/useTimers"
import { ComingNextStrip } from "./ComingNextStrip"

export const ComingNext = () => {
    const {
        now,
        comingNext,
        settings,
        changeShowComingNext,
        changeComingNextCount,
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
            count={settings.comingNextCount}
            open={settings.showComingNext}
            onToggle={handleToggle}
            onMove={changeComingNextPosition}
            onCountChange={changeComingNextCount}
        />
    )
}
