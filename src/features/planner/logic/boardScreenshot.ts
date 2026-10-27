// Reads a screenshot of the game's Daevanion window: finds the node grid,
// tells which board it is from its shape, and which nodes are acquired.
// Nodes sit on a regular grid and are brighter than the gaps between them,
// even locked ones, so the grid is the one whose cells are brightest in the
// middle. Kept free of runtime path aliases so plain node can run it.
import type { Pixels } from "@pets/logic/cardDetection"

// Only the grid is needed from a board layout.
export type BoardShape = {
    grid: readonly string[]
}

// Detection runs on a copy about this many pixels on its short side.
const WORK_SIZE = 450
// The board fills at least this share of the screenshot's short side.
const MIN_BOARD_SHARE = 0.4
const MAX_GRID_SIZE = 15
const MIN_GRID_SIZE = 11
// Half sizes, in cell widths: a node's middle, and the gap band around it.
const INNER = 0.3
const GAP_START = 0.42
const GAP_END = 0.5
// Brightness differences above this count fully when matching shapes.
const MAX_CONTRAST = 40
// Below this the best shape match isn't a board.
const MIN_MATCH = 0.6
// Half size of the patch a node's state is read from, in cell widths.
const STATE_PATCH = 0.25
// A not yet acquired node next to an acquired one glows blue.
const BLUE_SHIFT = 25
// Acquired nodes are lit; locked ones stay dark.
const LIT = 50

type Brightness = {
    // Summed-area table of brightness, (width + 1) * (height + 1).
    sums: Float64Array
    width: number
    height: number
    // Screenshot pixels per working pixel.
    scale: number
}

type Lattice = {
    // Distance between cell centers.
    pitch: number
    // Center of the first cell.
    x: number
    y: number
}

type BoardMatch<Id extends string> = {
    boardId: Id
    // The board's top-left cell, in lattice cells.
    row: number
    column: number
    score: number
}

export type BoardReading<Id extends string> = {
    boardId: Id
    // Acquired nodes, as "row,column" keys. The start node is left out.
    acquired: string[]
    // Shape match, 1 is a perfect match.
    score: number
}

const toBrightness = (pixels: Pixels): Brightness => {
    const channels = pixels.channels ?? 4
    const scale = Math.max(
        1,
        Math.floor(Math.min(pixels.width, pixels.height) / WORK_SIZE),
    )
    const width = Math.floor(pixels.width / scale)
    const height = Math.floor(pixels.height / scale)
    const sums = new Float64Array((width + 1) * (height + 1))

    for (let y = 0; y < height; y++) {
        let rowSum = 0

        for (let x = 0; x < width; x++) {
            let total = 0

            for (let dy = 0; dy < scale; dy++) {
                for (let dx = 0; dx < scale; dx++) {
                    const i =
                        ((y * scale + dy) * pixels.width + x * scale + dx) *
                        channels

                    total +=
                        pixels.data[i] * 0.3 +
                        pixels.data[i + 1] * 0.59 +
                        pixels.data[i + 2] * 0.11
                }
            }

            rowSum += total / (scale * scale)
            sums[(y + 1) * (width + 1) + x + 1] =
                sums[y * (width + 1) + x + 1] + rowSum
        }
    }

    return { sums: sums, width: width, height: height, scale: scale }
}

// Mean brightness of a box, clipped to the image; NaN when fully outside.
const boxMean = (
    brightness: Brightness,
    left: number,
    top: number,
    right: number,
    bottom: number,
) => {
    const { sums, width, height } = brightness
    const x0 = Math.max(0, Math.round(left))
    const y0 = Math.max(0, Math.round(top))
    const x1 = Math.min(width, Math.round(right))
    const y1 = Math.min(height, Math.round(bottom))

    if (x1 <= x0 || y1 <= y0) {
        return Number.NaN
    }

    const stride = width + 1
    const total =
        sums[y1 * stride + x1] -
        sums[y0 * stride + x1] -
        sums[y1 * stride + x0] +
        sums[y0 * stride + x0]

    return total / ((x1 - x0) * (y1 - y0))
}

// How much brighter a cell's middle is than the gaps beside it.
const cellContrast = (
    brightness: Brightness,
    x: number,
    y: number,
    pitch: number,
) => {
    const inner = INNER * pitch
    const gapStart = GAP_START * pitch
    const gapEnd = GAP_END * pitch
    const gaps = [
        boxMean(brightness, x - gapEnd, y - inner, x - gapStart, y + inner),
        boxMean(brightness, x + gapStart, y - inner, x + gapEnd, y + inner),
        boxMean(brightness, x - inner, y - gapEnd, x + inner, y - gapStart),
        boxMean(brightness, x - inner, y + gapStart, x + inner, y + gapEnd),
    ]
    let gapTotal = 0
    let gapCount = 0

    for (const gap of gaps) {
        if (!Number.isNaN(gap)) {
            gapTotal += gap
            gapCount++
        }
    }

    const middle = boxMean(
        brightness,
        x - inner,
        y - inner,
        x + inner,
        y + inner,
    )

    return gapCount === 0 ? 0 : middle - gapTotal / gapCount
}

// Cell centers along one side; a cell counts while its middle is inside.
const cellCenters = (start: number, pitch: number, length: number) => {
    const centers: number[] = []

    for (
        let center = start;
        center + INNER * pitch <= length;
        center += pitch
    ) {
        centers.push(center)
    }

    return centers
}

const readContrasts = (brightness: Brightness, lattice: Lattice) => {
    const rows: number[][] = []

    for (const y of cellCenters(lattice.y, lattice.pitch, brightness.height)) {
        const row: number[] = []

        for (const x of cellCenters(
            lattice.x,
            lattice.pitch,
            brightness.width,
        )) {
            row.push(cellContrast(brightness, x, y, lattice.pitch))
        }

        rows.push(row)
    }

    return rows
}

// Mean contrast over every cell; highest when cells sit on the nodes.
const scoreLattice = (brightness: Brightness, lattice: Lattice) => {
    let total = 0
    let count = 0

    for (const row of readContrasts(brightness, lattice)) {
        for (const contrast of row) {
            total += contrast
            count++
        }
    }

    return count === 0 ? Number.NEGATIVE_INFINITY : total / count
}

// The first cell starts within one pitch of the top-left corner.
const searchLattices = (
    brightness: Brightness,
    pitches: number[],
    around: Lattice | null,
    offsetStep: (pitch: number) => number,
) => {
    let best: Lattice = { pitch: 0, x: 0, y: 0 }
    let bestScore = Number.NEGATIVE_INFINITY

    for (const pitch of pitches) {
        const step = offsetStep(pitch)
        const start = around ? -around.pitch * 0.15 : 0
        const end = around ? around.pitch * 0.15 : pitch

        for (let dy = start; dy < end; dy += step) {
            for (let dx = start; dx < end; dx += step) {
                const lattice = {
                    pitch: pitch,
                    x: (around ? around.x : INNER * pitch) + dx,
                    y: (around ? around.y : INNER * pitch) + dy,
                }
                const score = scoreLattice(brightness, lattice)

                if (score > bestScore) {
                    best = lattice
                    bestScore = score
                }
            }
        }
    }

    return best
}

// Coarse search over every plausible cell size, then a fine one around it.
const findLattice = (brightness: Brightness) => {
    const shortSide = Math.min(brightness.width, brightness.height)
    const coarse: number[] = []
    const fine: number[] = []

    for (
        let pitch = (shortSide * MIN_BOARD_SHARE) / MAX_GRID_SIZE;
        pitch <= shortSide / MIN_GRID_SIZE;
        pitch *= 1.012
    ) {
        coarse.push(pitch)
    }

    const rough = searchLattices(brightness, coarse, null, (pitch) => {
        return pitch / 6
    })

    for (let pitch = rough.pitch * 0.985; pitch <= rough.pitch * 1.015;) {
        fine.push(pitch)
        pitch += rough.pitch * 0.0025
    }

    return searchLattices(brightness, fine, rough, () => {
        return 0.5
    })
}

// Correlation between a board's node mask and the cell contrasts under it.
const matchWindow = (
    contrasts: number[][],
    grid: readonly string[],
    top: number,
    left: number,
) => {
    let count = 0
    let sumMask = 0
    let sumValue = 0
    let sumMaskValue = 0
    let sumValueSquared = 0

    for (let row = 0; row < grid.length; row++) {
        for (let column = 0; column < grid[row].length; column++) {
            const mask = grid[row][column] === "." ? 0 : 1
            const value = Math.min(
                MAX_CONTRAST,
                Math.max(0, contrasts[top + row][left + column]),
            )

            count++
            sumMask += mask
            sumValue += value
            sumMaskValue += mask * value
            sumValueSquared += value * value
        }
    }

    const maskMean = sumMask / count
    const valueMean = sumValue / count
    const covariance = sumMaskValue / count - maskMean * valueMean
    const maskVariance = maskMean - maskMean * maskMean
    const valueVariance = sumValueSquared / count - valueMean * valueMean

    if (maskVariance <= 0 || valueVariance <= 0) {
        return 0
    }

    return covariance / Math.sqrt(maskVariance * valueVariance)
}

const matchBoard = <Id extends string>(
    contrasts: number[][],
    shapes: Record<Id, BoardShape>,
) => {
    let best: BoardMatch<Id> | null = null
    const rows = contrasts.length
    const columns = contrasts[0]?.length ?? 0

    for (const boardId of Object.keys(shapes) as Id[]) {
        const grid = shapes[boardId].grid
        const height = grid.length
        const width = grid[0].length

        for (let top = 0; top + height <= rows; top++) {
            for (let left = 0; left + width <= columns; left++) {
                const score = matchWindow(contrasts, grid, top, left)

                if (!best || score > best.score) {
                    best = {
                        boardId: boardId,
                        row: top,
                        column: left,
                        score: score,
                    }
                }
            }
        }
    }

    return best && best.score >= MIN_MATCH ? best : null
}

// Mean color of the middle of a node, in screenshot pixels.
const patchColor = (pixels: Pixels, x: number, y: number, half: number) => {
    const channels = pixels.channels ?? 4
    const color = [0, 0, 0]
    let count = 0

    for (let py = Math.round(y - half); py <= y + half; py++) {
        for (let px = Math.round(x - half); px <= x + half; px++) {
            if (px < 0 || py < 0 || px >= pixels.width || py >= pixels.height) {
                continue
            }

            const i = (py * pixels.width + px) * channels

            color[0] += pixels.data[i]
            color[1] += pixels.data[i + 1]
            color[2] += pixels.data[i + 2]
            count++
        }
    }

    return color.map((value) => value / Math.max(1, count))
}

// Acquired nodes are lit in their own colors. Nodes not acquired are dark,
// or glow blue when they can be acquired next.
const isAcquired = (color: number[]) => {
    const [red, green, blue] = color

    return blue - red <= BLUE_SHIFT && Math.max(red, green, blue) > LIT
}

export const readBoardScreenshot = <Id extends string>(
    pixels: Pixels,
    shapes: Record<Id, BoardShape>,
): BoardReading<Id> | null => {
    const brightness = toBrightness(pixels)
    const lattice = findLattice(brightness)
    const match = matchBoard(readContrasts(brightness, lattice), shapes)

    if (!match) {
        return null
    }

    const grid = shapes[match.boardId].grid
    const scale = brightness.scale
    const acquired: string[] = []

    for (let row = 0; row < grid.length; row++) {
        for (let column = 0; column < grid[row].length; column++) {
            const kind = grid[row][column]

            if (kind === "." || kind === "S") {
                continue
            }

            const x =
                (lattice.x + (match.column + column) * lattice.pitch) * scale
            const y = (lattice.y + (match.row + row) * lattice.pitch) * scale
            const color = patchColor(
                pixels,
                x,
                y,
                STATE_PATCH * lattice.pitch * scale,
            )

            if (isAcquired(color)) {
                acquired.push(`${row},${column}`)
            }
        }
    }

    return {
        boardId: match.boardId,
        acquired: acquired,
        score: match.score,
    }
}
