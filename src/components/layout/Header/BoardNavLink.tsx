import { Link } from "@chakra-ui/react"
import type { ClassId } from "@config/classPresets"
import type { LayoutType } from "@planner/config/layouts"
import { Link as RouterLink } from "@tanstack/react-router"

type BoardNavLinkProps = {
    classId: ClassId
    layout: LayoutType
    isActive: boolean
}

export const BoardNavLink = ({
    classId,
    layout,
    isActive,
}: BoardNavLinkProps) => {
    return (
        <Link
            asChild
            px="4"
            minH={{ base: "10", md: "16" }}
            display="flex"
            alignItems="center"
            borderBottomColor={isActive ? "app.accent" : "transparent"}
            borderBottomWidth="2px"
            color={isActive ? "app.fg" : "app.muted"}
            fontSize="sm"
            fontWeight={isActive ? "semibold" : "medium"}
            textDecoration="none"
            textTransform="capitalize"
            whiteSpace="nowrap"
            _hover={{
                bg: "app.raised",
                color: "app.fg",
                textDecoration: "none",
            }}
        >
            <RouterLink
                params={{ classId: classId, layout: layout }}
                to="/$classId/$layout"
                resetScroll={false}
                aria-current={isActive ? "page" : undefined}
            >
                {layout}
            </RouterLink>
        </Link>
    )
}
