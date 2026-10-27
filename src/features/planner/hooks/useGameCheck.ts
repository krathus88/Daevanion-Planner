import type { BoardId } from "@config/boards"
import { useState } from "react"

// Acquired nodes per board, read from game screenshots.
export type GameReadings = Partial<Record<BoardId, string[]>>

// Kept above the boards so switching board keeps what was read. Not saved:
// a reading is only worth as much as the screenshot it came from.
export const useGameCheck = (layout: BoardId) => {
    const [readings, setReadings] = useState<GameReadings>({})
    // Boards read while another board was open, until they're opened.
    const [unseen, setUnseen] = useState<BoardId[]>([])
    const [openLayout, setOpenLayout] = useState(layout)

    if (layout !== openLayout) {
        setOpenLayout(layout)
        setUnseen((previous) => {
            return previous.filter((boardId) => boardId !== layout)
        })
    }

    const addReading = (boardId: BoardId, acquired: string[]) => {
        setReadings((previous) => {
            return { ...previous, [boardId]: acquired }
        })

        if (boardId !== layout) {
            setUnseen((previous) => {
                return previous.includes(boardId)
                    ? previous
                    : [...previous, boardId]
            })
        }
    }

    const clearReading = (boardId: BoardId) => {
        setReadings((previous) => {
            const next = { ...previous }
            delete next[boardId]
            return next
        })
        setUnseen((previous) => {
            return previous.filter((id) => id !== boardId)
        })
    }

    const clearAll = () => {
        setReadings({})
        setUnseen([])
    }

    return {
        readings: readings,
        unseen: unseen,
        addReading: addReading,
        clearReading: clearReading,
        clearAll: clearAll,
    }
}

export type GameCheck = ReturnType<typeof useGameCheck>
