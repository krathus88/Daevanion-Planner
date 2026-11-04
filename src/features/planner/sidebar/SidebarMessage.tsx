import { Text } from "@chakra-ui/react"
import type { ReactNode } from "react"

export const SidebarMessage = ({ children }: { children: ReactNode }) => {
    return (
        <Text
            px="4"
            py="2.5"
            flexShrink="0"
            bg="app.raised"
            borderColor="app.border"
            borderTopWidth="1px"
            color="app.accent"
            fontSize="sm"
            // Paragraphs are split by a blank line.
            whiteSpace="pre-line"
            role="status"
        >
            {children}
        </Text>
    )
}
