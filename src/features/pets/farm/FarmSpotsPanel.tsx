import { Button, Flex, Grid, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { Term } from "@common/Term"
import { MinimizeButton } from "@pets/MinimizeButton"
import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { FarmSpot } from "@pets/logic/farmSpots"
import { useState } from "react"
import { FarmSpotList } from "./FarmSpotList"

const SHORT_LIST = 4

type FarmSpotsPanelProps = {
    spots: FarmSpot[]
    mapId: PetMapId
    focusedSpot: string | null
    onSpotFocus: (spot: string | null) => void
    onPetSelect: (petId: number) => void
    onMinimize: () => void
}

export const FarmSpotsPanel = ({
    spots,
    mapId,
    focusedSpot,
    onSpotFocus,
    onPetSelect,
    onMinimize,
}: FarmSpotsPanelProps) => {
    const [expanded, setExpanded] = useState(false)

    const handleExpandToggle = () => {
        setExpanded(!expanded)
    }

    const mapName = PET_MAPS[mapId].name
    const hasSpotNames = spots.length > 0 || mapId !== "reshanta"
    const shown = expanded ? spots : spots.slice(0, SHORT_LIST)

    return (
        <Card>
            <Flex flexDir="column" gap="1">
                <Flex alignItems="flex-start" gap="2">
                    <Text flex="1" fontWeight="semibold">
                        Best spots in {mapName} for pets you haven't unlocked
                    </Text>

                    <MinimizeButton onClick={onMinimize} />
                </Flex>

                <Text textStyle="hint">
                    Ranked by how many pets from your list, still marked{" "}
                    <Term>Locked</Term>, spawn in each spot. Click a spot to
                    show only its pins on the map, or a pet to open it. Switch
                    maps with the <Term>map tabs</Term> below.
                </Text>
            </Flex>

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
                        onSpotFocus={onSpotFocus}
                        onPetSelect={onPetSelect}
                    />
                </Grid>
            ) : (
                <Text color="app.muted" fontSize="sm">
                    {hasSpotNames
                        ? `Every pet in your list that spawns in ${mapName} is unlocked.`
                        : `${mapName} has no named spots; use the map below.`}
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
