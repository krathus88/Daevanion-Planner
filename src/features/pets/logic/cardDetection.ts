// Finds the pet cards in a screenshot of the game's Pets grid. Cards sit on a
// near-black background, so the gaps between them show up as dark columns and
// rows. Kept free of path aliases so scripts/ can run it with plain node.

export type Pixels = {
    data: Uint8ClampedArray | Uint8Array
    width: number
    height: number
    // Bytes per pixel: 4 for canvas ImageData, 3 for raw RGB.
    channels?: number
}

export type CardRect = {
    x: number
    y: number
    width: number
    height: number
}

// Card height / width in the game's grid.
export const CARD_RATIO = 1.36

const DARK = 16
const GAP_SHARE = 0.6
const MIN_CARD_WIDTH = 40

type Run = { start: number; end: number }

const isDark = (pixels: Pixels, x: number, y: number) => {
    const i = (y * pixels.width + x) * (pixels.channels ?? 4)
    const { data } = pixels

    return Math.max(data[i], data[i + 1], data[i + 2]) < DARK
}

// Runs of indexes whose line is not mostly dark.
const findRuns = (length: number, isGap: (index: number) => boolean) => {
    const runs: Run[] = []
    let start = -1

    for (let i = 0; i <= length; i++) {
        const open = i < length && !isGap(i)

        if (open && start < 0) {
            start = i
        } else if (!open && start >= 0) {
            runs.push({ start, end: i })
            start = -1
        }
    }

    return runs
}

const findColumns = (pixels: Pixels) => {
    const { width, height } = pixels
    const step = Math.max(1, Math.floor(height / 400))

    const runs = findRuns(width, (x) => {
        let dark = 0
        let total = 0

        for (let y = 0; y < height; y += step) {
            total++
            if (isDark(pixels, x, y)) dark++
        }

        return dark / total > GAP_SHARE
    }).filter((run) => run.end - run.start >= MIN_CARD_WIDTH)

    // A grid column has a neighbour of the same width close by; this drops the
    // big pet render and the side panels of a full-screen shot.
    return runs.filter((run, index) => {
        const size = run.end - run.start

        return [runs[index - 1], runs[index + 1]].some((other) => {
            if (!other) return false

            const otherSize = other.end - other.start
            const gap =
                other.start > run.start
                    ? other.start - run.end
                    : run.start - other.end

            return (
                Math.abs(otherSize - size) <= size * 0.08 && gap < size * 0.25
            )
        })
    })
}

const findCardsInColumn = (pixels: Pixels, column: Run) => {
    const size = column.end - column.start
    const step = Math.max(1, Math.floor(size / 60))

    const rows = findRuns(pixels.height, (y) => {
        let dark = 0
        let total = 0

        for (let x = column.start; x < column.end; x += step) {
            total++
            if (isDark(pixels, x, y)) dark++
        }

        return dark / total > GAP_SHARE
    })

    // The level badge hangs below a card, so a run can be a little taller than
    // the card; cards cut off by the screenshot's edge are too short.
    return rows
        .filter((row) => {
            const ratio = (row.end - row.start) / size

            return ratio > CARD_RATIO - 0.12 && ratio < CARD_RATIO + 0.3
        })
        .map((row): CardRect => ({
            x: column.start,
            y: row.start,
            width: size,
            height: Math.round(size * CARD_RATIO),
        }))
}

// The selected card's glow makes its run start a little early, so every card
// takes the median top of the cards beside it.
const alignRows = (cards: CardRect[]) => {
    return cards.map((card) => {
        const tops = cards
            .filter((other) => Math.abs(other.y - card.y) < card.width * 0.3)
            .map((other) => other.y)
            .sort((a, b) => a - b)

        return { ...card, y: tops[Math.floor(tops.length / 2)] }
    })
}

// In reading order: left to right, top to bottom. Cards in a row share their
// top after alignRows.
export const detectCards = (pixels: Pixels): CardRect[] => {
    const cards = alignRows(
        findColumns(pixels).flatMap((column) =>
            findCardsInColumn(pixels, column),
        ),
    )

    return cards.sort((a, b) => a.y - b.y || a.x - b.x)
}
