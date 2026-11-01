// @vitest-environment jsdom
import L from "leaflet"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PetPin } from "@pets/logic/petFinder"
import { PinLayer } from "./PinLayer"

type Handler = (event: { containerPoint: L.Point }) => void

const COLORS = { fill: { fera: "red" }, ring: "black" }

let context: {
    arc: ReturnType<typeof vi.fn>
    [key: string]: unknown
}

// Enough of a Leaflet map, with screen pixels equal to map pixels.
const makeMap = () => {
    const handlers = new Map<string, { handler: Handler; owner: unknown }>()
    const pane = document.createElement("div")
    const container = document.createElement("div")

    return {
        pane: pane,
        container: container,
        handlers: handlers,
        openTooltip: vi.fn(),
        closeTooltip: vi.fn(),
        getPane: () => {
            return pane
        },
        getContainer: () => {
            return container
        },
        getSize: () => {
            return L.point(100, 100)
        },
        containerPointToLayerPoint: () => {
            return L.point(0, 0)
        },
        latLngToContainerPoint: (latLng: L.LatLng) => {
            return L.point(latLng.lng, -latLng.lat)
        },
        on: (types: string, handler: Handler, owner: unknown) => {
            for (const type of types.split(" ")) {
                handlers.set(type, { handler: handler, owner: owner })
            }
        },
        off: (types: string) => {
            for (const type of types.split(" ")) {
                handlers.delete(type)
            }
        },
    }
}

const pin = (id: number, x: number, y: number) => {
    return {
        x: x,
        y: y,
        pet: { id: id, name: `Pet ${id}`, category: "fera" },
        monster: { name: "Wolf", level: 1 },
        spot: null,
        area: null,
        level: 0,
    } as unknown as PetPin
}

const setup = (pins: PetPin[]) => {
    const map = makeMap()
    const onSelect = vi.fn()
    const layer = new PinLayer(onSelect)

    ;(layer as unknown as { _map: unknown })._map = map
    layer.onAdd(map as unknown as L.Map)
    layer.setPins(pins, COLORS, 4)

    const fire = (type: string, x = 0, y = 0) => {
        const entry = map.handlers.get(type)

        entry?.handler.call(entry.owner, { containerPoint: L.point(x, y) })
    }

    return { map: map, layer: layer, onSelect: onSelect, fire: fire }
}

beforeEach(() => {
    context = {
        arc: vi.fn(),
        setTransform: vi.fn(),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        fill: vi.fn(),
        fillStyle: "",
    }
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        context as never,
    )
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe("drawing", () => {
    it("adds its canvas and draws a ring and a dot per pin", () => {
        const { map } = setup([pin(1, 10, 10), pin(2, 20, 20)])

        expect(map.pane.querySelector("canvas")).not.toBeNull()
        expect(context.arc).toHaveBeenCalledTimes(4)
    })

    it("skips pins far off screen", () => {
        setup([pin(1, 10, 10), pin(2, 5000, 5000)])

        expect(context.arc).toHaveBeenCalledTimes(2)
    })

    it("redraws when the map moves", () => {
        const { fire } = setup([pin(1, 10, 10)])

        context.arc.mockClear()
        fire("moveend")

        expect(context.arc).toHaveBeenCalledTimes(2)
    })

    it("draws nothing without a canvas context", () => {
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
            null,
        )

        expect(() => {
            setup([pin(1, 10, 10)])
        }).not.toThrow()
        expect(context.arc).not.toHaveBeenCalled()
    })
})

describe("hover", () => {
    it("shows a tooltip and pointer over a pin", () => {
        const { map, fire } = setup([pin(1, 50, 50)])

        fire("mousemove", 51, 51)

        expect(map.openTooltip).toHaveBeenCalledTimes(1)
        expect(map.container.classList.contains("pet-map-pointer")).toBe(true)
    })

    it("does nothing away from pins", () => {
        const { map, fire } = setup([pin(1, 50, 50)])

        fire("mousemove", 80, 80)

        expect(map.openTooltip).not.toHaveBeenCalled()
    })

    it("reaches a pin's radius plus some slack, no further", () => {
        const { map, fire } = setup([pin(1, 50, 50)])

        fire("mousemove", 57, 50)
        expect(map.openTooltip).toHaveBeenCalledTimes(1)

        fire("mousemove", 58, 50)
        expect(map.closeTooltip).toHaveBeenCalledTimes(1)
    })

    it("doesn't reopen on the same pin", () => {
        const { map, fire } = setup([pin(1, 50, 50)])

        fire("mousemove", 50, 50)
        fire("mousemove", 51, 50)

        expect(map.openTooltip).toHaveBeenCalledTimes(1)
    })

    it("clears when the mouse leaves", () => {
        const { map, fire } = setup([pin(1, 50, 50)])

        fire("mousemove", 50, 50)
        fire("mouseout")

        expect(map.closeTooltip).toHaveBeenCalledTimes(1)
        expect(map.container.classList.contains("pet-map-pointer")).toBe(false)
    })

    it("finds a pin across a grid cell's edge", () => {
        // Grid cells are 16 px: the pin and pointer sit on either side of 48.
        const { map, fire } = setup([pin(1, 47, 47)])

        fire("mousemove", 49, 49)

        expect(map.openTooltip).toHaveBeenCalledTimes(1)
    })
})

describe("click", () => {
    it("selects the closest pin's pet", () => {
        const { onSelect, fire } = setup([pin(1, 50, 50), pin(2, 54, 50)])

        fire("click", 53, 50)

        expect(onSelect).toHaveBeenCalledWith(2)
    })

    it("does nothing away from pins", () => {
        const { onSelect, fire } = setup([pin(1, 50, 50)])

        fire("click", 90, 90)

        expect(onSelect).not.toHaveBeenCalled()
    })
})

describe("changing pins", () => {
    it("forgets old pins and clears the hover", () => {
        const { map, layer, onSelect, fire } = setup([pin(1, 50, 50)])

        fire("mousemove", 50, 50)
        layer.setPins([pin(2, 20, 20)], COLORS, 4)

        expect(map.closeTooltip).toHaveBeenCalledTimes(1)

        fire("click", 50, 50)
        expect(onSelect).not.toHaveBeenCalled()

        fire("click", 20, 20)
        expect(onSelect).toHaveBeenCalledWith(2)
    })

    it("removes itself cleanly", () => {
        const { map, layer } = setup([pin(1, 50, 50)])

        layer.onRemove(map as unknown as L.Map)

        expect(map.pane.querySelector("canvas")).toBeNull()
        expect(map.handlers.size).toBe(0)
    })
})
