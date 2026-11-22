// Rough card heights for placing the Characters cards: a card goes under the
// column that's shortest so far, so one after a shorter card fills in under
// it. By what the card shows (open or minimized, a note line, a "Left" line),
// not measured heights, so cards never jump columns while tasks are ticked
// off in an open card.
export const OPEN_WEIGHT = 3
export const MINIMIZED_WEIGHT = 1
// A line under the header: the note's short line, or a minimized card's
// "Left" line of tasks still to do.
export const LINE_WEIGHT = 0.25

type CardWeightInput = {
    minimized: boolean
    hasNote: boolean
    // Minimized: tasks still left, so the "Left" line shows.
    hasPending: boolean
}

export const getCardWeight = ({
    minimized,
    hasNote,
    hasPending,
}: CardWeightInput) => {
    const noteWeight = hasNote ? LINE_WEIGHT : 0

    if (!minimized) {
        return OPEN_WEIGHT + noteWeight
    }

    return MINIMIZED_WEIGHT + noteWeight + (hasPending ? LINE_WEIGHT : 0)
}
