import type { BoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import { readBoardScreenshot } from "@planner/logic/boardScreenshot"

// Reads which board one screenshot shows and its acquired nodes.
export const readBoardImage = async (file: Blob) => {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d", { willReadFrequently: true })

    if (!context) {
        bitmap.close()
        throw new Error("This browser can't read images.")
    }

    canvas.width = bitmap.width
    canvas.height = bitmap.height
    context.drawImage(bitmap, 0, 0)
    bitmap.close()

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)

    return readBoardScreenshot<BoardId>(pixels, layouts)
}
