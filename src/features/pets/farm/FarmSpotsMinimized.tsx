import { Flex, Text } from "@chakra-ui/react"
import { MinimizedBar } from "@pets/MinimizedBar"
import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { FarmSpot } from "@pets/logic/farmSpots"
import { FarmPetIconList } from "./FarmPetIconList"

type FarmSpotsMinimizedProps = {
    spots: FarmSpot[]
    mapId: PetMapId
    focusedSpot: string | null
    onExpand: () => void
    onPetSelect: (petId: number) => void
}

// A focused spot shows itself and its pets; otherwise the best spot.
export const FarmSpotsMinimized = ({
    spots,
    mapId,
    focusedSpot,
    onExpand,
    onPetSelect,
}: FarmSpotsMinimizedProps) => {
    const focusedIndex = spots.findIndex((spot) => spot.name === focusedSpot)
    const index = Math.max(focusedIndex, 0)
    const spot = spots[index]

    if (!spot) {
        return (
            <MinimizedBar onExpand={onExpand}>
                <Text fontWeight="semibold">
                    Best spots in {PET_MAPS[mapId].name}
                </Text>
            </MinimizedBar>
        )
    }

    const levels =
        spot.minLevel === spot.maxLevel
            ? `Lv${spot.minLevel}`
            : `Lv${spot.minLevel}-${spot.maxLevel}`
    const details = [
        spot.area ?? PET_MAPS[mapId].name,
        `${spot.pets.length} ${spot.pets.length === 1 ? "pet" : "pets"}`,
        `${spot.spawns} spawns`,
        levels,
    ].join(" · ")

    return (
        <MinimizedBar
            footer={
                <Flex flexWrap="wrap" gap="1">
                    <FarmPetIconList pets={spot.pets} onSelect={onPetSelect} />
                </Flex>
            }
            onExpand={onExpand}
        >
            <Flex minW="0" alignItems="baseline" gap="2">
                <Text color="app.subtle" fontSize="xs">
                    {focusedIndex < 0 ? "Best spot" : `#${index + 1}`}
                </Text>

                <Text fontWeight="semibold" truncate>
                    {spot.name}
                </Text>
            </Flex>

            <Text textStyle="caption" truncate>
                {details}
            </Text>
        </MinimizedBar>
    )
}
