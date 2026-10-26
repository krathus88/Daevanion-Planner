type TooltipPart = {
    text: string
    // Changes with skill level, shown as X, X% or Xs in the tooltip text.
    scaling: boolean
}

const SCALING_VALUE = /\bX(?:%|s\b)?(?!\w)/g

// Splits a tooltip into plain text and its per-level X values.
export const splitTooltip = (tooltip: string) => {
    const parts: TooltipPart[] = []
    let start = 0

    for (const match of tooltip.matchAll(SCALING_VALUE)) {
        if (match.index > start) {
            parts.push({
                text: tooltip.slice(start, match.index),
                scaling: false,
            })
        }

        parts.push({ text: match[0], scaling: true })
        start = match.index + match[0].length
    }

    if (start < tooltip.length) {
        parts.push({ text: tooltip.slice(start), scaling: false })
    }

    return parts
}
