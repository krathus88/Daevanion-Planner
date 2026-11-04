// A search stops once this long passes without a better result.
export const STALL_OPTIONS = [30, 60, 120, 300]
export const DEFAULT_STALL_SECONDS = 60
// However long it keeps improving, a search ends here.
export const MAX_SEARCH_MS = 15 * 60_000

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
