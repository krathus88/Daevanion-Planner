import { Flex, Text } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import { MAX_STAT_RANK, type StatMax } from "@planner/storage/statPriorities"
import { LimitInput } from "./LimitInput"

type StatMaxFieldsProps = {
    value: StatMax
    name: string
    onChange: (value: StatMax) => void
}

const toRank = (text: string) => {
    if (text === "") {
        return null
    }

    const next = Math.floor(Number(text))

    return Number.isFinite(next)
        ? Math.min(MAX_STAT_RANK, Math.max(1, next))
        : null
}

// When a maxed stat takes its points, against the ability ranks.
export const StatMaxFields = ({
    value,
    name,
    onChange,
}: StatMaxFieldsProps) => {
    const handleSkillChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, skillAfter: toRank(event.target.value) })
    }

    const handlePassiveChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, passiveAfter: toRank(event.target.value) })
    }

    return (
        <Flex alignItems="center" gap="2" textStyle="hint">
            <Text title="Goes before skills ranked after this number">
                Skill &gt;
            </Text>

            <LimitInput
                max={MAX_STAT_RANK}
                min={1}
                placeholder="–"
                value={value.skillAfter ?? ""}
                title="Goes before skills ranked after this; empty waits for every skill"
                aria-label={`Max ${name} before skills ranked after`}
                onChange={handleSkillChange}
            />

            <Text ms="2" title="Goes before passives ranked after this number">
                Passive &gt;
            </Text>

            <LimitInput
                max={MAX_STAT_RANK}
                min={1}
                placeholder="–"
                value={value.passiveAfter ?? ""}
                title="Goes before passives ranked after this; empty waits for every passive"
                aria-label={`Max ${name} before passives ranked after`}
                onChange={handlePassiveChange}
            />
        </Flex>
    )
}
