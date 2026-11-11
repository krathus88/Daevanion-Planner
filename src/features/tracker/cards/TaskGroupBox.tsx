import { Collapsible, Flex, Grid, Icon, Text } from "@chakra-ui/react"
import {
    getGroupProgress,
    isTaskDone,
    type TaskGroup,
} from "@tracker/logic/trackerCards"
import type { TaskCount, TaskEntries } from "@tracker/types"
import { LuCheck, LuChevronRight } from "react-icons/lu"
import type {
    CountChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"
import { TaskTile } from "./TaskTile"

// How wide a box is: "share" starts a tile wide and takes spare width by its
// number of tasks; "column" ends where the first Characters column does (see
// CardGrid); "fill" takes what's left but stays two tiles wide, so it wraps
// under a "column" box sooner than squeeze to one tile per row.
export type BoxSizing = "share" | "column" | "fill"

// Ends where the first Characters column ends, at each breakpoint CardGrid
// uses, so the gap after it lines up with the columns' gap.
const COLUMN_WIDTH = {
    base: "full",
    md: "cardColumn.half",
    xl: "cardColumn.third",
} as const

const FLEX_BASIS = {
    share: "72",
    column: COLUMN_WIDTH,
    fill: "0",
} as const

// Beside a "fill" box, a "column" one gets almost none of the spare width
// (1 share against 100000), so it keeps its column width; once the fill box
// wraps below it, it's alone on its row and grows to the full width.
const FLEX_GROW = {
    share: (tasks: number) => tasks,
    column: () => 1,
    fill: () => 100000,
} as const

type TaskGroupBoxProps = {
    group: TaskGroup
    // All of the reset's tasks (ignored ones left out), done or not, for the
    // count and the box turning green.
    resetGroup: TaskGroup
    // Done task ids fading out on their way to the Done section.
    leaving: readonly string[]
    // Which part of the card this is in, so slide ids stay unique.
    slideScope: string
    sizing: BoxSizing
    // The Ignored section: dimmed tiles, no count, never green.
    ignored?: boolean
    owner: string
    ownerLabel: string
    period: number
    counts?: Record<string, TaskCount>
    entries?: Record<string, TaskEntries>
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onIgnoredChange: IgnoredChangeHandler
    // Given, the box folds: its header opens and closes it (the One-off box).
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

// One reset's tasks as tiles. A done tile turns green; once every task of
// the reset is done, the whole box does instead.
export const TaskGroupBox = ({
    group,
    resetGroup,
    leaving,
    slideScope,
    sizing,
    ignored = false,
    owner,
    ownerLabel,
    period,
    counts,
    entries,
    onCountChange,
    onEntriesChange,
    onIgnoredChange,
    open,
    onOpenChange,
}: TaskGroupBoxProps) => {
    // The ignored ones are already split off into their own section. Done
    // ones may sit in the Done section, but still count here.
    const progress = getGroupProgress(resetGroup, counts, entries, [], period)
    const isComplete = !ignored && progress.done === progress.total
    // Every task leaving takes the whole box with it, so it fades as one.
    const isLeaving = group.tasks.every((task) => leaving.includes(task.id))

    const handleOpenChange = (details: Collapsible.OpenChangeDetails) => {
        onOpenChange?.(details.open)
    }

    const heading = (
        <>
            <Text textStyle="label">{group.label}</Text>

            {!ignored && (
                <Text
                    color={isComplete ? "app.success" : "app.muted"}
                    fontSize="xs"
                >
                    {progress.done}/{progress.total}
                </Text>
            )}

            {isComplete && (
                <Icon boxSize="3.5" color="app.success">
                    <LuCheck />
                </Icon>
            )}
        </>
    )
    const tiles = (
        <Grid
            templateColumns="repeat(auto-fill, minmax(min(100%, 17rem), 1fr))"
            gap="2"
        >
            {group.tasks.map((task) => (
                <TaskTile
                    key={task.id}
                    task={task}
                    owner={owner}
                    ownerLabel={ownerLabel}
                    period={period}
                    count={counts?.[task.id]}
                    entries={entries?.[task.id]}
                    done={isTaskDone(
                        task,
                        counts?.[task.id],
                        entries?.[task.id],
                        period,
                    )}
                    ignored={ignored}
                    boxDone={isComplete}
                    leaving={!isLeaving && leaving.includes(task.id)}
                    slideId={`${slideScope}:${task.id}`}
                    onCountChange={onCountChange}
                    onEntriesChange={onEntriesChange}
                    onIgnoredChange={onIgnoredChange}
                />
            ))}
        </Grid>
    )

    return (
        <Flex
            // Slides into place as done tasks leave (useSlideIntoPlace).
            data-slide-id={`${slideScope}:box:${group.reset}`}
            p="2"
            animation={isLeaving ? "taskLeave" : undefined}
            _motionReduce={{ animation: "none" }}
            minW={sizing === "fill" ? "twoTileBox" : "0"}
            flexGrow={FLEX_GROW[sizing](group.tasks.length)}
            flexShrink={sizing === "column" ? 0 : 1}
            flexBasis={FLEX_BASIS[sizing]}
            flexDir="column"
            gap="2"
            bg={isComplete ? "app.successFill" : "app.subcard"}
            borderRadius="md"
            role="group"
            aria-label={group.label}
        >
            {onOpenChange ? (
                <Collapsible.Root open={open} onOpenChange={handleOpenChange}>
                    <Collapsible.Trigger
                        px="1"
                        borderRadius="sm"
                        fontWeight="normal"
                    >
                        <Collapsible.Indicator>
                            <LuChevronRight size={14} />
                        </Collapsible.Indicator>

                        {heading}
                    </Collapsible.Trigger>

                    <Collapsible.Content pt="2">
                        {/* Tiles sharing a row stretch to the row's tallest. */}
                        {tiles}
                    </Collapsible.Content>
                </Collapsible.Root>
            ) : (
                <>
                    <Flex px="1" alignItems="center" gap="2">
                        {heading}
                    </Flex>

                    {tiles}
                </>
            )}
        </Flex>
    )
}
