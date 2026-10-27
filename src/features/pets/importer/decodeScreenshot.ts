export const getCanvasContext = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d", { willReadFrequently: true })

    if (!context) {
        throw new Error("This browser can't read images.")
    }

    return context
}

// The screenshot as a bitmap, for cutting thumbnails, and its pixels.
// Close the bitmap when done.
export const decodeScreenshot = async (file: Blob) => {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement("canvas")
    const context = getCanvasContext(canvas)

    canvas.width = bitmap.width
    canvas.height = bitmap.height
    context.drawImage(bitmap, 0, 0)

    return {
        bitmap: bitmap,
        pixels: context.getImageData(0, 0, canvas.width, canvas.height),
    }
}
