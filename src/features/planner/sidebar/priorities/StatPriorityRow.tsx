import { Flex, Icon, Switch, Text, VisuallyHidden } from "@chakra-ui/react"
import { useDraggable } from "@dnd-kit/react"
import { LuGripVertical } from "react-icons/lu"
import type { MainBoardId } from "@config/boards"
import { STAT_NAMES, type StatType } from "@config/stats/stats"
import type { StatMax, StatNodeCount } from "@planner/storage/statPriorities"
import { scopeLabel } from "./scopeLabel"
import { StatMaxFields } from "./StatMaxFields"

type StatPriorityRowProps = {
    stat: StatType
    // Ignored stats have no Max.
    max?: StatMax
    count?: StatNodeCount
    // Set on This board, where abilities have no ranks for Max to wait on.
    layout?: MainBoardId
    onMaxChange?: (stat: StatType, max: StatMax) => void
}

export const StatPriorityRow = ({
    stat,
    max,
    count,
    layout,
    onMaxChange,
}: StatPriorityRowProps) => {
    const { ref, handleRef, isDragging } = useDraggable({ id: stat })

    const handleMaxCheckedChange = (details: Switch.CheckedChangeDetails) => {
        if (max) {
            onMaxChange?.(stat, { ...max, enabled: details.checked })
        }
    }

    const handleMaxFieldsChange = (next: StatMax) => {
        onMaxChange?.(stat, next)
    }

    const name = STAT_NAMES[stat]

    return (
        <Flex
            ref={ref}
            minW="0"
            flexDir="column"
            gap="1.5"
            opacity={isDragging ? "dimmed" : undefined}
        >
            <Flex minW="0" alignItems="center" gap="2">
                <Flex
                    ref={handleRef}
                    flexShrink="0"
                    color="app.subtle"
                    cursor="grab"
                    _hover={{ color: "app.fg" }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Drag ${name}`}
                >
                    <Icon as={LuGripVertical} boxSize="4" />
                </Flex>

                <Text minW="0" flex="1" fontSize="sm" truncate title={name}>
                    {name}
                </Text>

                {count && (
                    <Text
                        flexShrink="0"
                        color={count.taken > 0 ? "app.success" : "app.subtle"}
                        fontSize="xs"
                        whiteSpace="nowrap"
                        title={`${count.taken} of ${count.total} ${name} nodes taken ${scopeLabel(layout)}`}
                    >
                        {count.taken} / {count.total}
                    </Text>
                )}

                {max && (
                    <Switch.Root
                        size="sm"
                        checked={max.enabled}
                        flexShrink="0"
                        title="Take every node of this stat"
                        onCheckedChange={handleMaxCheckedChange}
                    >
                        <Switch.HiddenInput />

                        <Switch.Control />

                        <Switch.Label fontWeight="normal">
                            Max <VisuallyHidden>{name}</VisuallyHidden>
                        </Switch.Label>
                    </Switch.Root>
                )}
            </Flex>

            {max?.enabled && !layout && (
                <Flex ps="6">
                    <StatMaxFields
                        value={max}
                        name={name}
                        onChange={handleMaxFieldsChange}
                    />
                </Flex>
            )}
        </Flex>
    )
}
