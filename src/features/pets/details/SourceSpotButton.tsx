import { chakra, Flex, Text } from "@chakra-ui/react"
import type { SpotCount } from "@pets/logic/petFinder"
import type { MouseEvent } from "react"

type SourceSpotButtonProps = {
    spot: SpotCount
    selected: boolean
    onSelect: (spot: string) => void
}

export const SourceSpotButton = ({
    spot,
    selected,
    onSelect,
}: SourceSpotButtonProps) => {
    // The card behind it picks the map, which would clear the spot again.
    const handleClick = (event: MouseEvent) => {
        event.stopPropagation()
        onSelect(spot.name)
    }

    // The monsters to kill there: "Ridge Skyray Lv27", or "Starturtle Lv37
    // ×9 · Starturtle Lv49 ×4" when several share the spot.
    const monsterText = spot.monsters
        .map((monster) => {
            const name = `${monster.name} Lv${monster.level}`

            return spot.monsters.length === 1
                ? name
                : `${name} ×${monster.count}`
        })
        .join(" · ")

    // Hover is gold, not grey: it has to show on a card's own hover fill.
    return (
        <chakra.button
            mx="-1.5"
            px="1.5"
            py="0.5"
            display="flex"
            alignItems="baseline"
            gap="2"
            borderRadius="sm"
            bg={selected ? "app.accentMuted" : undefined}
            color={selected ? "app.accentHover" : undefined}
            fontSize="sm"
            textAlign="left"
            cursor="button"
            _hover={{ bg: "app.accentMuted", color: "app.accentHover" }}
            type="button"
            aria-pressed={selected}
            onClick={handleClick}
        >
            <Flex minW="0" flex="1" flexDir="column">
                <Text truncate>{spot.name}</Text>

                <Text color="app.muted" fontSize="xs">
                    {monsterText}
                </Text>

                {spot.area && (
                    <Text textStyle="caption" truncate>
                        {spot.area}
                    </Text>
                )}
            </Flex>

            <Text color="app.muted" fontVariantNumeric="tabular-nums">
                {spot.count}
            </Text>
        </chakra.button>
    )
}
