import {
    createListCollection,
    Flex,
    Portal,
    Select,
    type SelectValueChangeDetails,
} from "@chakra-ui/react"
import {
    CLASS_ICONS,
    CLASS_IDS,
    CLASS_NAMES,
    isClassId,
    type ClassId,
} from "@config/classPresets/classInfo"
import { IconImage } from "./IconImage"

const classCollection = createListCollection({
    items: CLASS_IDS.map((classId) => ({
        label: CLASS_NAMES[classId],
        value: classId,
        icon: CLASS_ICONS[classId],
    })),
})

type ClassPickerProps = {
    value: ClassId
    // Shows the label beside the picker from md up; else only screen
    // readers get it.
    labelShown?: boolean
    // Inside a Dialog the list must stay in the dialog, not portal out.
    portalled?: boolean
    label: string
    onChange: (classId: ClassId) => void
}

// A class select with each class's icon.
export const ClassPicker = ({
    value,
    labelShown = false,
    portalled = true,
    label,
    onChange,
}: ClassPickerProps) => {
    const handleValueChange = (details: SelectValueChangeDetails) => {
        const next = details.value[0]

        if (next && next !== value && isClassId(next)) {
            onChange(next)
        }
    }

    return (
        <Select.Root
            size="sm"
            collection={classCollection}
            value={[value]}
            w="auto"
            positioning={{ sameWidth: true }}
            onValueChange={handleValueChange}
        >
            <Select.HiddenSelect />

            <Flex alignItems="center" gap="2">
                <Select.Label
                    srOnly={labelShown ? { base: true, md: false } : true}
                >
                    {label}
                </Select.Label>

                <Select.Control minW={{ base: "40", md: "44" }} flex="1">
                    <Select.Trigger>
                        <Flex minW="0" alignItems="center" gap="2">
                            <IconImage icon={CLASS_ICONS[value]} />

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

            <Portal disabled={!portalled}>
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
