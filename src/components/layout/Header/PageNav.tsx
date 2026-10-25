import { Flex, type FlexProps } from "@chakra-ui/react"
import { NavTab } from "@common/NavTab"
import type { PlannerLocation } from "@planner/storage/plannerLocation"
import { Link as RouterLink } from "@tanstack/react-router"
import type { SitePage } from "./sitePage"

type PageNavProps = FlexProps & {
    currentPage: SitePage | null
    plannerLocation: PlannerLocation
}

export const PageNav = ({
    currentPage,
    plannerLocation,
    ...props
}: PageNavProps) => {
    return (
        <Flex as="nav" alignSelf="stretch" gap="1" aria-label="Site" {...props}>
            <NavTab isActive={currentPage === "planner"}>
                <RouterLink
                    params={plannerLocation}
                    to="/planner/$classId/$layout"
                    aria-current={
                        currentPage === "planner" ? "page" : undefined
                    }
                >
                    Planner
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

            <NavTab isActive={currentPage === "pets"}>
                <RouterLink
                    to="/pets"
                    aria-current={currentPage === "pets" ? "page" : undefined}
                >
                    Pets
                </RouterLink>
            </NavTab>
        </Flex>
    )
}
