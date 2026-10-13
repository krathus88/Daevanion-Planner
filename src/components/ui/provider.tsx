import { ChakraProvider } from "@chakra-ui/react"
import { system } from "@theme/index"
import type { ReactNode } from "react"

// The app is dark-only: index.html sets the `dark` class on <html>.
export const Provider = ({ children }: { children: ReactNode }) => {
    return <ChakraProvider value={system}>{children}</ChakraProvider>
}
