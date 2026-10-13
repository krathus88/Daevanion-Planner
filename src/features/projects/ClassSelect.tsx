import {
    Box,
    createListCollection,
    Flex,
    Portal,
    Select,
} from "@chakra-ui/react"
import { classPresets } from "@config/classPresets"

const classCollection = createListCollection({
    items: Object.values(classPresets).map((preset) => ({
        label: preset.name,
        value: preset.id,
        icon: preset.icon,
    })),
})

const ClassIcon = ({ icon }: { icon?: string }) =>
    icon ? (
        <Box asChild boxSize="5" flexShrink="0" objectFit="contain">
            <img alt="" aria-hidden="true" src={icon} />
        </Box>
    ) : null

type ClassSelectProps = {
    classId: string
    onChange: (classId: string) => void
}

export const ClassSelect = ({ classId, onChange }: ClassSelectProps) => {
    const selected = classCollection.items.find(
        (item) => item.value === classId,
    )

    return (
        <Select.Root
            collection={classCollection}
            onValueChange={(event) => {
                const next = event.value[0]
                if (next && next !== classId) {
                    onChange(next)
                }
            }}
            positioning={{ sameWidth: true }}
            size="sm"
            value={[classId]}
            width="auto"
        >
            <Select.HiddenSelect />
            <Flex alignItems="center" gap="2">
                <Select.Label
                    color="app.muted"
                    whiteSpace="nowrap"
                    fontSize="sm"
                    fontWeight="normal"
                >
                    Class
                </Select.Label>
                <Select.Control flex="1" minWidth="44">
                    <Select.Trigger
                        background="app.raised"
                        borderColor="app.borderStrong"
                        color="app.fg"
                        cursor="pointer"
                        _focusVisible={{
                            borderColor: "app.accent",
                            outline: "1px solid",
                            outlineColor: "app.accent",
                        }}
                    >
                        <Flex alignItems="center" gap="2" minWidth="0">
                            <ClassIcon icon={selected?.icon} />
                            <Select.ValueText
                                fontWeight="medium"
                                whiteSpace="nowrap"
                            />
                        </Flex>
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                        <Select.Indicator color="app.muted" />
                    </Select.IndicatorGroup>
                </Select.Control>
            </Flex>
            <Portal>
                <Select.Positioner>
                    <Select.Content
                        background="app.raised"
                        borderColor="app.borderStrong"
                        borderWidth="1px"
                    >
                        {classCollection.items.map((item) => (
                            <Select.Item
                                color="app.fg"
                                cursor="pointer"
                                item={item}
                                key={item.value}
                                _highlighted={{ background: "app.hover" }}
                            >
                                <Flex alignItems="center" gap="2">
                                    <ClassIcon icon={item.icon} />
                                    <Select.ItemText>
                                        {item.label}
                                    </Select.ItemText>
                                </Flex>
                                <Select.ItemIndicator color="app.accent" />
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Positioner>
            </Portal>
        </Select.Root>
    )
}
