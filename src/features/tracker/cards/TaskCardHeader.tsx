import { chakra, Flex, Icon, Text } from "@chakra-ui/react"
import { ProgressBar } from "@common/ProgressBar"
import type { CardProgress } from "@tracker/logic/trackerCards"
import type { ReactNode } from "react"
import { LuChevronDown, LuChevronUp } from "react-icons/lu"

type TaskCardHeaderProps = {
    title: string
    progress: CardProgress
    minimized: boolean
    icon?: ReactNode
    subtitle?: ReactNode
    // Right after the title (a character's note button); it keeps its clicks
    // to itself.
    titleAction?: ReactNode
    onMinimizedChange: (minimized: boolean) => void
}

// A click anywhere on the header minimizes and expands the card. The chevron
// is the button that does it for keyboards and screen readers (a button can't
// hold the title's own button, so the header itself isn't one); its click
// bubbles up to the header like any other.
export const TaskCardHeader = ({
    title,
    progress,
    minimized,
    icon,
    subtitle,
    titleAction,
    onMinimizedChange,
}: TaskCardHeaderProps) => {
    const handleToggle = () => {
        onMinimizedChange(!minimized)
    }

    const isDone = progress.total > 0 && progress.done === progress.total

    return (
        <Flex
            m="-2"
            p="2"
            flexDir="column"
            gap="2"
            borderRadius="md"
            cursor="button"
            transitionProperty="common"
            transitionDuration="fast"
            _hover={{ bg: "app.hover" }}
            onClick={handleToggle}
        >
            <Flex w="full" alignItems="center" gap="3">
                <Flex
                    boxSize="8"
                    flexShrink="0"
                    alignItems="center"
                    justifyContent="center"
                >
                    {icon}
                </Flex>

                <Flex minW="0" flex="1" flexDir="column">
                    <Flex minW="0" alignItems="center" gap="1">
                        <Text fontSize="lg" fontWeight="semibold" truncate>
                            {title}
                        </Text>

                        {titleAction}
                    </Flex>

                    {subtitle}
                </Flex>

                {progress.total > 0 && (
                    <Text
                        flexShrink="0"
                        color={isDone ? "app.success" : "app.muted"}
                        fontSize="sm"
                        fontWeight="semibold"
                    >
                        {progress.done}/{progress.total}
                    </Text>
                )}

                <chakra.button
                    p="1"
                    m="-1"
                    display="flex"
                    flexShrink="0"
                    borderRadius="sm"
                    color="app.muted"
                    cursor="button"
                    _focusVisible={{
                        outline: "2px solid",
                        outlineColor: "app.accent",
                    }}
                    type="button"
                    aria-label={
                        minimized ? `Expand ${title}` : `Minimize ${title}`
                    }
                    aria-expanded={!minimized}
                >
                    <Icon boxSize="4">
                        {minimized ? <LuChevronDown /> : <LuChevronUp />}
                    </Icon>
                </chakra.button>
            </Flex>

            {progress.total > 0 && (
                <ProgressBar
                    value={(progress.done / progress.total) * 100}
                    label={`${title}: ${progress.done} of ${progress.total} done`}
                />
            )}
        </Flex>
    )
}
