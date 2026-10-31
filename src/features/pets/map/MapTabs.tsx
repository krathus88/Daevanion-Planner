import { SegmentGroup, Text } from "@chakra-ui/react"
import {
    isPetMapId,
    PET_MAP_IDS,
    PET_MAPS,
    type PetMapId,
} from "@pets/config/petMaps"

type MapTabsProps = {
    value: PetMapId
    counts: Partial<Record<PetMapId, number>>
    // Shown muted after the open map's count.
    total?: number
    onChange: (value: PetMapId) => void
}

export const MapTabs = ({ value, counts, total, onChange }: MapTabsProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        if (isPetMapId(details.value)) {
            onChange(details.value)
        }
    }

    const items = PET_MAP_IDS.map((id) => ({
        value: id,
        label: (
            <>
                {PET_MAPS[id].name}

                <Text as="span" display={{ base: "none", md: "inline" }}>
                    {" · "}
                </Text>

                <Text as="span" display={{ base: "block", md: "inline" }}>
                    {counts[id] ?? 0}

                    {id === value && total !== undefined && (
                        <Text
                            as="span"
                            title="Spawns of these pets on the whole map"
                            ms="1.5"
                            color="app.muted"
                            fontSize="xs"
                        >
                            {total}
                        </Text>
                    )}
                </Text>
            </>
        ),
    }))

    return (
        <SegmentGroup.Root
            size="sm"
            value={value}
            // Chakra keeps it max-content wide; on phones each map's name sits
            // over its count, so all three fit.
            w={{ base: "full", md: "auto" }}
            minW="0"
            css={{
                "& [data-part=item]": {
                    mdDown: {
                        px: "1",
                        py: "1",
                        h: "auto",
                        flex: "1",
                        fontSize: "xs",
                        lineHeight: "short",
                    },
                },
            }}
            aria-label="Map"
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            <SegmentGroup.Items items={items} />
        </SegmentGroup.Root>
    )
}
