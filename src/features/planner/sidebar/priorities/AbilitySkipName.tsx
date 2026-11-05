import { chakra, Flex } from "@chakra-ui/react"

type AbilitySkipNameProps = {
    name: string
    skipped: boolean
    onChange: (skipped: boolean) => void
}

// The ability's name doubles as its Skip toggle: hovering previews the
// strike-through (or its removal), clicking applies it.
export const AbilitySkipName = ({
    name,
    skipped,
    onChange,
}: AbilitySkipNameProps) => {
    const handleClick = () => {
        onChange(!skipped)
    }

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
                        ? `${name}: skipped, click to use it`
                        : `Click to skip ${name}`
                }
                aria-label={`Skip ${name}`}
                aria-pressed={skipped}
                onClick={handleClick}
            >
                {name}
            </chakra.button>
        </Flex>
    )
}
