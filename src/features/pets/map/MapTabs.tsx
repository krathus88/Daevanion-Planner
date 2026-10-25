import { SegmentGroup } from "@chakra-ui/react"
import {
    isPetMapId,
    PET_MAP_IDS,
    PET_MAPS,
    type PetMapId,
} from "@pets/config/petMaps"

type MapTabsProps = {
    value: PetMapId
    counts: Partial<Record<PetMapId, number>>
    onChange: (value: PetMapId) => void
}

export const MapTabs = ({ value, counts, onChange }: MapTabsProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        if (isPetMapId(details.value)) {
            onChange(details.value)
        }
    }

    const items = PET_MAP_IDS.map((id) => ({
        value: id,
        label: `${PET_MAPS[id].name} · ${counts[id] ?? 0}`,
    }))

    return (
        <SegmentGroup.Root
            size="sm"
            value={value}
            aria-label="Map"
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            <SegmentGroup.Items items={items} />
        </SegmentGroup.Root>
    )
}
