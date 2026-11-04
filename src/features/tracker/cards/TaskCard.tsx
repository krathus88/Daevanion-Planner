import { Flex } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { Section } from "@common/Section"
import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import {
    countTasks,
    getCardProgress,
    getPendingTasks,
    splitIgnored,
    type TaskGroup,
} from "@tracker/logic/trackerCards"
import type { TaskCount, TaskEntries } from "@tracker/types"
import type { ReactNode } from "react"
import { PendingTasks } from "./PendingTasks"
import { TaskCardHeader } from "./TaskCardHeader"
import type {
    CountChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"
import { TaskGroupBoxes } from "./TaskGroupBoxes"
import { TaskGroups } from "./TaskGroups"

type TaskCardProps = {
    title: string
    // Whose counts these are (see getTaskOwner), and its name for labels.
    owner: string
    ownerLabel: string
    taskGroups: TaskGroup[]
    periods: ResetPeriods
    counts?: Record<string, TaskCount>
    entries?: Record<string, TaskEntries>
    // Task ids this owner ignores.
    ignored?: string[]
    // A full-width card, whose boxes line up with the Characters columns.
    wide?: boolean
    minimized?: boolean
    icon?: ReactNode
    subtitle?: ReactNode
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onMinimizedChange: (owner: string, minimized: boolean) => void
    onIgnoredChange: IgnoredChangeHandler
}

export const TaskCard = ({
    title,
    owner,
    ownerLabel,
    taskGroups,
    periods,
    counts,
    entries,
    ignored = [],
    wide = false,
    minimized = false,
    icon,
    subtitle,
    onCountChange,
    onEntriesChange,
    onMinimizedChange,
    onIgnoredChange,
}: TaskCardProps) => {
    const handleMinimizedChange = (next: boolean) => {
        onMinimizedChange(owner, next)
    }

    const progress = getCardProgress(
        taskGroups,
        counts,
        entries,
        ignored,
        periods,
    )
    const split = splitIgnored(taskGroups, ignored)

    return (
        <Card as="article" gap="4" aria-label={title}>
            <TaskCardHeader
                title={title}
                progress={progress}
                minimized={minimized}
                icon={icon}
                subtitle={subtitle}
                onMinimizedChange={handleMinimizedChange}
            />

            {minimized ? (
                <PendingTasks
                    pending={getPendingTasks(
                        taskGroups,
                        counts,
                        entries,
                        ignored,
                        periods,
                    )}
                />
            ) : (
                <Flex flexDir="column" gap="4">
                    <TaskGroupBoxes
                        groups={split.active}
                        owner={owner}
                        ownerLabel={ownerLabel}
                        periods={periods}
                        wide={wide}
                        counts={counts}
                        entries={entries}
                        onCountChange={onCountChange}
                        onEntriesChange={onEntriesChange}
                        onIgnoredChange={onIgnoredChange}
                    />

                    {split.ignored.length > 0 && (
                        <Section
                            title="Ignored"
                            variant="sub"
                            count={countTasks(split.ignored)}
                        >
                            <TaskGroups
                                groups={split.ignored}
                                owner={owner}
                                ownerLabel={ownerLabel}
                                ignored
                                periods={periods}
                                counts={counts}
                                entries={entries}
                                onCountChange={onCountChange}
                                onEntriesChange={onEntriesChange}
                                onIgnoredChange={onIgnoredChange}
                            />
                        </Section>
                    )}
                </Flex>
            )}
        </Card>
    )
}
