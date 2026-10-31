import { Flex, Image, Text } from "@chakra-ui/react"
import { LegendSwatch } from "@planner/board/LegendSwatch"
import { SPECIAL_BONUSES } from "@planner/config/specialNodes"
import type { BoardWant, Want } from "@planner/logic/boardWants"
import { AbilityTooltip } from "@planner/shared/AbilityTooltip"
import { Tooltip } from "@ui/tooltip"
import { memo } from "react"
import { PLANNED_COLUMN_WIDTH } from "../priorities/abilityColumns"
import { WantPicker } from "./WantPicker"

type BoardWantRowProps = {
    want: BoardWant
    value: Want
    taken: number
    onChange: (want: BoardWant, value: Want) => void
}

const KIND_LABELS = {
    skill: "Skill",
    passive: "Passive",
} as const

// memo: each row holds a segment group and a click on the board re-maps them
// all, and the compiler can't skip rows inside that map.
export const BoardWantRow = memo(function BoardWantRow({
    want,
    value,
    taken,
    onChange,
}: BoardWantRowProps) {
    const name =
        want.kind === "special"
            ? SPECIAL_BONUSES[want.bonus].name
            : want.ability.name

    const handleChange = (next: Want) => {
        onChange(want, next)
    }

    return (
        <Flex minW="0" alignItems="center" gap="2">
            {want.kind === "special" ? (
                <LegendSwatch type="special" />
            ) : (
                want.ability.icon && (
                    <Tooltip
                        content={
                            <AbilityTooltip
                                ability={want.ability}
                                kind={KIND_LABELS[want.kind]}
                            />
                        }
                        openDelay={100}
                        showArrow
                    >
                        <Image
                            src={want.ability.icon}
                            boxSize="8"
                            flexShrink="0"
                            objectFit="contain"
                            alt=""
                            aria-hidden="true"
                        />
                    </Tooltip>
                )
            )}

            <Text minW="0" flex="1" fontSize="sm" truncate title={name}>
                {name}
            </Text>

            <WantPicker
                value={value}
                label={`${name} on this board`}
                onChange={handleChange}
            />

            <Text
                w={PLANNED_COLUMN_WIDTH}
                flexShrink="0"
                color={taken > 0 ? "app.success" : "app.subtle"}
                fontSize="xs"
                textAlign="right"
                whiteSpace="nowrap"
                title={`${taken} of ${want.keys.length} ${name} nodes on the route`}
            >
                {taken} / {want.keys.length}
            </Text>
        </Flex>
    )
})
