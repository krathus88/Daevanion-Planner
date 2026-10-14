import { Link } from "@chakra-ui/react"
import type { ClassId } from "@config/classPresets"
import type { LayoutType } from "@planner/config/layouts"
import { Link as RouterLink } from "@tanstack/react-router"

type BoardSwitcherLinkProps = {
    classId: ClassId
    layout: LayoutType
    isActive: boolean
}

// One board in the switcher; the current one is raised like a toggle's thumb.
export const BoardSwitcherLink = ({
    classId,
    layout,
    isActive,
}: BoardSwitcherLinkProps) => {
    return (
        <Link
            asChild
            py="1.5"
            flex="1"
            justifyContent="center"
            bg={isActive ? "app.raised" : "transparent"}
            borderRadius="md"
            boxShadow={isActive ? "insetRing" : "none"}
            color={isActive ? "app.fg" : "app.muted"}
            fontSize="sm"
            fontWeight={isActive ? "semibold" : "medium"}
            textDecoration="none"
            textTransform="capitalize"
            _hover={{ color: "app.fg", textDecoration: "none" }}
        >
            <RouterLink
                params={{ classId: classId, layout: layout }}
                to="/planner/$classId/$layout"
                resetScroll={false}
                aria-current={isActive ? "page" : undefined}
            >
                {layout}
            </RouterLink>
        </Link>
    )
}
