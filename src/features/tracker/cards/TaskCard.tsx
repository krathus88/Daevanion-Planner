import { Box, Flex } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { Section } from "@common/Section"
import { useDelayedIgnore } from "@tracker/hooks/useDelayedIgnore"
import { useDoneStash } from "@tracker/hooks/useDoneStash"
import { useSlideIntoPlace } from "@tracker/hooks/useSlideIntoPlace"
import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import {
    countTasks,
    getCardProgress,
    getDoneTaskIds,
    getPendingTasks,
    splitDone,
    splitIgnored,
    type TaskGroup,
} from "@tracker/logic/trackerCards"
import type { TaskCount, TaskEntries } from "@tracker/types"
import { useRef, type ReactNode } from "react"
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
    const cardRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const captureSlide = useSlideIntoPlace(contentRef)
    const stash = useDoneStash(
        cardRef,
        getDoneTaskIds(taskGroups, counts, entries, ignored, periods),
        captureSlide,
    )
    const active = splitDone(split.active, stash.stashed)
    const delayedIgnore = useDelayedIgnore((taskId) => {
        onIgnoredChange(owner, taskId, true)
    }, captureSlide)
    const leaving = [...stash.leaving, ...delayedIgnore.ignoring]

    // Changes that can bring a task back into view (undone from Done,
    // entries refilled) slide the rest aside and fade it in.
    const handleCountChange: CountChangeHandler = (...args) => {
        captureSlide()
        onCountChange(...args)
    }

    const handleEntriesChange: EntriesChangeHandler = (...args) => {
        captureSlide()
        onEntriesChange(...args)
    }

    // Ignoring fades the task out first, like a done one leaving.
    const handleIgnoredChange: IgnoredChangeHandler = (
        changedOwner,
        taskId,
        next,
    ) => {
        if (next) {
            delayedIgnore.ignore(taskId)
        } else {
            captureSlide()
            onIgnoredChange(changedOwner, taskId, next)
        }
    }

    return (
        <Card
            ref={cardRef}
            as="article"
            gap="4"
            aria-label={title}
            onPointerLeave={stash.onPointerLeave}
        >
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
                <Flex ref={contentRef} flexDir="column" gap="4">
                    <TaskGroupBoxes
                        groups={active.todo}
                        slideScope="todo"
                        leaving={leaving}
                        owner={owner}
                        ownerLabel={ownerLabel}
                        periods={periods}
                        wide={wide}
                        counts={counts}
                        entries={entries}
                        onCountChange={handleCountChange}
                        onEntriesChange={handleEntriesChange}
                        onIgnoredChange={handleIgnoredChange}
                    />

                    {active.done.length > 0 && (
                        // Sections slide as a whole (see useSlideIntoPlace).
                        <Box data-slide-id="section:done" data-slide-section>
                            <Section
                                title="Done"
                                variant="sub"
                                count={countTasks(active.done)}
                            >
                                {/* Same boxes and tiles as above, so they stay green. */}
                                <TaskGroupBoxes
                                    groups={active.done}
                                    slideScope="done"
                                    leaving={leaving}
                                    owner={owner}
                                    ownerLabel={ownerLabel}
                                    periods={periods}
                                    wide={wide}
                                    counts={counts}
                                    entries={entries}
                                    onCountChange={handleCountChange}
                                    onEntriesChange={handleEntriesChange}
                                    onIgnoredChange={handleIgnoredChange}
                                />
                            </Section>
                        </Box>
                    )}

                    {split.ignored.length > 0 && (
                        <Box data-slide-id="section:ignored" data-slide-section>
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
                                    onCountChange={handleCountChange}
                                    onEntriesChange={handleEntriesChange}
                                    onIgnoredChange={handleIgnoredChange}
                                />
                            </Section>
                        </Box>
                    )}
                </Flex>
            )}
        </Card>
    )
}
