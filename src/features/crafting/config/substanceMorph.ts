// Substance Morph turns Odyle into these materials 1 for 1, for nothing else,
// each rank of Odyle into the same rank of material (told by the user). The
// Asmodian counterparts (Asvata, Morfa, Ohkra, Raydam, Conide, Pujery) are
// assumed to work the same. By item id.
const MORPHS: { odyle: number; materials: number[] }[] = [
    {
        // Odyle
        odyle: 610610013,
        materials: [
            610620013, // Orichalcum Ore
            610660025, // Sapphire Gemstone
            610660026, // Diamond Gemstone
            610660027, // Ruby Gemstone
            610650011, // Yggdrasil Log
            610650012, // Asvata Log
            610670041, // Aria
            610670042, // Targena
            610680043, // Coriolus
            610680044, // Kukuru
            610680045, // Mela
            610680047, // Inina
            610680048, // Cypri
            610680049, // Morfa
            610680050, // Ohkra
            610680051, // Raydam
            610680053, // Conide
            610680054, // Pujery
        ],
    },
    {
        // Fine Odyle
        odyle: 610610014,
        materials: [
            610620014, // Fine Orichalcum Ore
            610660028, // Fine Sapphire Gemstone
            610660029, // Fine Diamond Gemstone
            610660030, // Fine Ruby Gemstone
            610650013, // Fine Yggdrasil Log
            610650014, // Fine Asvata Log
            610670045, // Fresh Aria
            610670046, // Fresh Targena
        ],
    },
    {
        // Pure Odyle
        odyle: 610610015,
        materials: [
            610620015, // Pure Orichalcum Ore
            610660031, // Pure Sapphire Gemstone
            610660032, // Pure Diamond Gemstone
            610660033, // Pure Ruby Gemstone
            610650015, // Pure Yggdrasil Log
            610650016, // Pure Asvata Log
        ],
    },
    {
        // Radiant Odyle
        odyle: 610610016,
        materials: [
            610620016, // Radiant Orichalcum Ore
            610660034, // Radiant Sapphire Gemstone
            610660035, // Radiant Diamond Gemstone
            610660036, // Radiant Ruby Gemstone
            610650017, // Radiant Yggdrasil Log
            610650018, // Radiant Asvata Log
        ],
    },
]

const MORPH_SOURCES = new Map<number, number>()

for (const morph of MORPHS) {
    for (const id of morph.materials) {
        MORPH_SOURCES.set(id, morph.odyle)
    }
}

// The Odyle a material can be morphed from, if any.
export const getMorphSource = (id: number) => {
    return MORPH_SOURCES.get(id)
}
