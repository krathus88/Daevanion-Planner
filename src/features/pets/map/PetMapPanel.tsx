import { Flex, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import type { PetMapId } from "@pets/config/petMaps"
import type { PetPin } from "@pets/logic/petFinder"
import { MapTabs } from "./MapTabs"
import { PetMap } from "./PetMap"

type PetMapPanelProps = {
    mapId: PetMapId
    pins: PetPin[]
    focusPins: PetPin[]
    focusKey: string
    counts: Partial<Record<PetMapId, number>>
    selectedPetId?: number
    onMapChange: (mapId: PetMapId) => void
    onPinSelect: (petId: number) => void
}

export const PetMapPanel = ({
    mapId,
    pins,
    focusPins,
    focusKey,
    counts,
    selectedPetId,
    onMapChange,
    onPinSelect,
}: PetMapPanelProps) => {
    return (
        <Card>
            <Flex
                flexWrap="wrap"
                alignItems="center"
                justifyContent="space-between"
                gap="3"
            >
                <MapTabs value={mapId} counts={counts} onChange={onMapChange} />

                <Text textStyle="caption">
                    {selectedPetId === undefined
                        ? "Click a pin to pick its pet. Scroll to zoom."
                        : "Hover a pin for its monster and area."}
                </Text>
            </Flex>

            <PetMap
                mapId={mapId}
                pins={pins}
                focusPins={focusPins}
                focusKey={focusKey}
                selectedPetId={selectedPetId}
                onPinSelect={onPinSelect}
            />
        </Card>
    )
}
