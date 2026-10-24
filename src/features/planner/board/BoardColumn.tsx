import { Flex, type FlexProps } from "@chakra-ui/react"

export const BoardColumn = ({ ...props }: FlexProps) => {
    return (
        <Flex
            w={{ base: "full", xl: "board" }}
            minW="0"
            maxW="board"
            alignSelf={{ base: "center", xl: "auto" }}
            flex={{ base: "1", xl: "0 1 auto" }}
            flexDir="column"
            alignItems="stretch"
            gap="3"
            {...props}
        />
    )
}
