import { Flex } from "@chakra-ui/react"
import { BoardCanvas } from "./board/BoardCanvas"
import { Sidebar } from "./sidebar/Sidebar"

// The board, with the sidebar beside it on wide screens and below otherwise.
export const BoardWorkspace = () => {
    return (
        <Flex
            w="full"
            flexDir={{ base: "column", xl: "row" }}
            alignItems={{ base: "stretch", xl: "flex-start" }}
            gap={{ base: "5", xl: "6" }}
        >
            <BoardCanvas />

            <Sidebar />
        </Flex>
    )
}
