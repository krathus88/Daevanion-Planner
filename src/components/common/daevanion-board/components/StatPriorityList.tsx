import { useState } from "react"
import { Box, Flex, Switch, Text } from "@chakra-ui/react"
import type { ClassPreset } from "../../../../config/classPresets"
import {
    STAT_NAMES,
    STAT_TIER_NAMES,
    STAT_TIERS,
    STAT_TYPES,
    type StatTier,
} from "../config/stats"
import {
    DEFAULT_STAT_SETTINGS,
    readStatSettings,
    writeStatSettings,
    type StatSettings,
} from "../storage/statPriorities"
import { Hint, SectionLabel } from "./PanelKit"

const tierColors: Record<StatTier, string> = {
    best: "app.accent",
    good: "app.success",
    okay: "app.info",
    ignore: "app.subtle",
}

type StatPriorityListProps = {
    classPreset: ClassPreset
}

export const StatPriorityList = ({ classPreset }: StatPriorityListProps) => {
    const [initialState] = useState(() => {
        try {
            return { settings: readStatSettings(classPreset.id), error: null }
        } catch (readError) {
            return {
                settings: DEFAULT_STAT_SETTINGS,
                error:
                    readError instanceof Error
                        ? readError.message
                        : "Could not read stat priorities.",
            }
        }
    })
    const [settings, setSettings] = useState(initialState.settings)
    const [error, setError] = useState<string | null>(initialState.error)

    const update = (next: StatSettings) => {
        const writeError = writeStatSettings(classPreset.id, next)
        if (writeError) {
            setError(writeError)
            return
        }

        setSettings(next)
        setError(null)
    }

    return (
        <Flex direction="column" gap="2">
            <SectionLabel>Stats</SectionLabel>
            <Hint>
                When two routes cost the same, the one through better stats
                wins. Stats never make a route cost more, unless you let it
                spend leftover points below.
            </Hint>

            {STAT_TYPES.map((stat) => (
                <Flex alignItems="center" gap="2" key={stat} minWidth="0">
                    <Text
                        flex="1"
                        fontSize="sm"
                        minWidth="0"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                    >
                        {STAT_NAMES[stat]}
                    </Text>
                    <Flex
                        aria-label={`${STAT_NAMES[stat]} priority`}
                        background="app.inset"
                        borderColor="app.border"
                        borderWidth="1px"
                        flexShrink="0"
                        gap="0.5"
                        p="0.5"
                        role="radiogroup"
                        rounded="md"
                    >
                        {STAT_TIERS.map((tier) => {
                            const isActive = settings.tiers[stat] === tier

                            return (
                                <Box
                                    aria-checked={isActive}
                                    as="button"
                                    background={
                                        isActive ? "app.raised" : "transparent"
                                    }
                                    boxShadow={
                                        isActive
                                            ? "inset 0 0 0 1px var(--chakra-colors-app-border-strong)"
                                            : "none"
                                    }
                                    color={
                                        isActive
                                            ? tierColors[tier]
                                            : "app.subtle"
                                    }
                                    cursor="pointer"
                                    fontSize="xs"
                                    fontWeight={
                                        isActive ? "semibold" : "medium"
                                    }
                                    key={tier}
                                    onClick={() =>
                                        update({
                                            ...settings,
                                            tiers: {
                                                ...settings.tiers,
                                                [stat]: tier,
                                            },
                                        })
                                    }
                                    px="2"
                                    py="0.5"
                                    role="radio"
                                    rounded="sm"
                                    _hover={{ color: tierColors[tier] }}
                                >
                                    {STAT_TIER_NAMES[tier]}
                                </Box>
                            )
                        })}
                    </Flex>
                </Flex>
            ))}

            <Switch.Root
                checked={settings.spendLeftover}
                mt="2"
                onCheckedChange={(event) =>
                    update({ ...settings, spendLeftover: event.checked })
                }
                size="sm"
            >
                <Switch.HiddenInput />
                <Switch.Control
                    background="app.hover"
                    _checked={{ background: "app.accent" }}
                />
                <Switch.Label fontSize="sm">
                    Spend leftover points on stats
                </Switch.Label>
            </Switch.Root>
            <Hint>
                When on, points left after special nodes, Min and ranks go to
                the best stat nodes, without giving up anything else.
            </Hint>

            {error && (
                <Text color="app.danger" fontSize="sm" role="status">
                    {error}
                </Text>
            )}
        </Flex>
    )
}
