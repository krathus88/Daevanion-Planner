import type { ClassId } from "./classInfo"
import type { ClassPreset } from "./types"

// Types live in ./types to avoid a circular import.
export * from "./classInfo"
export * from "./types"

const classPresetLoaders = {
    templar: () => import("./classes/Templar"),
    gladiator: () => import("./classes/Gladiator"),
    assassin: () => import("./classes/Assassin"),
    ranger: () => import("./classes/Ranger"),
    sorcerer: () => import("./classes/Sorcerer"),
    "spirit-master": () => import("./classes/SpiritMaster"),
    chanter: () => import("./classes/Chanter"),
    cleric: () => import("./classes/Cleric"),
} satisfies Record<ClassId, () => Promise<{ default: ClassPreset }>>

export const loadClassPreset = async (
    classId: ClassId,
): Promise<ClassPreset> => {
    const module = await classPresetLoaders[classId]()

    return module.default
}
