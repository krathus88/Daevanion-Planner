import type { ClassAbility } from "@config/classPresets"
import { Flex, Image, Text } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import type { useAbilityLimits } from "@planner/hooks/useAbilityLimits"
import { PLANNED_COLUMN_WIDTH } from "./abilityColumns"
import { LimitInput } from "./LimitInput"

type AbilityRowProps = {
    ability: ClassAbility
    limits: ReturnType<typeof useAbilityLimits>
}

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value))
}

export const AbilityRow = ({ ability, limits }: AbilityRowProps) => {
    const toUpgrades = (text: string) => {
        const next = Math.floor(Number(text))

        return Number.isFinite(next) ? clamp(next, 0, nodeCount) : 0
    }

    const handlePriorityChange = (event: ChangeEvent<HTMLInputElement>) => {
        limits.updatePriority(
            ability.id,
            clamp(Math.floor(Number(event.target.value)), 1, 99),
        )
    }

    const handleMinimumChange = (event: ChangeEvent<HTMLInputElement>) => {
        limits.updateMinimum(ability.id, toUpgrades(event.target.value))
    }

    const handleMaximumChange = (event: ChangeEvent<HTMLInputElement>) => {
        limits.updateMaximum(
            ability.id,
            event.target.value === "" ? null : toUpgrades(event.target.value),
        )
    }

    const upgrades = limits.upgradeCounts.get(ability.id) ?? 0
    const minimum = limits.minimums[ability.id] ?? 0
    const maximum = limits.maximums[ability.id]
    const nodeCount = limits.nodeCounts.get(ability.id) ?? 0
    const isBelowMinimum = upgrades < minimum

    return (
        <Flex minW="0" alignItems="center" gap="2">
            {ability.icon && (
                <Image
                    src={ability.icon}
                    boxSize="8"
                    flexShrink="0"
                    objectFit="contain"
                    alt=""
                    aria-hidden="true"
                />
            )}

            <Text minW="0" flex="1" fontSize="sm" truncate title={ability.name}>
                {ability.name}
            </Text>

            <LimitInput
                max={99}
                min={1}
                value={limits.priorities[ability.id] ?? 1}
                aria-label={`${ability.name} priority rank`}
                onChange={handlePriorityChange}
            />

            <LimitInput
                max={nodeCount}
                min={0}
                value={minimum}
                title={`Up to ${nodeCount} across all boards`}
                aria-label={`${ability.name} minimum upgrades`}
                onChange={handleMinimumChange}
            />

            <LimitInput
                max={nodeCount}
                min={0}
                placeholder="–"
                value={maximum ?? ""}
                title="Leave empty for no limit"
                aria-label={`${ability.name} maximum upgrades`}
                onChange={handleMaximumChange}
            />

            <Text
                w={PLANNED_COLUMN_WIDTH}
                flexShrink="0"
                color={
                    isBelowMinimum
                        ? "app.danger"
                        : upgrades > 0
                          ? "app.success"
                          : "app.subtle"
                }
                fontSize="xs"
                textAlign="right"
                whiteSpace="nowrap"
                title={`${upgrades} ${upgrades === 1 ? "upgrade" : "upgrades"} across all boards${isBelowMinimum ? ` (minimum +${minimum})` : ""}`}
            >
                +{upgrades}
            </Text>
        </Flex>
    )
}
