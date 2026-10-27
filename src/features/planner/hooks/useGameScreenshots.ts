import type { BoardId } from "@config/boards"
import { readBoardImage } from "@planner/game-check/readBoardImage"
import { useState } from "react"

type ReadProgress = {
    done: number
    total: number
}

// One screenshot's outcome; boardId is null when no whole board was found.
export type ScreenshotResult = {
    fileName: string
    boardId: BoardId | null
}

// Reads boards from screenshots one by one; each board read is handed on.
export const useGameScreenshots = (
    onRead: (boardId: BoardId, acquired: string[]) => void,
) => {
    const [results, setResults] = useState<ScreenshotResult[]>([])
    const [progress, setProgress] = useState<ReadProgress | null>(null)

    const readFiles = async (files: File[]) => {
        if (files.length === 0 || progress) return

        setProgress({ done: 0, total: files.length })

        for (const [index, file] of files.entries()) {
            let boardId: BoardId | null = null

            try {
                const reading = await readBoardImage(file)

                if (reading) {
                    boardId = reading.boardId
                    onRead(reading.boardId, reading.acquired)
                }
            } catch {
                boardId = null
            }

            setResults((previous) => [
                ...previous,
                { fileName: file.name, boardId: boardId },
            ])
            setProgress({ done: index + 1, total: files.length })
        }

        setProgress(null)
    }

    const reset = () => {
        setResults([])
        setProgress(null)
    }

    return {
        results: results,
        progress: progress,
        readFiles: readFiles,
        reset: reset,
    }
}
