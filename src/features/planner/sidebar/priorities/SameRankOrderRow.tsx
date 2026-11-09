import { Flex, SegmentGroup, Text, type Tokens } from "@chakra-ui/react"
import { AbilitySkipName } from "./AbilitySkipName"

type SameRankOrderRowProps<Group extends string, Order extends string> = {
    group: Group
    value: Order
    options: readonly Order[]
    names: Record<Order, string>
    colors: Record<Order, Tokens["colors"]>
    // Clicked off by name (Ariel): no level shows, the picker is disabled.
    ignored?: boolean
    label: string
    onChange: (group: Group, value: Order) => void
    // Given, the name toggles Ignore.
    onIgnoredChange?: (group: Group, ignored: boolean) => void
}

export const SameRankOrderRow = <Group extends string, Order extends string>({
    group,
    value,
    options,
    names,
    colors,
    ignored = false,
    label,
    onChange,
    onIgnoredChange,
}: SameRankOrderRowProps<Group, Order>) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        onChange(group, details.value as Order)
    }

    const handleIgnoredChange = (next: boolean) => {
        onIgnoredChange?.(group, next)
    }

    return (
        <Flex minW="0" flexWrap="wrap" alignItems="center" gap="2">
            {onIgnoredChange ? (
                // Sized by the full name, so the picker wraps under it.
                <Flex flex="1 1 auto">
                    <AbilitySkipName
                        name={label}
                        skipped={ignored}
                        verb="ignore"
                        onChange={handleIgnoredChange}
                    />
                </Flex>
            ) : (
                <Text flex="1 1 auto" fontSize="sm">
                    {label}
                </Text>
            )}

            {/* Drops under the label when both don't fit, still on the right. */}
            <SegmentGroup.Root
                layout="compact"
                value={ignored ? null : value}
                ml="auto"
                flexShrink="0"
                disabled={ignored}
                aria-label={`${label} order within a rank`}
                onValueChange={handleValueChange}
            >
                <SegmentGroup.Indicator />

                {options.map((option) => (
                    <SegmentGroup.Item
                        key={option}
                        value={option}
                        color="app.subtle"
                        _checked={{ color: colors[option] }}
                        _hover={{ color: colors[option] }}
                    >
                        <SegmentGroup.ItemText>
                            {names[option]}
                        </SegmentGroup.ItemText>

                        <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                ))}
            </SegmentGroup.Root>
        </Flex>
    )
}
