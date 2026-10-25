import { Badge, Flex, Text } from "@chakra-ui/react"
import type { SourceMonster } from "@pets/logic/petFinder"

const RANK_NAMES: Record<SourceMonster["rank"], string | null> = {
    normal: null,
    elite: "Elite",
    hero: "Hero",
}

type SourceMonsterRowsProps = {
    monsters: SourceMonster[]
}

export const SourceMonsterRows = ({ monsters }: SourceMonsterRowsProps) => {
    return monsters.map((monster) => (
        <Flex key={monster.name} alignItems="baseline" gap="2" fontSize="sm">
            <Text flex="1" truncate>
                {monster.name}{" "}
                <Text as="span" color="app.subtle" fontSize="xs">
                    Lv{monster.level}
                </Text>
            </Text>

            {RANK_NAMES[monster.rank] && (
                <Badge size="xs" variant="subtle" colorPalette="orange">
                    {RANK_NAMES[monster.rank]}
                </Badge>
            )}

            <Text color="app.muted" fontVariantNumeric="tabular-nums">
                {monster.count}
            </Text>
        </Flex>
    ))
}
