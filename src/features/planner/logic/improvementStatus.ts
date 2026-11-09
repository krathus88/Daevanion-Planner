import { formatSearchTime } from "@planner/config/searchTime"

export type SearchFinds = {
    // Every route variation the search tried, kept or not.
    optionsChecked: number
    // Null until the first full result is found.
    firstFoundMs: number | null
    // Better results found after that.
    improvements: number
    lastImprovedMs: number | null
}

export const NO_FINDS: SearchFinds = {
    optionsChecked: 0,
    firstFoundMs: null,
    improvements: 0,
    lastImprovedMs: null,
}

type Noun = "plan" | "route"

// 30 -> "<0.1s", 400 -> "0.4s", 9400 -> "9.4s", 72000 -> "1m 12s"
const formatFoundAt = (milliseconds: number) => {
    if (milliseconds < 100) {
        return "<0.1s"
    }

    return milliseconds < 10_000
        ? `${(milliseconds / 1000).toFixed(1)}s`
        : formatSearchTime(milliseconds / 1000)
}

const plural = (count: number, word: string) => {
    return `${count.toLocaleString()} ${count === 1 ? word : `${word}s`}`
}

export const formatOptionsChecked = (count: number) => {
    return `${plural(count, "option")} checked`
}

// Messages are one string; a blank line starts a new paragraph.
export const joinParagraphs = (...paragraphs: string[]) => {
    return paragraphs.filter((paragraph) => paragraph !== "").join("\n\n")
}

type SearchSummaryOptions = {
    finds: SearchFinds
    noun: Noun
}

// The paragraph a finished search adds to its result message.
export const searchSummary = ({ finds, noun }: SearchSummaryOptions) => {
    const { optionsChecked, firstFoundMs, improvements, lastImprovedMs } = finds
    const checked =
        optionsChecked > 0 ? `Checked ${plural(optionsChecked, "option")}.` : ""
    let found = ""
    if (improvements > 0 && lastImprovedMs !== null) {
        found = `Found ${plural(improvements, `better ${noun}`)} after the first, the last at ${formatFoundAt(lastImprovedMs)}.`
    } else if (firstFoundMs !== null) {
        found = `No better ${noun} turned up after the first at ${formatFoundAt(firstFoundMs)}.`
    }

    return [checked, found].filter((part) => part !== "").join(" ")
}

// Building the first plan, then refining it.
export type PlanPhase = "build" | "refine"

const PLAN_PHASES: Record<PlanPhase, { number: number; label: string }> = {
    build: { number: 1, label: "building the plan" },
    refine: { number: 2, label: "refining it" },
}

type PlanPhaseStatusOptions = {
    finds: SearchFinds
    phase: PlanPhase
}

// The all-boards step line under the search bar.
export const planPhaseStatus = ({ finds, phase }: PlanPhaseStatusOptions) => {
    const checked = formatOptionsChecked(finds.optionsChecked)
    const step = PLAN_PHASES[phase]
    const steps = Object.keys(PLAN_PHASES).length

    return `Step ${step.number} of ${steps}: ${step.label} · ${checked}`
}

// 42s idle of 60 -> "No better plan for 42s · stops at 1m"
export const idleStatus = (idleMs: number, stallMs: number, noun: Noun) => {
    return `No better ${noun} for ${formatSearchTime(idleMs / 1000)} · stops at ${formatSearchTime(stallMs / 1000)}`
}

type ImprovementStatusOptions = {
    finds: SearchFinds
    noun: Noun
}

// The line under a search's status.
export const improvementStatus = ({
    finds,
    noun,
}: ImprovementStatusOptions) => {
    const { firstFoundMs, improvements, lastImprovedMs } = finds
    if (improvements > 0 && lastImprovedMs !== null) {
        return `Best ${noun} so far found at ${formatFoundAt(lastImprovedMs)} · ${plural(improvements, "improvement")}`
    }
    if (firstFoundMs === null) {
        return `Building the first ${noun}…`
    }

    return `First ${noun} ready at ${formatFoundAt(firstFoundMs)} · looking for a better one`
}

type SearchClock = {
    elapsedMs: number
    idleMs: number
    stallMs: number
}

// Worker progress comes in bursts; between messages its clocks keep running
// from when the last one arrived. `now` can be older than `receivedAt` (a
// clock snapshot from before the message), which counts as no time passed.
export const advanceSearchClock = <Progress extends SearchClock>(
    progress: Progress,
    receivedAt: number,
    now: number,
): Progress => {
    const passedMs = Math.max(0, now - receivedAt)

    return {
        ...progress,
        elapsedMs: progress.elapsedMs + passedMs,
        idleMs: Math.min(progress.stallMs, progress.idleMs + passedMs),
    }
}

type HeadlineProgress = {
    elapsedMs: number
    pointsUsed: number
}

// The all-boards line beside Stop and Cancel.
export const planSearchHeadline = (
    progress: HeadlineProgress | null,
    isStopping: boolean,
) => {
    if (isStopping) {
        return "Stopping… finishing the best plan so far"
    }
    if (!progress) {
        return "Preparing all-board optimization…"
    }

    return `Searching… ${formatSearchTime(progress.elapsedMs / 1000)} · ${progress.pointsUsed} points used`
}
