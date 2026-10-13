import {
    createListCollection,
    Flex,
    Portal,
    Select,
    type SelectValueChangeDetails,
} from "@chakra-ui/react"
import { classPresets, isClassId, type ClassId } from "@config/classPresets"
import { useNavigate } from "@tanstack/react-router"
import { IconImage } from "@common/IconImage"
import type { LayoutType } from "./config/layouts"

const classCollection = createListCollection({
    items: Object.values(classPresets).map((preset) => ({
        label: preset.name,
        value: preset.id,
        icon: preset.icon,
    })),
})

type ClassSelectProps = {
    classId: ClassId
    // Kept when switching class.
    layout: LayoutType
}

export const ClassSelect = ({ classId, layout }: ClassSelectProps) => {
    const navigate = useNavigate()

    const handleValueChange = (details: SelectValueChangeDetails) => {
        const next = details.value[0]

        if (next && next !== classId && isClassId(next)) {
            navigate({
                to: "/$classId/$layout",
                params: { classId: next, layout: layout },
                resetScroll: false,
            })
        }
    }

    const selected = classCollection.items.find(
        (item) => item.value === classId,
    )

    return (
        <Select.Root
            size="sm"
            collection={classCollection}
            value={[classId]}
            w="auto"
            positioning={{ sameWidth: true }}
            onValueChange={handleValueChange}
        >
            <Select.HiddenSelect />

            <Flex alignItems="center" gap="2">
                <Select.Label>Class</Select.Label>

                <Select.Control minW="44" flex="1">
                    <Select.Trigger>
                        <Flex minW="0" alignItems="center" gap="2">
                            <IconImage icon={selected?.icon} />

                            <Select.ValueText
                                fontWeight="medium"
                                whiteSpace="nowrap"
                            />
                        </Flex>
                    </Select.Trigger>

                    <Select.IndicatorGroup>
                        <Select.Indicator />
                    </Select.IndicatorGroup>
                </Select.Control>
            </Flex>

            <Portal>
                <Select.Positioner>
                    <Select.Content>
                        {classCollection.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                                <Flex alignItems="center" gap="2">
                                    <IconImage icon={item.icon} />

                                    <Select.ItemText>
                                        {item.label}
                                    </Select.ItemText>
                                </Flex>

                                <Select.ItemIndicator />
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Positioner>
            </Portal>
        </Select.Root>
    )
}
