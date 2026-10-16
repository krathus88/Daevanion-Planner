import type { InputProps } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import { LIMIT_COLUMN_WIDTH } from "./abilityColumns"

export const LimitInput = ({ ...props }: InputProps) => {
    return (
        <WholeNumberInput
            size="sm"
            w={LIMIT_COLUMN_WIDTH}
            textAlign="center"
            {...props}
        />
    )
}
