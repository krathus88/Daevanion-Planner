// NCSOFT's crafting probability table names recipes only in Korean. This
// turns a Korean name into the Global client's English one, so its chances
// can be stored on our recipe. Gear names are built from parts; the rest are
// listed whole. Names that translate to nothing are KR-only recipes.

// Gear: [tier] [line or material] [piece].
const GEAR_TIERS: Record<string, string> = {
    "": "",
    "장인의 ": "Expert's ",
    "달인의 ": "Artisan's ",
}

// The Dragon Lord line crafted in the Global client, per faction (the KR
// lines pair up by position: 응/기, 진/건, … with matching chances).
const GEAR_LINES: Record<string, string> = {
    진룡왕의: "True Dragon Lord",
    건룡왕의: "Star Dragon Lord",
    오리하르콘: "Orichalcum",
    이그드라실: "Yggdrasil",
    아스바타: "Asvata",
    루비: "Ruby",
    다이아몬드: "Diamond",
    사파이어: "Sapphire",
    진실의: "Truth",
}

const GEAR_PIECES: Record<string, string> = {
    장검: "Longsword",
    대검: "Greatsword",
    단검: "Dagger",
    전곤: "Mace",
    가더: "Guard",
    활: "Bow",
    법봉: "Staff",
    목걸이: "Necklace",
    귀걸이: "Earrings",
    반지: "Ring",
    마법서: "Spellbook",
    보주: "Orb",
    흉갑: "Breastplate",
    각반: "Greaves",
    투구: "Helm",
    견갑: "Pauldrons",
    장갑: "Gloves",
    장화: "Boots",
    망토: "Cloak",
}

const WHOLE_NAMES: Record<string, string> = {
    // Materials
    "오리하르콘 주괴": "Orichalcum Ingot",
    "제련된 두꺼운 용족의 뿔": "Fine Thick Balaur Horn",
    "제련된 단단한 용족의 뿔": "Fine Hard Balaur Horn",
    "제련된 견고한 용족의 뿔": "Fine Durable Balaur Horn",
    "강화된 두꺼운 용족의 비늘": "Enhanced Thick Balaur Scale",
    "강화된 단단한 용족의 비늘": "Enhanced Hard Balaur Scale",
    "강화된 견고한 용족의 비늘": "Enhanced Durable Balaur Scale",
    "무두질된 두꺼운 용족의 가죽": "Tanned Thick Balaur Leather",
    "무두질된 단단한 용족의 가죽": "Tanned Hard Balaur Leather",
    "무두질된 견고한 용족의 가죽": "Tanned Durable Balaur Leather",
    "튼튼한 가죽": "Strong Leather",
    "이그드라실 목재": "Yggdrasil Wood",
    "아스바타 목재": "Asvata Wood",
    "이그드라실 종이": "Yggdrasil Paper",
    "아스바타 종이": "Asvata Paper",
    "마력의 결정": "Magic Crystal",
    "사파이어 장식": "Sapphire Decoration",
    "다이아몬드 장식": "Diamond Decoration",
    "루비 장식": "Ruby Decoration",
    "사파이어 가루": "Sapphire Powder",
    "다이아몬드 가루": "Diamond Powder",
    "루비 가루": "Ruby Powder",
    "정령석 가루": "Spiritstone Powder",
    // Bracelets
    "순례자의 팔찌": "Pilgrim Bracelet",
    "산들바람의 팔찌": "Wind Breeze Bracelet",
    "새벽의 팔찌": "Dawn Bracelet",
    "해방자의 팔찌": "Liberator Bracelet",
    "쫓는 자의 팔찌": "Chaser Bracelet",
    "옛 용병단장의 팔찌": "Old Mercenary Commander Bracelet",
    // Alchemy
    "생명의 비약 (각인)": "Life Serum (Bound)",
    "바람의 비약": "Wind Serum",
    "상급 생명의 비약": "Superior Life Serum",
    "상급 바람의 비약": "Superior Wind Serum",
    "상급 생명의 물약": "Superior Life Potion",
    "정신의 물약": "Mana Potion",
    "상급 치유 물약": "Superior Healing Potion",
    "상급 질주의 주문서": "Superior Speed Scroll",
    "상급 용기의 주문서": "Superior Courage Scroll",
    "상급 가호의 주문서": "Superior Benediction Scroll",
    "상태이상 저항 주문서": "Status Effect Resist Scroll",
    "중급 마석": "Intermediate Manastone",
    "상급 마석": "Superior Manastone",
    "중급 심연의 마석": "Intermediate Abyssal Manastone",
    "중급 영석": "Intermediate Soulstone",
    "상급 영석": "Superior Soulstone",
    "중급 심연의 영석": "Intermediate Abyssal Soulstone",
    // Cooking, Elyos
    "백룡의 과일 주스": "White Dragon's Fruit Juice",
    "백룡의 허브 차": "White Dragon's Herb Tea",
    "멜라 주스": "Mela Juice",
    "코리올루스 차": "Coriolus Tea",
    "달인의 멜라 주스": "Artisan's Mela Juice",
    "달인의 코리올루스 차": "Artisan's Coriolus Tea",
    "백룡의 찹스테이크": "White Dragon's Chopped Steak",
    "백룡의 비프 웰링턴": "White Dragon's Beef Wellington",
    "백룡의 씨푸드 파스타": "White Dragon's Seafood Pasta",
    "킬리 찜": "Steamed Cypri",
    "쉐리 파스타": "Inina Pasta",
    "쿠쿠르 고기 튀김": "Kukuru Fried Meat",
    "킬리 구이": "Grilled Cypri",
    "달인의 킬리 찜": "Artisan's Steamed Cypri",
    "달인의 쉐리 파스타": "Artisan's Inina Pasta",
    "달인의 쿠쿠르 고기 튀김": "Artisan's Kukuru Fried Meat",
    "달인의 킬리 구이": "Artisan's Grilled Cypri",
    // Cooking, both
    "카레 고기 볶음": "Curry Meat Stirfry",
    "후르츠 샐러드": "Fruit Salad",
    "달인의 카레 고기 볶음": "Artisan's Curry Meat Stirfry",
    "달인의 후르츠 샐러드": "Artisan's Fruit Salad",
    // Cooking, Asmodian
    "흑룡의 과일 주스": "Dark Dragon's Fruit Juice",
    "흑룡의 허브 차": "Dark Dragon's Herb Tea",
    "레이담 주스": "Raydam Juice",
    "모르파 차": "Morfa Tea",
    "달인의 레이담 주스": "Artisan's Raydam Juice",
    "달인의 모르파 차": "Artisan's Morfa Tea",
    "흑룡의 찹스테이크": "Dark Dragon's Chopped Steak",
    "흑룡의 비프 웰링턴": "Dark Dragon's Beef Wellington",
    "흑룡의 씨푸드 파스타": "Dark Dragon's Seafood Pasta",
    "푸제리 찜": "Steamed Pujery",
    "코니데 파스타": "Conide Pasta",
    "오크라 고기 튀김": "Ohkra Fried Meat",
    "푸제리 구이": "Grilled Pujery",
    "달인의 푸제리 찜": "Artisan's Steamed Pujery",
    "달인의 코니데 파스타": "Artisan's Conide Pasta",
    "달인의 오크라 고기 튀김": "Artisan's Ohkra Fried Meat",
    "달인의 푸제리 구이": "Artisan's Grilled Pujery",
}

// The English name, or null for a name with no Global counterpart.
export const translateChanceName = (korean: string) => {
    const whole = WHOLE_NAMES[korean]

    if (whole) {
        return whole
    }

    for (const [tierKo, tierEn] of Object.entries(GEAR_TIERS)) {
        if (tierKo && !korean.startsWith(tierKo)) {
            continue
        }

        const [line, piece, ...rest] = korean.slice(tierKo.length).split(" ")

        if (rest.length === 0 && GEAR_LINES[line] && GEAR_PIECES[piece]) {
            return `${tierEn}${GEAR_LINES[line]} ${GEAR_PIECES[piece]}`
        }
    }

    return null
}
