import { Flex, Icon } from "@chakra-ui/react"
import { IconImage } from "@common/IconImage"
import { getTaskIcon } from "@tracker/config/taskIcons"
import { getTaskTitle } from "@tracker/logic/taskTitle"
import type { PendingTask } from "@tracker/logic/trackerCards"
import { Tooltip } from "@ui/tooltip"
import { LuCircleDashed } from "react-icons/lu"

type PendingTaskChipProps = {
    item: PendingTask
}

export const PendingTaskChip = ({ item }: PendingTaskChipProps) => {
    const icon = getTaskIcon(item.task.id)
    const label = `${getTaskTitle(item.task)} ${item.detail}`

    return (
        <Tooltip content={label} openDelay={200}>
            <Flex
                boxSize="7"
                alignItems="center"
                justifyContent="center"
                role="img"
                aria-label={label}
            >
                {icon ? (
                    <IconImage icon={icon} />
                ) : (
                    <Icon boxSize="4" color="app.muted">
                        <LuCircleDashed />
                    </Icon>
                )}
            </Flex>
        </Tooltip>
    )
}
