import { Flex, Text } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import type { MainBoardId } from "@config/boards"
import { LegendSwatch } from "@planner/board/LegendSwatch"
import {
    SPECIAL_BONUSES,
    type SpecialBonusType,
} from "@planner/config/specialNodes"
import { useStatHighlight } from "@planner/hooks/useStatHighlight"
import type { SpecialNodeCount } from "@planner/storage/specialPriorities"
import { PLANNED_COLUMN_WIDTH } from "./abilityColumns"
import { AbilitySkipName } from "./AbilitySkipName"
import { LimitInput } from "./LimitInput"
import { scopeLabel } from "./scopeLabel"

type SpecialPriorityRowProps = {
    bonus: SpecialBonusType
    priority: number
    skipped: boolean
    count?: SpecialNodeCount
    layout?: MainBoardId
    onPriorityChange: (bonus: SpecialBonusType, priority: number) => void
    onSkipChange: (bonus: SpecialBonusType, skipped: boolean) => void
}

export const SpecialPriorityRow = ({
    bonus,
    priority,
    skipped,
    count,
    layout,
    onPriorityChange,
    onSkipChange,
}: SpecialPriorityRowProps) => {
    const highlight = useStatHighlight(bonus)

    const handlePriorityChange = (event: ChangeEvent<HTMLInputElement>) => {
        onPriorityChange(
            bonus,
            Math.min(99, Math.max(1, Math.floor(Number(event.target.value)))),
        )
    }

    const handleSkipChange = (next: boolean) => {
        onSkipChange(bonus, next)
    }

    // Hovering the name shows its nodes on the board.
    const handleHoverChange = (hovered: boolean) => {
        if (hovered) {
            highlight.show()
        } else {
            highlight.hide()
        }
    }

    const name = SPECIAL_BONUSES[bonus].name

    return (
        <Flex minW="0" alignItems="center" gap="2">
            <LegendSwatch type="special" />

            <AbilitySkipName
                name={name}
                skipped={skipped}
                onChange={handleSkipChange}
                onHoverChange={handleHoverChange}
            />

            <LimitInput
                max={99}
                min={1}
                value={priority}
                fallback={1}
                disabled={skipped}
                aria-label={`${name} priority rank`}
                onChange={handlePriorityChange}
            />

            {count && (
                <Text
                    w={PLANNED_COLUMN_WIDTH}
                    flexShrink="0"
                    color={count.taken > 0 ? "app.success" : "app.subtle"}
                    fontSize="xs"
                    textAlign="right"
                    whiteSpace="nowrap"
                    title={`${count.taken} of ${count.total} ${name} nodes taken ${scopeLabel(layout)}`}
                >
                    {count.taken} / {count.total}
                </Text>
            )}
        </Flex>
    )
}
