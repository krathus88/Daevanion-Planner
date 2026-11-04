import { Flex, Text } from "@chakra-ui/react"
import { getPipCount, getPipSteps } from "@tracker/logic/trackerCards"
import { TaskPip } from "./TaskPip"

type TaskPipsProps = {
    count: number
    cap: number
    label: string
    onChange: (count: number) => void
}

// A button per step: one click sets the count, no matter how far.
export const TaskPips = ({ count, cap, label, onChange }: TaskPipsProps) => {
    const handleStep = (step: number) => {
        onChange(getPipCount(count, step))
    }

    return (
        <Flex alignItems="center" gap="2">
            <Flex gap="1" role="group" aria-label={label}>
                {getPipSteps(cap).map((step) => (
                    <TaskPip
                        key={step}
                        step={step}
                        filled={step <= count}
                        done={count >= cap}
                        label={`${label}: ${step} of ${cap}`}
                        onClick={handleStep}
                    />
                ))}
            </Flex>

            <Text minW="8" textStyle="caption" textAlign="end">
                {count}/{cap}
            </Text>
        </Flex>
    )
}
