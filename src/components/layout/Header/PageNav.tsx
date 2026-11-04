import { Flex, type FlexProps } from "@chakra-ui/react"
import { NavTab } from "@common/NavTab"
import { Link as RouterLink } from "@tanstack/react-router"
import type { SitePage } from "./sitePage"

type PageNavProps = FlexProps & {
    currentPage: SitePage | null
}

// The planner has no tab: the logo beside these links opens it.
export const PageNav = ({ currentPage, ...props }: PageNavProps) => {
    return (
        <Flex as="nav" alignSelf="stretch" gap="1" aria-label="Site" {...props}>
            <NavTab isActive={currentPage === "pets"}>
                <RouterLink
                    to="/pets"
                    aria-current={currentPage === "pets" ? "page" : undefined}
                >
                    Pets
                </RouterLink>
            </NavTab>

            <NavTab isActive={currentPage === "tracker"}>
                <RouterLink
                    to="/tracker"
                    aria-current={
                        currentPage === "tracker" ? "page" : undefined
                    }
                >
                    Tracker
                </RouterLink>
            </NavTab>

            <NavTab isActive={currentPage === "timers"}>
                <RouterLink
                    to="/timers"
                    aria-current={currentPage === "timers" ? "page" : undefined}
                >
                    Timers
                </RouterLink>
            </NavTab>
        </Flex>
    )
}
