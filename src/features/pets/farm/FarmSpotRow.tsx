import { Button, chakra, Flex, Text } from "@chakra-ui/react"
import type { FarmSpot } from "@pets/logic/farmSpots"
import { useState } from "react"
import { FarmPetList } from "./FarmPetList"

// Pets shown before "+N more"; the most spawns come first.
const SHORT_LIST = 8

type FarmSpotRowProps = {
    spot: FarmSpot
    rank: number
    selected: boolean
    // Null clears the focus (clicking the focused spot again).
    onFocus: (spot: string | null) => void
    onPetSelect: (petId: number) => void
}

export const FarmSpotRow = ({
    spot,
    rank,
    selected,
    onFocus,
    onPetSelect,
}: FarmSpotRowProps) => {
    const [expanded, setExpanded] = useState(false)

    const handleClick = () => {
        onFocus(selected ? null : spot.name)
    }

    const handleExpandToggle = () => {
        setExpanded(!expanded)
    }

    const hidden = spot.pets.length - SHORT_LIST
    const shownPets = expanded ? spot.pets : spot.pets.slice(0, SHORT_LIST)
    const levels =
        spot.minLevel === spot.maxLevel
            ? `Lv${spot.minLevel}`
            : `Lv${spot.minLevel}-${spot.maxLevel}`

    // A spot that isn't focused gets a lighter fill than the panel, not just
    // an outline, like the pet's map cards.
    return (
        <Flex
            p="2"
            flexDir="column"
            gap="2"
            layerStyle={selected ? "listItemActive" : "listItem"}
            bg={selected ? undefined : "app.hover"}
            _hover={selected ? undefined : { borderColor: "app.borderStrong" }}
        >
            <chakra.button
                px="1"
                display="flex"
                flexDir="column"
                alignItems="stretch"
                gap="0.5"
                borderRadius="sm"
                textAlign="left"
                cursor="button"
                _hover={{ color: "app.accentHover" }}
                type="button"
                aria-pressed={selected}
                onClick={handleClick}
            >
                <Flex alignItems="baseline" gap="2">
                    <Text color="app.subtle" fontSize="xs">
                        #{rank}
                    </Text>

                    <Text fontSize="sm" fontWeight="semibold" truncate>
                        {spot.name}
                    </Text>

                    {spot.area && (
                        <Text color="app.subtle" fontSize="xs" truncate>
                            {spot.area}
                        </Text>
                    )}
                </Flex>

                <Text textStyle="caption">
                    {spot.pets.length} {spot.pets.length === 1 ? "pet" : "pets"}{" "}
                    · {spot.spawns} spawns · {levels}
                </Text>
            </chakra.button>

            <Flex flexWrap="wrap" gap="1">
                <FarmPetList pets={shownPets} onSelect={onPetSelect} />

                {hidden > 0 && (
                    <Button
                        variant="ghost"
                        size="2xs"
                        onClick={handleExpandToggle}
                    >
                        {expanded ? "Show fewer" : `+${hidden} more`}
                    </Button>
                )}
            </Flex>
        </Flex>
    )
}
