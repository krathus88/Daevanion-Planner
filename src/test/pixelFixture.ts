import type { Pixels } from "@pets/logic/cardDetection"

export type Color = readonly [number, number, number]

// A synthetic screenshot, in the same RGBA layout as canvas ImageData.
export const makePixels = (
    width: number,
    height: number,
    background: Color = [0, 0, 0],
): Pixels & { data: Uint8ClampedArray } => {
    const data = new Uint8ClampedArray(width * height * 4)

    for (let i = 0; i < data.length; i += 4) {
        data[i] = background[0]
        data[i + 1] = background[1]
        data[i + 2] = background[2]
        data[i + 3] = 255
    }

    return { data: data, width: width, height: height }
}

export const fillRect = (
    pixels: Pixels,
    x: number,
    y: number,
    width: number,
    height: number,
    color: Color,
) => {
    const channels = pixels.channels ?? 4

    for (
        let py = Math.max(0, y);
        py < Math.min(pixels.height, y + height);
        py++
    ) {
        for (
            let px = Math.max(0, x);
            px < Math.min(pixels.width, x + width);
            px++
        ) {
            const i = (py * pixels.width + px) * channels

            pixels.data[i] = color[0]
            pixels.data[i + 1] = color[1]
            pixels.data[i + 2] = color[2]
        }
    }
}

// The same picture with 3 bytes per pixel, as sharp's raw output gives.
export const toRgb = (pixels: Pixels): Pixels => {
    const data = new Uint8Array(pixels.width * pixels.height * 3)

    for (let i = 0; i < pixels.width * pixels.height; i++) {
        data[i * 3] = pixels.data[i * 4]
        data[i * 3 + 1] = pixels.data[i * 4 + 1]
        data[i * 3 + 2] = pixels.data[i * 4 + 2]
    }

    return {
        data: data,
        width: pixels.width,
        height: pixels.height,
        channels: 3,
    }
}
