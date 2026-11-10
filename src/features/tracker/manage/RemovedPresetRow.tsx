import { Button, Flex, Text } from "@chakra-ui/react"
import { IconImage } from "@common/IconImage"
import { getTaskIcon, getTaskIconGlow } from "@tracker/config/taskIcons"
import { TRACKER_RESETS } from "@tracker/config/trackerResets"
import { getTaskTitle } from "@tracker/logic/taskTitle"
import type { TrackerTask } from "@tracker/types"
import { LuPlus } from "react-icons/lu"

type RemovedPresetRowProps = {
    preset: TrackerTask
    onRestore: (id: string) => void
}

export const RemovedPresetRow = ({
    preset,
    onRestore,
}: RemovedPresetRowProps) => {
    const handleClick = () => {
        onRestore(preset.id)
    }

    const title = getTaskTitle(preset)
    const reset = TRACKER_RESETS.find((item) => item.id === preset.reset)

    return (
        <Flex alignItems="center" gap="2">
            <IconImage
                icon={getTaskIcon(preset.id)}
                glow={getTaskIconGlow(preset.id)}
            />

            <Flex minW="0" flex="1" flexDir="column">
                <Text fontSize="sm" truncate>
                    {title}
                </Text>

                <Text textStyle="caption">
                    {reset?.label} ·{" "}
                    {preset.shared ? "per server" : "per character"}
                </Text>
            </Flex>

            <Button
                variant="ghost"
                size="xs"
                aria-label={`Add back ${title}${preset.shared ? " (server)" : ""}`}
                onClick={handleClick}
            >
                <LuPlus />
                Add back
            </Button>
        </Flex>
    )
}
