import { Flex, type FlexProps } from "@chakra-ui/react"
import { BoardCanvas } from "./board/BoardCanvas"
import { Sidebar } from "./sidebar/Sidebar"

export const WorkspaceRow = ({ ...props }: FlexProps) => {
    return (
        <Flex
            w="full"
            flexDir={{ base: "column", xl: "row" }}
            alignItems={{ base: "stretch", xl: "flex-start" }}
            gap={{ base: "5", xl: "6" }}
            {...props}
        />
    )
}

export const BoardWorkspace = () => {
    return (
        <WorkspaceRow>
            <BoardCanvas />

            <Sidebar />
        </WorkspaceRow>
    )
}
