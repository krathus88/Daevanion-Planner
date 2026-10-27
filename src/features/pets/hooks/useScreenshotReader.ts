import { useState } from "react"

type ReadProgress = {
    done: number
    total: number
}

// Reads screenshots one at a time with readFile; more screenshots add to
// what's read.
export const useScreenshotReader = <T>(
    readFile: (file: File) => Promise<T[]>,
) => {
    const [readings, setReadings] = useState<T[]>([])
    const [progress, setProgress] = useState<ReadProgress | null>(null)
    // Screenshots with nothing found, or that failed to open.
    const [skippedFiles, setSkippedFiles] = useState<string[]>([])

    const readFiles = async (files: File[]) => {
        if (files.length === 0 || progress) return

        setProgress({ done: 0, total: files.length })

        for (const [index, file] of files.entries()) {
            try {
                const found = await readFile(file)

                if (found.length > 0) {
                    setReadings((previous) => [...previous, ...found])
                } else {
                    setSkippedFiles((previous) => [...previous, file.name])
                }
            } catch {
                setSkippedFiles((previous) => [...previous, file.name])
            }

            setProgress({ done: index + 1, total: files.length })
        }

        setProgress(null)
    }

    const reset = () => {
        setReadings([])
        setProgress(null)
        setSkippedFiles([])
    }

    return {
        readings: readings,
        progress: progress,
        skippedFiles: skippedFiles,
        readFiles: readFiles,
        reset: reset,
    }
}
