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
    onMinimizedChange: (minimized: boolean) => void
}

// The whole header minimizes and expands the card.
export const TaskCardHeader = ({
    title,
    progress,
    minimized,
    icon,
    subtitle,
    onMinimizedChange,
}: TaskCardHeaderProps) => {
    const handleToggle = () => {
        onMinimizedChange(!minimized)
    }

    const isDone = progress.total > 0 && progress.done === progress.total

    return (
        <chakra.button
            m="-2"
            p="2"
            display="flex"
            flexDir="column"
            gap="2"
            borderRadius="md"
            textAlign="start"
            cursor="button"
            transitionProperty="common"
            transitionDuration="fast"
            _hover={{ bg: "app.hover" }}
            _focusVisible={{ outline: "2px solid", outlineColor: "app.accent" }}
            type="button"
            aria-label={minimized ? `Expand ${title}` : `Minimize ${title}`}
            aria-expanded={!minimized}
            onClick={handleToggle}
        >
            <Flex as="span" w="full" alignItems="center" gap="3">
                <Flex
                    as="span"
                    boxSize="8"
                    flexShrink="0"
                    alignItems="center"
                    justifyContent="center"
                >
                    {icon}
                </Flex>

                <Flex as="span" minW="0" flex="1" flexDir="column">
                    <Text
                        as="span"
                        fontSize="lg"
                        fontWeight="semibold"
                        truncate
                    >
                        {title}
                    </Text>

                    {subtitle}
                </Flex>

                {progress.total > 0 && (
                    <Text
                        as="span"
                        flexShrink="0"
                        color={isDone ? "app.success" : "app.muted"}
                        fontSize="sm"
                        fontWeight="semibold"
                    >
                        {progress.done}/{progress.total} done
                    </Text>
                )}

                <Icon boxSize="4" flexShrink="0" color="app.muted">
                    {minimized ? <LuChevronDown /> : <LuChevronUp />}
                </Icon>
            </Flex>

            {progress.total > 0 && (
                <chakra.span w="full">
                    <ProgressBar
                        value={(progress.done / progress.total) * 100}
                        label={`${title}: ${progress.done} of ${progress.total} done`}
                    />
                </chakra.span>
            )}
        </chakra.button>
    )
}
