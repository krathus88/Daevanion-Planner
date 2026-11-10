import {
    WholeNumberInput,
    type WholeNumberInputProps,
} from "@common/WholeNumberInput"
import { LIMIT_COLUMN_WIDTH } from "./abilityColumns"

export const LimitInput = ({ ...props }: WholeNumberInputProps) => {
    return (
        <WholeNumberInput
            size="sm"
            w={LIMIT_COLUMN_WIDTH}
            textAlign="center"
            {...props}
        />
    )
}
