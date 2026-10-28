import { Badge, Box, chakra, Flex, Text } from "@chakra-ui/react"
import { Section } from "@common/Section"
import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { PetMapSource } from "@pets/logic/petFinder"
import type { SpotNeighbors } from "@pets/logic/spotNeighbors"
import type { MouseEvent } from "react"
import { SourceSpotList } from "./SourceSpotList"
import { SourceMonsterRows } from "./SourceMonsterRows"

const TOP_SPOTS = 3

type MapSourceCardProps = {
    source: PetMapSource
    neighbors: SpotNeighbors
    best: boolean
    selected: boolean
    // Spot the map is zoomed to, when this card's map is open.
    focusedSpot: string | null
    showOthers: boolean
    levels: Record<string, number>
    onSelect: (mapId: PetMapId) => void
    onSpotSelect: (mapId: PetMapId, spot: string, others: boolean) => void
    onPetSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

export const MapSourceCard = ({
    source,
    neighbors,
    best,
    selected,
    focusedSpot,
    showOthers,
    levels,
    onSelect,
    onSpotSelect,
    onPetSelect,
    onLevelChange,
}: MapSourceCardProps) => {
    const handleClick = () => {
        onSelect(source.mapId)
    }

    const handleSpotSelect = (spot: string, others: boolean) => {
        onSpotSelect(source.mapId, spot, others)
    }

    // Opening the monster list shouldn't also switch the map.
    const handleMonstersClick = (event: MouseEvent) => {
        event.stopPropagation()
    }

    // Buttons can't nest, so the card takes the clicks and its header is the
    // button keyboards reach; spot rows are buttons of their own. A card that
    // isn't open gets a lighter fill than the panel, not just an outline.
    return (
        <Flex
            p="3"
            flexDir="column"
            gap="3"
            layerStyle={selected ? "listItemActive" : "listItem"}
            bg={selected ? undefined : "app.hover"}
            cursor="button"
            _hover={selected ? undefined : { borderColor: "app.borderStrong" }}
            onClick={handleClick}
        >
            <chakra.button
                display="flex"
                alignItems="baseline"
                gap="2"
                borderRadius="sm"
                textAlign="left"
                cursor="button"
                type="button"
                aria-pressed={selected}
            >
                <Text fontWeight="semibold">{PET_MAPS[source.mapId].name}</Text>

                {best && (
                    <Badge size="sm" variant="subtle" colorPalette="yellow">
                        Most spawns
                    </Badge>
                )}

                <Text ml="auto" textStyle="stat">
                    {source.count}
                </Text>

                <Text textStyle="caption">spawns</Text>
            </chakra.button>

            {source.spots.length > 0 && (
                <Flex flexDir="column" gap="1.5">
                    <Text textStyle="label">Best spots</Text>

                    <SourceSpotList
                        spots={source.spots.slice(0, TOP_SPOTS)}
                        neighbors={neighbors}
                        focusedSpot={selected ? focusedSpot : null}
                        showOthers={showOthers}
                        levels={levels}
                        onSelect={handleSpotSelect}
                        onPetSelect={onPetSelect}
                        onLevelChange={onLevelChange}
                    />
                </Flex>
            )}

            <Box onClick={handleMonstersClick}>
                <Section
                    title="Soul monsters"
                    variant="sub"
                    count={source.monsters.length}
                >
                    <Flex flexDir="column" gap="1">
                        <SourceMonsterRows monsters={source.monsters} />
                    </Flex>
                </Section>
            </Box>
        </Flex>
    )
}
