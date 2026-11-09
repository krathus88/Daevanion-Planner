import { chakra, Flex } from "@chakra-ui/react"

type SkipVerb = "skip" | "ignore"

const VERBS: Record<SkipVerb, { title: string; past: string }> = {
    skip: { title: "Skip", past: "skipped" },
    ignore: { title: "Ignore", past: "ignored" },
}

type AbilitySkipNameProps = {
    name: string
    skipped: boolean
    // Ariel's stats say Ignore, like their tiers did.
    verb?: SkipVerb
    onChange: (skipped: boolean) => void
    onHoverChange?: (hovered: boolean) => void
}

// The name doubles as its Skip (or Ignore) toggle: hovering previews the
// strike-through (or its removal), clicking applies it.
export const AbilitySkipName = ({
    name,
    skipped,
    verb = "skip",
    onChange,
    onHoverChange,
}: AbilitySkipNameProps) => {
    const handleClick = () => {
        onChange(!skipped)
    }

    const handleEnter = () => {
        onHoverChange?.(true)
    }

    const handleLeave = () => {
        onHoverChange?.(false)
    }

    const words = VERBS[verb]

    // The wrapper takes the row's free space; the button only the name's.
    return (
        <Flex minW="0" flex="1">
            <chakra.button
                maxW="full"
                color={skipped ? "app.subtle" : undefined}
                fontSize="sm"
                textAlign="left"
                textDecoration={skipped ? "line-through" : undefined}
                truncate
                cursor="button"
                _hover={{ textDecoration: skipped ? "none" : "line-through" }}
                type="button"
                title={
                    skipped
                        ? `${name}: ${words.past}, click to use it`
                        : `Click to ${verb} ${name}`
                }
                aria-label={`${words.title} ${name}`}
                aria-pressed={skipped}
                onClick={handleClick}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onFocus={handleEnter}
                onBlur={handleLeave}
            >
                {name}
            </chakra.button>
        </Flex>
    )
}
