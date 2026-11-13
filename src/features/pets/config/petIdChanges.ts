// Pets the AION 2 Pet Atlas listed without a game id, under a placeholder
// (negative) id, until scripts/buildPetAtlas.ts took their real ids from
// gegebase (2026-11-13; Young Tog's 1122 also seen in a game recording).
// Saves and links made before keep working: their old ids read as the new
// ones. Never remove an entry.
export const PET_ID_CHANGES: Record<number, number> = {
    [-1001]: 1177, // Ancient Spirit
    [-1002]: 1044, // Aultross's Doppelganger
    [-1003]: 1057, // Coradon
    [-1004]: 1102, // Dried Up Forest Guardian
    [-1005]: 1032, // Elite Keneire
    [-1006]: 1190, // Elite Poisonous Spore Fungen
    [-1007]: 1182, // Elite Soulless Corpse Gnat
    [-1008]: 1043, // Elite Ursus
    [-1009]: 1191, // Furious Feruk
    [-1010]: 1146, // Gatekeeper Pinopi
    [-1011]: 1055, // Grave Rat
    [-1012]: 1009, // Kernon
    [-1013]: 1028, // Krao Mutant
    [-1014]: 1107, // Krao Seal Guardian
    [-1015]: 1068, // Krao Test Subject
    [-1016]: 1138, // Mumu Overseer
    [-1017]: 1145, // Mutated Insectoid Valka
    [-1018]: 1080, // Sentinel K'nash
    [-1019]: 1139, // Swamp Monster
    [-1020]: 1100, // Ultimate Earth Spirit
    [-1021]: 1090, // Ultimate Water Spirit
    [-1022]: 1079, // Ultimate Wind Spirit
    [-1023]: 1078, // Urugugu Brawler
    [-1024]: 1158, // Venomous Insect Sram
    [-1025]: 1122, // Young Tog
    [-1026]: 1001, // Black Dragon
    [-1027]: 1278, // Chonky Hamster
    [-1028]: 1204, // Pagati
    [-1029]: 1111, // Swift Lugi
    [-1030]: 1299, // Two
    [-1031]: 1112, // Wandering Merchant Lugi
    [-1032]: 1240, // White Bunny
}

// A pet id as it is now: an old placeholder id becomes the pet's real one.
export const getCurrentPetId = (id: number) => {
    return PET_ID_CHANGES[id] ?? id
}
