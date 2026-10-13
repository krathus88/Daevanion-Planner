export type BoardLayout = {
    grid: readonly string[]
    mainNode: BoardNodeAppearance
    startNode: BoardNodeAppearance
    specialNodes: Readonly<Record<string, BoardNodeAppearance>>
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
    },
} as const

export type BoardLayoutName = keyof typeof layouts

export const isLayoutType = (layout: string): layout is LayoutType =>
    Object.hasOwn(layouts, layout)
