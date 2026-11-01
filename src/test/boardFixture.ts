import type { BoardLayout } from "@planner/config/layouts"

// S start, # basic (1 point), A skill (3), B passive (2), C special (4).
//
//   S # A
//   . # .
//   B # C
//   . . .
//   # . .   <- cut off from the rest
const TEST_GRID = ["S#A", ".#.", "B#C", "...", "#.."]

export const makeLayout = (
    grid: readonly string[] = TEST_GRID,
    overrides: Partial<BoardLayout> = {},
): BoardLayout => {
    return {
        grid: grid,
        mainNode: {
            name: "Stat",
            label: "",
            backgroundColor: "white",
            type: "basic",
        },
        startNode: {
            name: "Start node",
            label: "Start",
            backgroundColor: "white",
            type: "start",
        },
        specialNodes: {
            A: {
                name: "Skill",
                label: "S",
                backgroundColor: "white",
                type: "skill",
            },
            B: {
                name: "Passive",
                label: "P",
                backgroundColor: "white",
                type: "passive",
            },
            C: {
                name: "Special",
                label: "C",
                backgroundColor: "white",
                type: "special",
            },
        },
        nodeStats: {},
        specialNodeBonuses: {},
        ...overrides,
    }
}
