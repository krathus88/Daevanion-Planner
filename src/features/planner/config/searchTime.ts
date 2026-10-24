export const SEARCH_TIME_OPTIONS = [10, 30, 60, 120, 300, 600]
export const DEFAULT_SEARCH_SECONDS = 30
export const DEFAULT_ALL_BOARDS_SEARCH_SECONDS = 60

// 45 -> "45s", 60 -> "1m", 125 -> "2m 5s"
export const formatSearchTime = (totalSeconds: number) => {
    const seconds = Math.floor(totalSeconds)
    if (seconds < 60) {
        return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const rest = seconds % 60
    return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`
}
