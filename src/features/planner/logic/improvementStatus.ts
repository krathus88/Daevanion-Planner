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
    // The search started from a result the user already had.
    fromCurrent?: boolean
}

// The paragraph a finished search adds to its result message.
export const searchSummary = ({
    finds,
    noun,
    fromCurrent = false,
}: SearchSummaryOptions) => {
    const { optionsChecked, firstFoundMs, improvements, lastImprovedMs } = finds
    const checked =
        optionsChecked > 0 ? `Checked ${plural(optionsChecked, "option")}.` : ""
    let found = ""
    if (improvements > 0 && lastImprovedMs !== null) {
        const than = fromCurrent ? "than the current one" : "after the first"

        found = `Found ${plural(improvements, `better ${noun}`)} ${than}, the last at ${formatFoundAt(lastImprovedMs)}.`
    } else if (firstFoundMs !== null && !fromCurrent) {
        found = `No better ${noun} turned up after the first at ${formatFoundAt(firstFoundMs)}.`
    }

    return [checked, found].filter((part) => part !== "").join(" ")
}

// The all-boards step line under the search bar.
export const planPhaseStatus = (finds: SearchFinds) => {
    const checked = formatOptionsChecked(finds.optionsChecked)

    return finds.firstFoundMs === null
        ? `Step 1 of 2: building the plan · ${checked}`
        : `Step 2 of 2: refining it · ${checked}`
}

type ImprovementStatusOptions = {
    finds: SearchFinds
    noun: Noun
    fromCurrent?: boolean
}

// The line under a search's status.
export const improvementStatus = ({
    finds,
    noun,
    fromCurrent = false,
}: ImprovementStatusOptions) => {
    const { firstFoundMs, improvements, lastImprovedMs } = finds
    if (improvements > 0 && lastImprovedMs !== null) {
        return `Best ${noun} so far found at ${formatFoundAt(lastImprovedMs)} · ${plural(improvements, "improvement")}`
    }
    if (fromCurrent) {
        return `Looking for a better ${noun} than the current one`
    }
    if (firstFoundMs === null) {
        return `Building the first ${noun}…`
    }

    return `First ${noun} ready at ${formatFoundAt(firstFoundMs)} · looking for a better one`
}
