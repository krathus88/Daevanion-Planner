import { Flex } from "@chakra-ui/react"
import { Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { Footer } from "./Footer"
import { Header } from "./Header/Header"
import { NavigationProgress } from "./NavigationProgress"

export const Root = () => {
    return (
        <>
            <NavigationProgress />

            <Flex minH="vh" flexDir="column">
                <Header />

                <Outlet />

                <Footer />
            </Flex>

            <TanStackRouterDevtools position="bottom-right" />
        </>
    )
}
