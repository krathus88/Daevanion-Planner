import { Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

export const Root = () => {
    return (
        <>
            <Outlet />

            <TanStackRouterDevtools position="bottom-right" />
        </>
    )
}
