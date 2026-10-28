import { Button, Flex, Grid, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { Term } from "@common/Term"
import { MinimizeButton } from "@pets/MinimizeButton"
import {
    PET_CATEGORY_NAMES,
    type PetCategoryId,
} from "@pets/config/petCategories"
import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { FarmSpot } from "@pets/logic/farmSpots"
import { useState } from "react"
import { FarmSpotList } from "./FarmSpotList"
import { RequiredCategoryFilter } from "./RequiredCategoryFilter"

const SHORT_LIST = 4

type FarmSpotsPanelProps = {
    spots: FarmSpot[]
    mapId: PetMapId
    focusedSpot: string | null
    levels: Record<string, number>
    // Types every listed spot must still have a pet of.
    requiredCategories: PetCategoryId[]
    onSpotFocus: (spot: string | null) => void
    onRequiredChange: (category: PetCategoryId, required: boolean) => void
    onPetSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
    onMinimize: () => void
}

export const FarmSpotsPanel = ({
    spots,
    mapId,
    focusedSpot,
    levels,
    requiredCategories,
    onSpotFocus,
    onRequiredChange,
    onPetSelect,
    onLevelChange,
    onMinimize,
}: FarmSpotsPanelProps) => {
    const [expanded, setExpanded] = useState(false)

    const handleExpandToggle = () => {
        setExpanded(!expanded)
    }

    const mapName = PET_MAPS[mapId].name
    const hasSpotNames = spots.length > 0 || mapId !== "reshanta"
    const shown = expanded ? spots : spots.slice(0, SHORT_LIST)
    const requiredNames = requiredCategories
        .map((category) => PET_CATEGORY_NAMES[category])
        .join(", ")
    const emptyText =
        requiredCategories.length > 0
            ? `No spot in ${mapName} still has a pet below Lv3 of every type picked (${requiredNames}).`
            : hasSpotNames
              ? `Every pet in your list that spawns in ${mapName} is at Lv3.`
              : `${mapName} has no named spots; use the map below.`

    return (
        <Card>
            <Flex flexDir="column" gap="1">
                <Flex alignItems="flex-start" gap="2">
                    <Text flex="1" fontWeight="semibold">
                        Best spots in {mapName} for pets below Lv3
                    </Text>

                    <MinimizeButton onClick={onMinimize} />
                </Flex>

                <Text textStyle="hint">
                    Ranked by how many pets from your list, not yet at{" "}
                    <Term>Lv3</Term>, spawn in each spot. Click a spot to show
                    only its pins on the map, or a pet to open it. In a picked
                    spot, hover or right-click a pet to set its level. Switch
                    maps with the <Term>map tabs</Term> below.
                </Text>
            </Flex>

            <RequiredCategoryFilter
                value={requiredCategories}
                onChange={onRequiredChange}
            />

            {spots.length > 0 ? (
                <Grid
                    templateColumns={{
                        base: "minmax(0, 1fr)",
                        md: "repeat(2, minmax(0, 1fr))",
                    }}
                    alignItems="start"
                    gap="2"
                >
                    <FarmSpotList
                        spots={shown}
                        focusedSpot={focusedSpot}
                        levels={levels}
                        requiredCategories={requiredCategories}
                        onSpotFocus={onSpotFocus}
                        onPetSelect={onPetSelect}
                        onLevelChange={onLevelChange}
                    />
                </Grid>
            ) : (
                <Text color="app.muted" fontSize="sm">
                    {emptyText}
                </Text>
            )}

            {spots.length > SHORT_LIST && (
                <Button
                    variant="ghost"
                    size="xs"
                    alignSelf="flex-start"
                    onClick={handleExpandToggle}
                >
                    {expanded ? "Show fewer" : `Show all ${spots.length} spots`}
                </Button>
            )}
        </Card>
    )
}
