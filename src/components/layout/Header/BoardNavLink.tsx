import { NavTab } from "@common/NavTab"
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
        <NavTab isActive={isActive} capitalize>
            <RouterLink
                params={{ classId: classId, layout: layout }}
                to="/planner/$classId/$layout"
                resetScroll={false}
                aria-current={isActive ? "page" : undefined}
            >
                {layout}
            </RouterLink>
        </NavTab>
    )
}
