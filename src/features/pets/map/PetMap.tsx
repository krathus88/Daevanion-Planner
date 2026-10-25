import "leaflet/dist/leaflet.css"
import "./leafletTheme.css"
import { Box } from "@chakra-ui/react"
import type { PetMapId } from "@pets/config/petMaps"
import { usePetMap } from "@pets/hooks/usePetMap"
import type { PetPin } from "@pets/logic/petFinder"
import { useRef } from "react"

type PetMapProps = {
    mapId: PetMapId
    pins: PetPin[]
    focusPins: PetPin[]
    focusKey: string
    selectedPetId?: number
    onPinSelect: (petId: number) => void
}

export const PetMap = ({
    mapId,
    pins,
    focusPins,
    focusKey,
    selectedPetId,
    onPinSelect,
}: PetMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    usePetMap(
        containerRef,
        mapId,
        pins,
        focusPins,
        focusKey,
        selectedPetId !== undefined,
        onPinSelect,
    )

    return (
        <Box
            ref={containerRef}
            w="full"
            h="petMap"
            zIndex="base"
            borderColor="app.border"
            borderRadius="md"
            borderWidth="1px"
            aria-label="Pet spawn map"
        />
    )
}
