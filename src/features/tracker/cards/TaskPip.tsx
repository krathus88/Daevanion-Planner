import { chakra } from "@chakra-ui/react"

type TaskPipProps = {
    step: number
    filled: boolean
    done: boolean
    label: string
    onClick: (step: number) => void
}

export const TaskPip = ({
    step,
    filled,
    done,
    label,
    onClick,
}: TaskPipProps) => {
    const handleClick = () => {
        onClick(step)
    }

    const fill = done ? "app.success" : "app.accent"

    return (
        <chakra.button
            boxSize="6"
            bg={filled ? fill : "app.inset"}
            borderColor={filled ? fill : "app.borderStrong"}
            borderWidth="1px"
            borderRadius="sm"
            cursor="button"
            transitionProperty="common"
            transitionDuration="fast"
            _hover={{ borderColor: fill }}
            _focusVisible={{ outline: "2px solid", outlineColor: "app.accent" }}
            type="button"
            aria-label={label}
            aria-pressed={filled}
            onClick={handleClick}
        />
    )
}
