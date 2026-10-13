import { useEffect, useState } from "react"
import { Flex, Input, Text } from "@chakra-ui/react"
import type { ClassPreset } from "../../../../config/classPresets"
import {
    abilityNodeCounts,
    readAbilityMaximums,
    readAbilityMinimums,
    resolveAbilityMinimums,
    readAbilityPriorities,
    defaultAbilityPriorities,
    readSharedAbilityUpgradeCounts,
    writeAbilityMaximums,
    writeAbilityMinimums,
    writeAbilityPriorities,
    type AbilityMaximums,
    type AbilityMinimums,
    type AbilityPriorities,
} from "../storage/abilityPriorities"
import { subscribeToBoardStorage } from "../storage/boardStorage"
import { Hint, SectionLabel } from "./PanelKit"
import { appInputStyles, selectAllOnFocus } from "./panelStyles"

type AbilityPriorityListProps = {
    classPreset: ClassPreset
}

export const AbilityPriorityList = ({
    classPreset,
}: AbilityPriorityListProps) => {
    const [initialState] = useState(() => {
        let priorities: AbilityPriorities
        let minimums: AbilityMinimums
        let maximums: AbilityMaximums
        let upgradeCounts: Map<string, number>
        const errors: string[] = []

        try {
            priorities = readAbilityPriorities(classPreset)
        } catch (readError) {
            priorities = defaultAbilityPriorities(classPreset)
            errors.push(
                readError instanceof Error
                    ? readError.message
                    : "Could not read ability priorities.",
            )
        }
        try {
            minimums = readAbilityMinimums(classPreset)
        } catch (readError) {
            minimums = {}
            errors.push(
                readError instanceof Error
                    ? readError.message
                    : "Could not read ability minimums.",
            )
        }
        try {
            maximums = readAbilityMaximums(classPreset)
        } catch (readError) {
            maximums = {}
            errors.push(
                readError instanceof Error
                    ? readError.message
                    : "Could not read ability maximums.",
            )
        }
        try {
            upgradeCounts = readSharedAbilityUpgradeCounts(classPreset)
        } catch (readError) {
            upgradeCounts = new Map()
            errors.push(
                readError instanceof Error
                    ? readError.message
                    : "Could not read shared ability upgrades.",
            )
        }

        return {
            priorities,
            minimums,
            maximums,
            upgradeCounts,
            error: errors.join(" ") || null,
        }
    })
    const [priorities, setPriorities] = useState(initialState.priorities)
    const [minimums, setMinimums] = useState(initialState.minimums)
    const [maximums, setMaximums] = useState(initialState.maximums)
    const [upgradeCounts, setUpgradeCounts] = useState(
        initialState.upgradeCounts,
    )
    const [error, setError] = useState<string | null>(initialState.error)

    useEffect(
        () =>
            subscribeToBoardStorage(() => {
                try {
                    setUpgradeCounts(
                        readSharedAbilityUpgradeCounts(classPreset),
                    )
                } catch (readError) {
                    setError(
                        readError instanceof Error
                            ? readError.message
                            : "Could not read shared ability upgrades.",
                    )
                }
            }),
        [classPreset],
    )

    const updatePriority = (abilityId: string, priority: number) => {
        const nextPriorities = { ...priorities, [abilityId]: priority }
        const writeError = writeAbilityPriorities(
            classPreset.id,
            nextPriorities,
        )
        if (writeError) {
            setError(writeError)
            return
        }

        setPriorities(nextPriorities)
        setError(null)
    }

    const saveLimits = (
        nextMinimums: AbilityMinimums,
        nextMaximums: AbilityMaximums,
    ) => {
        const writeError =
            writeAbilityMinimums(classPreset.id, nextMinimums) ??
            writeAbilityMaximums(classPreset.id, nextMaximums)
        if (writeError) {
            setError(writeError)
            return
        }

        setMinimums(nextMinimums)
        setMaximums(nextMaximums)
        setError(null)
    }

    // Min and Max stay linked: raising Min above Max raises Max, and
    // lowering Max below Min lowers Min.
    const updateMinimum = (abilityId: string, minimum: number) => {
        const maximum = maximums[abilityId]
        saveLimits(
            { ...minimums, [abilityId]: minimum },
            maximum !== undefined && minimum > maximum
                ? { ...maximums, [abilityId]: minimum }
                : maximums,
        )
    }

    const updateMaximum = (abilityId: string, maximum: number | null) => {
        const nextMaximums = { ...maximums }
        if (maximum === null) {
            delete nextMaximums[abilityId]
        } else {
            nextMaximums[abilityId] = maximum
        }
        saveLimits(
            maximum !== null && (resolvedMinimums[abilityId] ?? 0) > maximum
                ? { ...minimums, [abilityId]: maximum }
                : minimums,
            nextMaximums,
        )
    }

    // An ability can't need more upgrades than it has nodes across all boards.
    const nodeCounts = abilityNodeCounts(classPreset)
    const resolvedMinimums = resolveAbilityMinimums(
        classPreset,
        priorities,
        minimums,
    )

    const sortByPriority = (
        left: ClassPreset["abilities"][number],
        right: ClassPreset["abilities"][number],
    ) =>
        (priorities[left.id] ?? Number.MAX_SAFE_INTEGER) -
        (priorities[right.id] ?? Number.MAX_SAFE_INTEGER)
    const skillAbilities = classPreset.abilities
        .filter((ability) => ability.type === "skill")
        .sort(sortByPriority)
    const passiveAbilities = classPreset.abilities
        .filter((ability) => ability.type === "passive")
        .sort(sortByPriority)
    const renderAbility = (ability: ClassPreset["abilities"][number]) => {
        const upgrades = upgradeCounts.get(ability.id) ?? 0
        const minimum = resolvedMinimums[ability.id] ?? 0
        const maximum = maximums[ability.id]
        const maxMinimum = nodeCounts.get(ability.id) ?? 0
        const isBelowMinimum = upgrades < minimum

        return (
            <Flex alignItems="center" gap="2" key={ability.id} minWidth="0">
                {ability.icon && (
                    <img
                        alt=""
                        aria-hidden="true"
                        src={ability.icon}
                        style={{
                            flexShrink: 0,
                            height: "2rem",
                            objectFit: "contain",
                            width: "2rem",
                        }}
                    />
                )}
                <Text
                    flex="1"
                    fontSize="sm"
                    minWidth="0"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    title={ability.name}
                    whiteSpace="nowrap"
                >
                    {ability.name}
                </Text>
                <Input
                    aria-label={`${ability.name} priority rank`}
                    {...appInputStyles}
                    onFocus={selectAllOnFocus}
                    max={99}
                    min={1}
                    onChange={(event) =>
                        updatePriority(
                            ability.id,
                            Math.min(
                                99,
                                Math.max(
                                    1,
                                    Math.floor(Number(event.target.value)),
                                ),
                            ),
                        )
                    }
                    size="sm"
                    textAlign="center"
                    type="number"
                    value={priorities[ability.id] ?? 1}
                    width="3rem"
                />
                <Input
                    aria-label={`${ability.name} minimum upgrades`}
                    {...appInputStyles}
                    onFocus={selectAllOnFocus}
                    max={maxMinimum}
                    min={0}
                    onChange={(event) => {
                        const next = Math.floor(Number(event.target.value))
                        updateMinimum(
                            ability.id,
                            Number.isFinite(next)
                                ? Math.min(maxMinimum, Math.max(0, next))
                                : 0,
                        )
                    }}
                    size="sm"
                    textAlign="center"
                    title={`Up to ${maxMinimum} across all boards`}
                    type="number"
                    value={minimum}
                    width="3rem"
                />
                <Input
                    aria-label={`${ability.name} maximum upgrades`}
                    {...appInputStyles}
                    onFocus={selectAllOnFocus}
                    max={maxMinimum}
                    min={0}
                    onChange={(event) => {
                        if (event.target.value === "") {
                            updateMaximum(ability.id, null)
                            return
                        }
                        const next = Math.floor(Number(event.target.value))
                        updateMaximum(
                            ability.id,
                            Number.isFinite(next)
                                ? Math.min(maxMinimum, Math.max(0, next))
                                : 0,
                        )
                    }}
                    placeholder="–"
                    size="sm"
                    textAlign="center"
                    title="Leave empty for no limit"
                    type="number"
                    value={maximum ?? ""}
                    width="3rem"
                />
                <Text
                    color={
                        isBelowMinimum
                            ? "app.danger"
                            : upgrades > 0
                              ? "app.success"
                              : "app.subtle"
                    }
                    flexShrink="0"
                    fontSize="xs"
                    textAlign="right"
                    title={`${upgrades} ${upgrades === 1 ? "upgrade" : "upgrades"} across all boards${isBelowMinimum ? ` (minimum +${minimum})` : ""}`}
                    whiteSpace="nowrap"
                    width="3.5rem"
                >
                    +{upgrades}
                </Text>
            </Flex>
        )
    }

    return (
        <Flex alignItems="stretch" direction="column" gap="2">
            <Hint>
                Rank each ability, 1 being the highest priority. Special board
                nodes are always rank 1. Min reserves at least that many
                upgrades when optimizing all boards; Max stops it choosing more
                (a cheaper route may still pass through extras). The +N column
                shows upgrades already planned across all boards.
            </Hint>
            <Flex
                color="app.subtle"
                fontSize="xs"
                gap="2"
                justifyContent="flex-end"
            >
                <Text textAlign="center" width="3rem">
                    Rank
                </Text>
                <Text textAlign="center" width="3rem">
                    Min
                </Text>
                <Text textAlign="center" width="3rem">
                    Max
                </Text>
                <Text textAlign="right" whiteSpace="nowrap" width="3.5rem">
                    Planned
                </Text>
            </Flex>
            {skillAbilities.length > 0 && (
                <Flex direction="column" gap="2">
                    <SectionLabel>Skills</SectionLabel>
                    {skillAbilities.map(renderAbility)}
                </Flex>
            )}
            {passiveAbilities.length > 0 && (
                <Flex direction="column" gap="2" mt="2">
                    <SectionLabel>Passives</SectionLabel>
                    {passiveAbilities.map(renderAbility)}
                </Flex>
            )}
            {error && (
                <Text color="app.danger" fontSize="sm" role="status">
                    {error}
                </Text>
            )}
        </Flex>
    )
}
