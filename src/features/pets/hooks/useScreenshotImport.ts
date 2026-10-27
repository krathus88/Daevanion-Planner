import type { Pet } from "@pets/data/petAtlas"
import { loadPetPrints } from "@pets/importer/loadPetPrints"
import { readScreenshot } from "@pets/importer/readScreenshot"
import type { CardReading } from "@pets/logic/screenshotImport"
import { useState } from "react"

type ImportProgress = {
    done: number
    total: number
}

// Reads pet cards from screenshots; more screenshots add to what's read.
export const useScreenshotImport = (pets: Pet[]) => {
    const [readings, setReadings] = useState<CardReading[]>([])
    const [progress, setProgress] = useState<ImportProgress | null>(null)
    // Screenshots with no whole pet card, or that failed to open.
    const [skippedFiles, setSkippedFiles] = useState<string[]>([])

    const readFiles = async (files: File[]) => {
        if (files.length === 0 || progress) return

        setProgress({ done: 0, total: files.length })

        try {
            const prints = await loadPetPrints(pets)

            for (const [index, file] of files.entries()) {
                try {
                    const found = await readScreenshot(file, prints)

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
        } catch {
            setSkippedFiles((previous) => [
                ...previous,
                ...files.map((file) => file.name),
            ])
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
