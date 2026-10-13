import { Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { NavigationProgress } from "./NavigationProgress"

export const Root = () => {
    return (
        <>
            <NavigationProgress />

            <Outlet />

            <TanStackRouterDevtools position="bottom-right" />
        </>
    )
}
