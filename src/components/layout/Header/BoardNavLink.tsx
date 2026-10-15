import { NavTab } from "@common/NavTab"
import type { ClassId } from "@config/classPresets"
import { BOARD_NAMES, type BoardId } from "@config/boards"
import { Link as RouterLink } from "@tanstack/react-router"

type BoardNavLinkProps = {
    classId: ClassId
    layout: BoardId
    isActive: boolean
}

export const BoardNavLink = ({
    classId,
    layout,
    isActive,
}: BoardNavLinkProps) => {
    return (
        <NavTab isActive={isActive}>
            <RouterLink
                params={{ classId: classId, layout: layout }}
                to="/planner/$classId/$layout"
                resetScroll={false}
                aria-current={isActive ? "page" : undefined}
            >
                {BOARD_NAMES[layout]}
            </RouterLink>
        </NavTab>
    )
}
