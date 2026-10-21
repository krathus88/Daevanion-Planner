import type { ClassAbility, ClassPreset } from "@config/classPresets"
import { isMainBoard, type BoardId } from "@config/boards"
import type { BoardLayout } from "@planner/config/layouts"

// Maps "row,col" to the class ability on that node. Throws when a class
// assigns an ability to a node that can't hold it.
export const resolveAbilitiesByPosition = (
    layout: BoardLayout,
    layoutName: BoardId,
    classPreset: ClassPreset,
) => {
    const abilitiesById = new Map(
        classPreset.abilities.map((ability) => [ability.id, ability]),
    )
    const abilitiesByPosition: Record<string, ClassAbility> = {}

    // Ariel holds no abilities.
    const assignments = isMainBoard(layoutName)
        ? classPreset.assignments[layoutName]
        : undefined

    for (const [key, abilityId] of Object.entries(assignments ?? {})) {
        const [row, column] = key.split(",").map(Number)
        const kind =
            Number.isInteger(row) && Number.isInteger(column)
                ? layout.grid[row]?.[column]
                : undefined
        const nodeAppearance =
            kind === "S"
                ? layout.startNode
                : kind && Object.hasOwn(layout.specialNodes, kind)
                  ? layout.specialNodes[kind]
                  : layout.mainNode
        const ability = abilitiesById.get(abilityId)

        if (
            !kind ||
            !ability ||
            (nodeAppearance.type !== "skill" &&
                nodeAppearance.type !== "passive") ||
            ability.type !== nodeAppearance.type
        ) {
            throw new Error(
                `Invalid ${classPreset.name} ability assignment at ${layoutName} ${key}. Assign a configured ability to a matching skill or passive node.`,
            )
        }

        abilitiesByPosition[key] = ability
    }

    return abilitiesByPosition
}

const describeNode = (kind: string | undefined, expected: string) => {
    return kind === undefined || kind === "."
        ? "not a node"
        : `not a ${expected}`
}

// Throws when layouts.ts gives a stat or special bonus to the wrong node.
// Stats go on stat nodes ("#" or a costlier stat node's marker), or on
// Ariel's special nodes, which give a stat instead of a bonus.
export const validateLayoutBonuses = (
    layout: BoardLayout,
    layoutName: BoardId,
) => {
    for (const key of Object.keys(layout.nodeStats)) {
        const [row, column] = key.split(",").map(Number)
        const kind = layout.grid[row]?.[column]
        const appearance =
            kind === "#" ? layout.mainNode : layout.specialNodes[kind ?? ""]
        if (appearance?.type !== "basic" && appearance?.type !== "special") {
            throw new Error(
                `Invalid stat at ${layoutName} ${key} in layouts.ts: that position is ${describeNode(kind, "stat node")}. Only stat nodes can have a stat.`,
            )
        }
    }

    for (const key of Object.keys(layout.specialNodeBonuses)) {
        const [row, column] = key.split(",").map(Number)
        const kind = layout.grid[row]?.[column]
        if (
            kind === undefined ||
            layout.specialNodes[kind]?.type !== "special"
        ) {
            throw new Error(
                `Invalid special node bonus at ${layoutName} ${key} in layouts.ts: that position is ${describeNode(kind, "special node")}. Only special nodes can have a special node bonus.`,
            )
        }
    }
}
