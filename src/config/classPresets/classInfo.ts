import { Assassin } from "@assets/assassin"
import { Chanter } from "@assets/chanter"
import { Cleric } from "@assets/cleric"
import { Gladiator } from "@assets/gladiator"
import { Ranger } from "@assets/ranger"
import { Sorcerer } from "@assets/sorcerer"
import { SpiritMaster } from "@assets/spirit-master"
import { Templar } from "@assets/templar"

// What every page needs about a class without loading its abilities, which
// load per class (loadClassPreset). scripts/siteMeta.ts reads CLASS_NAMES
// from this file for the link previews, so keep one class per line.
export const CLASS_NAMES = {
    templar: "Templar",
    gladiator: "Gladiator",
    assassin: "Assassin",
    ranger: "Ranger",
    sorcerer: "Sorcerer",
    "spirit-master": "Spirit Master",
    chanter: "Chanter",
    cleric: "Cleric",
} as const

export type ClassId = keyof typeof CLASS_NAMES

export const CLASS_IDS = Object.keys(CLASS_NAMES) as ClassId[]

// Class emblems, also used as the page favicon.
export const CLASS_ICONS: Record<ClassId, string> = {
    templar: Templar,
    gladiator: Gladiator,
    assassin: Assassin,
    ranger: Ranger,
    sorcerer: Sorcerer,
    "spirit-master": SpiritMaster,
    chanter: Chanter,
    cleric: Cleric,
}

export const DEFAULT_CLASS_ID: ClassId = "gladiator"

export const isClassId = (classId: string): classId is ClassId => {
    return Object.hasOwn(CLASS_NAMES, classId)
}
