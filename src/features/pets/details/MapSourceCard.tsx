import { Badge, chakra, Flex, Text } from "@chakra-ui/react"
import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { PetMapSource } from "@pets/logic/petFinder"
import { SourceSpotList } from "./SourceSpotList"
import { SourceMonsterRows } from "./SourceMonsterRows"

const TOP_SPOTS = 3

type MapSourceCardProps = {
    source: PetMapSource
    best: boolean
    selected: boolean
    // Spot the map is zoomed to, when this card's map is open.
    focusedSpot: string | null
    onSelect: (mapId: PetMapId) => void
    onSpotSelect: (mapId: PetMapId, spot: string) => void
}

export const MapSourceCard = ({
    source,
    best,
    selected,
    focusedSpot,
    onSelect,
    onSpotSelect,
}: MapSourceCardProps) => {
    const handleClick = () => {
        onSelect(source.mapId)
    }

    const handleSpotSelect = (spot: string) => {
        onSpotSelect(source.mapId, spot)
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
                <Flex flexDir="column" gap="0.5">
                    <Text mb="0.5" textStyle="label">
                        Best spots
                    </Text>

                    <SourceSpotList
                        spots={source.spots.slice(0, TOP_SPOTS)}
                        focusedSpot={selected ? focusedSpot : null}
                        onSelect={handleSpotSelect}
                    />
                </Flex>
            )}

            <Flex flexDir="column" gap="1">
                <Text textStyle="label">Soul monsters</Text>

                <SourceMonsterRows monsters={source.monsters} />
            </Flex>
        </Flex>
    )
}
