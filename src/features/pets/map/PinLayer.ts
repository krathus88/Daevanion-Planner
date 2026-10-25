import type { PetPin } from "@pets/logic/petFinder"
import L from "leaflet"
import { toLatLng } from "./mapCoords"
import { buildPinTooltip } from "./pinTooltip"

export type PinColors = {
    // Fill per pet category.
    fill: Record<string, string>
    ring: string
}

// Hit-test grid cell, in screen pixels.
const CELL = 16
// Extra canvas around the view, so panning shows pins before the redraw.
const PADDING = 0.5
// Pointer slack around a pin, in screen pixels.
const HIT_SLOP = 3

const cellKey = (cellX: number, cellY: number) => {
    return cellX * 65536 + cellY
}

// Thousands of pins as one canvas instead of one Leaflet layer per pin:
// drawing is a few batched paths, and hover/click use a grid lookup.
export class PinLayer extends L.Layer {
    private canvas = document.createElement("canvas")
    private tooltip = L.tooltip({ direction: "top", offset: [0, -4] })
    private pins: PetPin[] = []
    private colors: PinColors = { fill: {}, ring: "" }
    private radius = 4
    // Screen positions as x, y pairs, matching pins by index.
    private points = new Float32Array(0)
    private grid = new Map<number, number[]>()
    private hovered = -1
    private onSelect: (petId: number) => void

    constructor(onSelect: (petId: number) => void) {
        super()
        this.onSelect = onSelect
        // Leaflet hides these during zoom animations; we redraw after.
        this.canvas.className = "leaflet-zoom-hide"
        this.canvas.style.position = "absolute"
        this.canvas.style.pointerEvents = "none"
    }

    onAdd(map: L.Map) {
        map.getPane("overlayPane")?.append(this.canvas)
        map.on("moveend zoomend resize viewreset", this.redraw, this)
        map.on("mousemove", this.handleMove, this)
        map.on("mouseout", this.clearHover, this)
        map.on("click", this.handleClick, this)
        this.redraw()

        return this
    }

    onRemove(map: L.Map) {
        this.clearHover()
        this.canvas.remove()
        map.off("moveend zoomend resize viewreset", this.redraw, this)
        map.off("mousemove", this.handleMove, this)
        map.off("mouseout", this.clearHover, this)
        map.off("click", this.handleClick, this)

        return this
    }

    setPins(pins: PetPin[], colors: PinColors, radius: number) {
        this.pins = pins
        this.colors = colors
        this.radius = radius
        this.clearHover()
        this.redraw()
    }

    private redraw() {
        const map = this._map

        if (!map) {
            return
        }

        const size = map.getSize()
        const padX = Math.round(size.x * PADDING)
        const padY = Math.round(size.y * PADDING)
        const width = size.x + padX * 2
        const height = size.y + padY * 2
        const ratio = window.devicePixelRatio || 1
        const topLeft = map.containerPointToLayerPoint([-padX, -padY])

        this.canvas.width = Math.round(width * ratio)
        this.canvas.height = Math.round(height * ratio)
        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${height}px`
        L.DomUtil.setPosition(this.canvas, topLeft)

        const context = this.canvas.getContext("2d")

        if (!context) {
            return
        }

        context.setTransform(ratio, 0, 0, ratio, 0, 0)
        context.clearRect(0, 0, width, height)

        // Project once, keeping only pins on the canvas.
        const points = new Float32Array(this.pins.length * 2)
        const colors: string[] = []
        const visible: number[] = []
        const grid = new Map<number, number[]>()

        for (const [index, pin] of this.pins.entries()) {
            const point = map.latLngToContainerPoint(toLatLng(pin.x, pin.y))

            colors[index] =
                this.colors.fill[pin.pet.category] ?? this.colors.ring
            points[index * 2] = point.x
            points[index * 2 + 1] = point.y

            if (
                point.x < -padX ||
                point.y < -padY ||
                point.x > size.x + padX ||
                point.y > size.y + padY
            ) {
                continue
            }

            visible.push(index)

            const key = cellKey(
                Math.floor(point.x / CELL),
                Math.floor(point.y / CELL),
            )
            const cell = grid.get(key)

            if (cell) {
                cell.push(index)
            } else {
                grid.set(key, [index])
            }
        }

        // Pin by pin (a dark disc one pixel larger, then the color), so
        // overlapping pins stay separate dots instead of one blob.
        for (const index of visible) {
            const x = points[index * 2] + padX
            const y = points[index * 2 + 1] + padY

            context.fillStyle = this.colors.ring
            context.beginPath()
            context.arc(x, y, this.radius + 1, 0, Math.PI * 2)
            context.fill()
            context.fillStyle = colors[index]
            context.beginPath()
            context.arc(x, y, this.radius, 0, Math.PI * 2)
            context.fill()
        }

        this.points = points
        this.grid = grid
    }

    private findPin(x: number, y: number) {
        const reach = this.radius + HIT_SLOP
        let found = -1
        let best = reach * reach

        for (
            let cellX = Math.floor((x - reach) / CELL);
            cellX <= Math.floor((x + reach) / CELL);
            cellX++
        ) {
            for (
                let cellY = Math.floor((y - reach) / CELL);
                cellY <= Math.floor((y + reach) / CELL);
                cellY++
            ) {
                for (const index of this.grid.get(cellKey(cellX, cellY)) ??
                    []) {
                    const distance =
                        (this.points[index * 2] - x) ** 2 +
                        (this.points[index * 2 + 1] - y) ** 2

                    if (distance <= best) {
                        found = index
                        best = distance
                    }
                }
            }
        }

        return found
    }

    private handleMove(event: L.LeafletMouseEvent) {
        const index = this.findPin(
            event.containerPoint.x,
            event.containerPoint.y,
        )

        if (index === this.hovered) {
            return
        }

        this.clearHover()

        if (index < 0) {
            return
        }

        const pin = this.pins[index]

        this.hovered = index
        this._map?.getContainer().classList.add("pet-map-pointer")
        this.tooltip
            .setLatLng(toLatLng(pin.x, pin.y))
            .setContent(buildPinTooltip(pin))
        this._map?.openTooltip(this.tooltip)
    }

    private handleClick(event: L.LeafletMouseEvent) {
        const index = this.findPin(
            event.containerPoint.x,
            event.containerPoint.y,
        )

        if (index >= 0) {
            this.onSelect(this.pins[index].pet.id)
        }
    }

    private clearHover() {
        if (this.hovered < 0) {
            return
        }

        this.hovered = -1
        this._map?.getContainer().classList.remove("pet-map-pointer")
        this._map?.closeTooltip(this.tooltip)
    }
}
