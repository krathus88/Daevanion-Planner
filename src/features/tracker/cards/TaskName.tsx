import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { IconImage } from "@common/IconImage"
import { getTaskIcon, getTaskIconGlow } from "@tracker/config/taskIcons"
import type { TrackerTask } from "@tracker/types"
import { LuCheck } from "react-icons/lu"

type TaskNameProps = {
    task: TrackerTask
    done: boolean
    ignored: boolean
}

export const TaskName = ({ task, done, ignored }: TaskNameProps) => {
    const icon = getTaskIcon(task.id)

    // The minimum width wraps a wide control under the name on phones,
    // instead of squeezing the name.
    return (
        <Flex minW="36" flex="1" alignItems="center" gap="2">
            {icon ? (
                <IconImage icon={icon} glow={getTaskIconGlow(task.id)} />
            ) : (
                // Keeps names lined up with the ones beside an icon.
                <Box boxSize="5" flexShrink="0" />
            )}

            <Flex minW="0" flexDir="column">
                <Text
                    color={done || ignored ? "app.muted" : "app.fg"}
                    fontSize="sm"
                    lineClamp="2"
                >
                    {task.name}
                </Text>

                {task.subtitle && (
                    <Text textStyle="caption" lineClamp="2">
                        {task.subtitle}
                    </Text>
                )}
            </Flex>

            {done && (
                <Icon boxSize="4" flexShrink="0" color="app.success">
                    <LuCheck />
                </Icon>
            )}
        </Flex>
    )
}
