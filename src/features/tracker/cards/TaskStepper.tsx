import { Button, Flex, IconButton, Text } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import type { ChangeEvent } from "react"
import { LuMinus, LuPlus } from "react-icons/lu"

type TaskStepperProps = {
    count: number
    cap: number
    label: string
    onChange: (count: number) => void
}

// For caps too high for pips: step, type, or fill it in one go.
export const TaskStepper = ({
    count,
    cap,
    label,
    onChange,
}: TaskStepperProps) => {
    const handleDecrease = () => {
        onChange(count - 1)
    }

    const handleIncrease = () => {
        onChange(count + 1)
    }

    const handleFill = () => {
        onChange(cap)
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(Number(event.target.value || "0"))
    }

    const isDone = count >= cap

    return (
        <Flex alignItems="center" gap="1">
            <IconButton
                variant="secondary"
                size="xs"
                disabled={count <= 0}
                aria-label={`One less: ${label}`}
                onClick={handleDecrease}
            >
                <LuMinus />
            </IconButton>

            <WholeNumberInput
                size="xs"
                value={String(count)}
                w="10"
                px="1"
                color={isDone ? "app.success" : undefined}
                fontWeight="semibold"
                textAlign="center"
                aria-label={label}
                onChange={handleInputChange}
            />

            <Text minW="7" textStyle="caption">
                /{cap}
            </Text>

            <IconButton
                variant="secondary"
                size="xs"
                disabled={isDone}
                aria-label={`One more: ${label}`}
                onClick={handleIncrease}
            >
                <LuPlus />
            </IconButton>

            <Button
                variant="ghost"
                size="xs"
                disabled={isDone}
                aria-label={`All done: ${label}`}
                onClick={handleFill}
            >
                Max
            </Button>
        </Flex>
    )
}
