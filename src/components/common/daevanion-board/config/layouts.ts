import type { SpecialBonusType } from "./specialNodes"
import type { StatType } from "./stats"

export type BoardLayout = {
    grid: readonly string[]
    mainNode: BoardNodeAppearance
    startNode: BoardNodeAppearance
    specialNodes: Readonly<Record<string, BoardNodeAppearance>>
    // Stat given by each stat node: "row,col" -> stat. Same for every class.
    // Nodes left out simply show as "Stat".
    nodeStats: Readonly<Record<string, StatType>>
    // Bonus given by each special node: "row,col" -> bonus. Same for every
    // class. Nodes left out simply show as "Special".
    specialNodeBonuses: Readonly<Record<string, SpecialBonusType>>
}

export type BoardNodeType = "basic" | "skill" | "passive" | "special" | "start"

export const POINTS_PER_NODE_TYPE: Record<BoardNodeType, number> = {
    basic: 1,
    skill: 3,
    passive: 2,
    special: 4,
    start: 0,
}

export type BoardNodeAppearance = {
    name: string
    label: string
    backgroundColor: string
    type: BoardNodeType
    imageBackground?: string
}

export type LayoutType = "nezekan" | "zikel" | "vaizel" | "triniel"

export const layouts: Record<LayoutType, BoardLayout> = {
    nezekan: {
        grid: [
            "C##.B#A.B#C",
            "#.A##.###.#",
            "B##.#A#.A#B",
            ".#..#.#.#.#",
            "##A####B###",
            "A..#.S.#..A",
            "###B####A##",
            "#.#.#.#..#.",
            "B#A.#A#.##B",
            "#.###.##A.#",
            "C#B.A#B.##C",
        ],
        mainNode: {
            name: "Stat",
            label: "",
            backgroundColor: "white",
            type: "basic",
        },
        startNode: {
            name: "Start node",
            label: "Start",
            backgroundColor: "blue.100",
            type: "start",
        },
        specialNodes: {
            A: {
                name: "Skill",
                label: "S",
                backgroundColor: "purple.100",
                type: "skill",
            },
            B: {
                name: "Passive",
                label: "P",
                backgroundColor: "teal.100",
                type: "passive",
            },
            C: {
                name: "Special",
                label: "S",
                backgroundColor: "orange.100",
                type: "special",
            },
        },
        nodeStats: {
            "0,1": "attack",
            "0,2": "critical-hit-resist",
            "0,9": "critical-hit",
        },
        specialNodeBonuses: {
            "0,0": "combat-speed",
            "0,10": "cooldown-reduction",
            "10,0": "cooldown-reduction",
            "10,10": "combat-speed",
        },
    },
    zikel: {
        grid: [
            "C###A#B#A#C",
            "#.B.#..#..#",
            "A##.##A##B#",
            "#.##B.#.#.#",
            "##A.#.#B##A",
            ".#..#S#..#.",
            "A##B#.#.A##",
            "#.#.#.B##.#",
            "#B##A##.##A",
            "#..#..#.B.#",
            "C#A#B#A###C",
        ],
        mainNode: {
            name: "Stat",
            label: "",
            backgroundColor: "white",
            type: "basic",
        },
        startNode: {
            name: "Start node",
            label: "Start",
            backgroundColor: "blue.100",
            type: "start",
        },
        specialNodes: {
            A: {
                name: "Skill",
                label: "S",
                backgroundColor: "purple.100",
                type: "skill",
            },
            B: {
                name: "Passive",
                label: "P",
                backgroundColor: "teal.100",
                type: "passive",
            },
            C: {
                name: "Special",
                label: "S",
                backgroundColor: "orange.100",
                type: "special",
            },
        },
        nodeStats: {},
        specialNodeBonuses: {
            "0,0": "damage-tolerance",
            "0,10": "damage-boost",
            "10,0": "damage-boost",
            "10,10": "damage-tolerance",
        },
    },
    vaizel: {
        grid: [
            "C#B.#A#B##C",
            "#.###.#.#.#",
            "#A#.A###A#B",
            ".#..#.B..#.",
            "###B####A##",
            "A..#.S.#..A",
            "##A####B###",
            ".#..B.#..#.",
            "B#A###A.#A#",
            "#.#.#.###.#",
            "C##B#A#.B#C",
        ],
        mainNode: {
            name: "Stat",
            label: "",
            backgroundColor: "white",
            type: "basic",
        },
        startNode: {
            name: "Start node",
            label: "Start",
            backgroundColor: "blue.100",
            type: "start",
        },
        specialNodes: {
            A: {
                name: "Skill",
                label: "S",
                backgroundColor: "purple.100",
                type: "skill",
            },
            B: {
                name: "Passive",
                label: "P",
                backgroundColor: "teal.100",
                type: "passive",
            },
            C: {
                name: "Special",
                label: "S",
                backgroundColor: "orange.100",
                type: "special",
            },
        },
        nodeStats: {},
        specialNodeBonuses: {
            "0,0": "critical-damage-boost",
            "0,10": "critical-damage-tolerance",
            "10,0": "critical-damage-tolerance",
            "10,10": "critical-damage-boost",
        },
    },
    triniel: {
        grid: [
            "C##..#C#..##C",
            "#.A##B.B##A.#",
            "#.#..###..#.#",
            "A##B##.#A###B",
            "..#.#...#..#.",
            "####A#####B##",
            "A.#.#.S.#.#.A",
            "##B#####A####",
            ".#..#...#.#..",
            "B###A#.##B##A",
            "#.#..###..#.#",
            "#.A##B.B##A.#",
            "C##..#C#..##C",
        ],
        mainNode: {
            name: "Stat",
            label: "",
            backgroundColor: "white",
            type: "basic",
        },
        startNode: {
            name: "Start node",
            label: "Start",
            backgroundColor: "blue.100",
            type: "start",
        },
        specialNodes: {
            A: {
                name: "Skill",
                label: "S",
                backgroundColor: "purple.100",
                type: "skill",
            },
            B: {
                name: "Passive",
                label: "P",
                backgroundColor: "teal.100",
                type: "passive",
            },
            C: {
                name: "Special",
                label: "S",
                backgroundColor: "orange.100",
                type: "special",
            },
        },
        nodeStats: {},
        specialNodeBonuses: {
            "0,0": "multi-hit-resist",
            "0,6": "multi-hit-chance",
            "0,12": "multi-hit-resist",
            "12,0": "multi-hit-resist",
            "12,6": "multi-hit-chance",
            "12,12": "multi-hit-resist",
        },
    },
} as const

export type BoardLayoutName = keyof typeof layouts

export const isLayoutType = (layout: string): layout is LayoutType =>
    Object.hasOwn(layouts, layout)
