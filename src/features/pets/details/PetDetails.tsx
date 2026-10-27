import { Flex, Grid, Heading, Icon, IconButton, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { Term } from "@common/Term"
import { CategoryDot } from "@pets/CategoryDot"
import { MinimizeButton } from "@pets/MinimizeButton"
import { PetIcon } from "@pets/PetIcon"
import { PET_BOSSES } from "@pets/config/petBosses"
import { PET_CATEGORY_NAMES } from "@pets/config/petCategories"
import type { PetMapId } from "@pets/config/petMaps"
import type { Pet } from "@pets/data/petAtlas"
import type { PetMapSource } from "@pets/logic/petFinder"
import { getBossText, getNoSpawnText } from "@pets/logic/petLabels"
import { LuX } from "react-icons/lu"
import { BossSource } from "./BossSource"
import { MapSourceList } from "./MapSourceList"
import { LevelPicker } from "./LevelPicker"

type PetDetailsProps = {
    pet: Pet
    sources: PetMapSource[]
    mapId: PetMapId
    // 0 is locked; 1-3 are Pet Insight levels.
    level: number
    focusedSpot: string | null
    onMapChange: (mapId: PetMapId) => void
    onSpotSelect: (mapId: PetMapId, spot: string) => void
    onLevelChange: (petId: number, level: number) => void
    onMinimize: () => void
    onClose: () => void
}

export const PetDetails = ({
    pet,
    sources,
    mapId,
    level,
    focusedSpot,
    onMapChange,
    onSpotSelect,
    onLevelChange,
    onMinimize,
    onClose,
}: PetDetailsProps) => {
    const handleLevelChange = (value: number) => {
        onLevelChange(pet.id, value)
    }

    const bossText = getBossText(pet)
    const summary =
        pet.source === "field"
            ? [
                  sources.length === 1
                      ? "Spawns on 1 map"
                      : `Spawns on ${sources.length} maps, most first`,
                  bossText,
              ]
                  .filter(Boolean)
                  .join(" · ")
            : getNoSpawnText(pet)

    const boss = PET_BOSSES[pet.id]

    return (
        <Card gap="4">
            <Flex flexWrap="wrap" alignItems="flex-start" gap="3">
                <PetIcon pet={pet} size="14" />

                <Flex minW="0" flex="1" flexDir="column" gap="1">
                    <Heading size="md">{pet.name}</Heading>

                    <Flex alignItems="center" gap="2">
                        <CategoryDot category={pet.category} />

                        <Text textStyle="hint">
                            {PET_CATEGORY_NAMES[pet.category]} · {summary}
                        </Text>
                    </Flex>
                </Flex>

                <LevelPicker value={level} onChange={handleLevelChange} />

                <MinimizeButton onClick={onMinimize} />

                <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Close pet"
                    onClick={onClose}
                >
                    <Icon boxSize="4">
                        <LuX />
                    </Icon>
                </IconButton>
            </Flex>

            {sources.length > 0 ? (
                <Grid
                    templateColumns={{
                        base: "1fr",
                        md: `repeat(${Math.min(sources.length, 3)}, 1fr)`,
                    }}
                    gap="3"
                >
                    <MapSourceList
                        sources={sources}
                        mapId={mapId}
                        focusedSpot={focusedSpot}
                        onSelect={onMapChange}
                        onSpotSelect={onSpotSelect}
                    />
                </Grid>
            ) : (
                !boss && (
                    <Text textStyle="hint">
                        {pet.source === "field" ? (
                            "Its soul monsters have no tracked spawns on these maps yet."
                        ) : (
                            <>
                                Check the pet's <Term>Source</Term> tab in the
                                in-game Pets menu for where to get it.
                            </>
                        )}
                    </Text>
                )
            )}

            {boss && <BossSource boss={boss} field={pet.source === "field"} />}
        </Card>
    )
}
