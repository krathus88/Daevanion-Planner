import { Text } from "@chakra-ui/react"
import type { ReactNode } from "react"

type TermProps = {
    children: ReactNode
}

// A UI or game name inside hint text.
export const Term = ({ children }: TermProps) => {
    return (
        <Text as="span" color="app.fg" fontWeight="medium">
            {children}
        </Text>
    )
}
