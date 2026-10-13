import AssassinPreset from "./classes/Assassin"
import ChanterPreset from "./classes/Chanter"
import ClericPreset from "./classes/Cleric"
import GladiatorPreset from "./classes/Gladiator"
import RangerPreset from "./classes/Ranger"
import SorcererPreset from "./classes/Sorcerer"
import SpiritMasterPreset from "./classes/SpiritMaster"
import TemplarPreset from "./classes/Templar"
import type { ClassPreset } from "./types"

// Types and defineClassPreset live in ./types so class files can import them
// without a circular import through this index.
export * from "./types"

export const classPresets: Record<string, ClassPreset> = {
    templar: TemplarPreset,
    gladiator: GladiatorPreset,
    assassin: AssassinPreset,
    ranger: RangerPreset,
    sorcerer: SorcererPreset,
    "spirit-master": SpiritMasterPreset,
    chanter: ChanterPreset,
    cleric: ClericPreset,
}

export const DEFAULT_CLASS_ID = "gladiator"

export const isClassId = (classId: string) =>
    Object.hasOwn(classPresets, classId)
