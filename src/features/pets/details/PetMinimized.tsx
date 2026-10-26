import { Flex, Icon, IconButton, Text } from "@chakra-ui/react"
import { CategoryDot } from "@pets/CategoryDot"
import { LevelBadge } from "@pets/LevelBadge"
import { MinimizedBar } from "@pets/MinimizedBar"
import { PetIcon } from "@pets/PetIcon"
import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { Pet } from "@pets/data/petAtlas"
import type { PetMapSource } from "@pets/logic/petFinder"
import { getNoSpawnText } from "@pets/logic/petLabels"
import { LuX } from "react-icons/lu"

type PetMinimizedProps = {
    pet: Pet
    // The open map's spawns of this pet; missing when it has none there.
    source?: PetMapSource
    mapId: PetMapId
    // 0 is locked; 1-3 are Pet Insight levels.
    level: number
    focusedSpot: string | null
    onExpand: () => void
    onClose: () => void
}

// "Black Armor Bee Lv13/17 · Stripe Bee Lv27": one entry per monster name.
const describeMonsters = (source: PetMapSource) => {
    const levels = new Map<string, number[]>()

    for (const monster of source.monsters) {
        levels.set(monster.name, [
            ...(levels.get(monster.name) ?? []),
            monster.level,
        ])
    }

    return [...levels]
        .map(([name, monsterLevels]) => {
            return `${name} Lv${monsterLevels.sort((a, b) => a - b).join("/")}`
        })
        .join(" · ")
}

export const PetMinimized = ({
    pet,
    source,
    mapId,
    level,
    focusedSpot,
    onExpand,
    onClose,
}: PetMinimizedProps) => {
    // The focused spot, or the pet's best one on this map.
    const focused = source?.spots.find((item) => item.name === focusedSpot)
    const best = source?.spots[0]
    const spotText = focused
        ? `${focused.name} ${focused.count}`
        : best
          ? `Best spot: ${best.name} ${best.count}`
          : null
    const where = source
        ? [`${PET_MAPS[mapId].name} · ${source.count} spawns`, spotText]
              .filter(Boolean)
              .join(" · ")
        : pet.source === "field"
          ? `No spawns in ${PET_MAPS[mapId].name}`
          : getNoSpawnText(pet)

    return (
        <MinimizedBar
            media={<PetIcon pet={pet} size="10" />}
            actions={
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
            }
            onExpand={onExpand}
        >
            <Flex minW="0" alignItems="center" gap="2">
                <CategoryDot category={pet.category} />

                <Text fontWeight="semibold" truncate>
                    {pet.name}
                </Text>

                {level > 0 && <LevelBadge level={level} />}

                <Text textStyle="caption" truncate>
                    {where}
                </Text>
            </Flex>

            {source && (
                <Text textStyle="caption" truncate>
                    {describeMonsters(source)}
                </Text>
            )}
        </MinimizedBar>
    )
}
