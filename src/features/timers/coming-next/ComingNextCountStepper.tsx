import { Flex, IconButton, Text } from "@chakra-ui/react"
import {
    MAX_COMING_NEXT_COUNT,
    MIN_COMING_NEXT_COUNT,
} from "@timers/logic/comingNext"
import { LuMinus, LuPlus } from "react-icons/lu"

type ComingNextCountStepperProps = {
    value: number
    onChange: (count: number) => void
}

export const ComingNextCountStepper = ({
    value,
    onChange,
}: ComingNextCountStepperProps) => {
    const handleDecrement = () => {
        onChange(Math.max(MIN_COMING_NEXT_COUNT, value - 1))
    }

    const handleIncrement = () => {
        onChange(Math.min(MAX_COMING_NEXT_COUNT, value + 1))
    }

    return (
        <Flex alignItems="center" gap="2">
            <Text fontSize="sm" color="app.muted" whiteSpace="nowrap">
                Timers shown
            </Text>

            <IconButton
                variant="ghost"
                size="2xs"
                disabled={value <= MIN_COMING_NEXT_COUNT}
                aria-label="Show fewer timers"
                onClick={handleDecrement}
            >
                <LuMinus />
            </IconButton>

            <Text
                minW="4"
                fontSize="sm"
                fontWeight="semibold"
                fontVariantNumeric="tabular-nums"
                textAlign="center"
                aria-live="polite"
            >
                {value}
            </Text>

            <IconButton
                variant="ghost"
                size="2xs"
                disabled={value >= MAX_COMING_NEXT_COUNT}
                aria-label="Show more timers"
                onClick={handleIncrement}
            >
                <LuPlus />
            </IconButton>
        </Flex>
    )
}
