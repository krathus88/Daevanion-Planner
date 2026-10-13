import ChanterPreset from "./classes/Chanter"
import GladiatorPreset from "./classes/Gladiator"
import type { ClassPreset } from "./types"

// Types and defineClassPreset live in ./types so class files can import them
// without a circular import through this index.
export * from "./types"

export const classPresets: Record<string, ClassPreset> = {
    gladiator: GladiatorPreset,

    chanter: ChanterPreset,
}

export const DEFAULT_CLASS_ID = "gladiator"

export const isClassId = (classId: string) =>
    Object.hasOwn(classPresets, classId)
