import { Flex } from "@chakra-ui/react"
import { FarmPetIconList } from "@pets/farm/FarmPetIconList"
import type { FarmSpotPet } from "@pets/logic/farmSpots"
import type { SpotCount } from "@pets/logic/petFinder"
import type { MouseEvent } from "react"
import { SourceOthersToggle } from "./SourceOthersToggle"
import { SourceSpotButton } from "./SourceSpotButton"

type SourceSpotRowProps = {
    spot: SpotCount
    // Other pets below Lv3 that spawn there.
    neighbors: FarmSpotPet[]
    selected: boolean
    // The focused spot also shows the neighbors' pins.
    showOthers: boolean
    levels: Record<string, number>
    onSelect: (spot: string, others: boolean) => void
    onPetSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

export const SourceSpotRow = ({
    spot,
    neighbors,
    selected,
    showOthers,
    levels,
    onSelect,
    onPetSelect,
    onLevelChange,
}: SourceSpotRowProps) => {
    // Just the open pet's pins.
    const handleSpotSelect = (name: string) => {
        onSelect(name, false)
    }

    const handleOthersClick = () => {
        onSelect(spot.name, true)
    }

    // The card behind it picks the map; its level picker sits in a portal,
    // whose clicks still bubble here.
    const handlePetsClick = (event: MouseEvent) => {
        event.stopPropagation()
    }

    return (
        <Flex flexDir="column" gap="1">
            <SourceSpotButton
                spot={spot}
                selected={selected}
                onSelect={handleSpotSelect}
            />

            {neighbors.length > 0 && (
                <Flex
                    flexWrap="wrap"
                    alignItems="center"
                    gap="1"
                    onClick={handlePetsClick}
                >
                    <SourceOthersToggle
                        active={selected && showOthers}
                        onClick={handleOthersClick}
                    />

                    <FarmPetIconList
                        pets={neighbors}
                        levels={levels}
                        focused={selected}
                        onSelect={onPetSelect}
                        onLevelChange={onLevelChange}
                    />
                </Flex>
            )}
        </Flex>
    )
}
