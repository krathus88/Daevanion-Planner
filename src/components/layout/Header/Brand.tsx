import { Flex, Link, type FlexProps } from "@chakra-ui/react"
import type { PlannerLocation } from "@planner/storage/plannerLocation"
import { Link as RouterLink } from "@tanstack/react-router"
import { BrandMark } from "./BrandMark"

type BrandProps = FlexProps & {
    plannerLocation: PlannerLocation
    // The planner is the page open now.
    isCurrent: boolean
}

// The logo is the way to the planner; it has no tab of its own.
export const Brand = ({ plannerLocation, isCurrent, ...props }: BrandProps) => {
    return (
        <Flex flexShrink="0" {...props}>
            <Link
                asChild
                textDecoration="none"
                _hover={{ textDecoration: "none" }}
            >
                <RouterLink
                    params={plannerLocation}
                    to="/planner/$classId/$layout"
                    aria-label="Daevanion Planner"
                    aria-current={isCurrent ? "page" : undefined}
                >
                    <BrandMark isCurrent={isCurrent} />
                </RouterLink>
            </Link>
        </Flex>
    )
}
