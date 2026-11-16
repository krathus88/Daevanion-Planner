import { Badge, Flex, Text } from "@chakra-ui/react"
import type { SourceMonster } from "@pets/logic/petFinder"

const RANK_NAMES: Record<SourceMonster["rank"], string | null> = {
    normal: null,
    elite: "Elite",
    hero: "Hero",
}

// A field boss says so in place of its rank.
const getBadgeText = (monster: SourceMonster) => {
    return monster.fieldBoss ? "Field boss" : RANK_NAMES[monster.rank]
}

type SourceMonsterRowsProps = {
    monsters: SourceMonster[]
}

// Monsters can share a name, even at the same level and rank, so the key
// takes the row's place too.
export const SourceMonsterRows = ({ monsters }: SourceMonsterRowsProps) => {
    return monsters.map((monster, index) => (
        <Flex
            key={`${index}:${monster.name}`}
            alignItems="baseline"
            gap="2"
            fontSize="sm"
        >
            <Text flex="1" truncate>
                {monster.name}{" "}
                <Text as="span" color="app.subtle" fontSize="xs">
                    Lv{monster.level}
                </Text>
            </Text>

            {getBadgeText(monster) && (
                <Badge size="xs" variant="subtle" colorPalette="orange">
                    {getBadgeText(monster)}
                </Badge>
            )}

            <Text color="app.muted" fontVariantNumeric="tabular-nums">
                {monster.count}
            </Text>
        </Flex>
    ))
}
