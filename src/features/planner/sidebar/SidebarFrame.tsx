import { Flex } from "@chakra-ui/react"
import type { ReactNode } from "react"

// The sidebar's panel: sticky beside the board on wide screens.
export const SidebarFrame = ({ children }: { children: ReactNode }) => {
    return (
        <Flex
            as="aside"
            pos={{ xl: "sticky" }}
            top={{ xl: "headerOffset" }}
            w="full"
            minW={{ base: "0", xl: "sidebar" }}
            maxH={{ xl: "sidebarMaxH" }}
            // Fills the width the board leaves, never narrower than sidebar.
            flex={{ xl: "1 0 0%" }}
            flexDir="column"
            overflow="hidden"
            bg="app.panel"
            borderWidth="1px"
            borderColor="app.border"
            borderRadius="xl"
            boxShadow="lg"
        >
            {children}
        </Flex>
    )
}
