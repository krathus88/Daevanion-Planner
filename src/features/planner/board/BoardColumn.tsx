import { Flex, type FlexProps } from "@chakra-ui/react"

// The board's column: beside the sidebar on wide screens, above it
// otherwise.
export const BoardColumn = ({ ...props }: FlexProps) => {
    return (
        <Flex
            w={{ base: "full", xl: "board" }}
            minW="0"
            maxW="board"
            // Centred when the sidebar stacks below it.
            alignSelf={{ base: "center", xl: "auto" }}
            // Keeps its width beside the sidebar and only shrinks when space
            // runs out; the sidebar takes the rest.
            flex={{ base: "1", xl: "0 1 auto" }}
            flexDir="column"
            alignItems="stretch"
            gap="3"
            {...props}
        />
    )
}
