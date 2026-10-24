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
} from "@config/classPresets"
import { useNavigate } from "@tanstack/react-router"
import { IconImage } from "@common/IconImage"
import type { BoardId } from "@config/boards"
import {
    readPlannerLocation,
    writePlannerLocation,
} from "./storage/plannerLocation"

const classCollection = createListCollection({
    items: CLASS_IDS.map((classId) => ({
        label: CLASS_NAMES[classId],
        value: classId,
        icon: CLASS_ICONS[classId],
    })),
})

type ClassSelectProps = {
    classId: ClassId
    layout?: BoardId
}

export const ClassSelect = ({ classId, layout }: ClassSelectProps) => {
    const navigate = useNavigate()

    const handleValueChange = (details: SelectValueChangeDetails) => {
        const next = details.value[0]

        if (!next || next === classId || !isClassId(next)) {
            return
        }

        if (layout) {
            navigate({
                to: "/planner/$classId/$layout",
                params: { classId: next, layout: layout },
                resetScroll: false,
            })

            return
        }

        writePlannerLocation({
            classId: next,
            layout: readPlannerLocation().layout,
        })
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
                <Select.Label srOnly={{ base: true, md: false }}>
                    Class
                </Select.Label>

                <Select.Control minW={{ base: "40", md: "44" }} flex="1">
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
