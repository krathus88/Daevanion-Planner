import { Link } from "@chakra-ui/react"
import type { ClassId } from "@config/classPresets"
import { BOARD_NAMES, isMainBoard, type BoardId } from "@config/boards"
import { Link as RouterLink } from "@tanstack/react-router"

type BoardSwitcherLinkProps = {
    classId: ClassId
    layout: BoardId
    isActive: boolean
}

export const BoardSwitcherLink = ({
    classId,
    layout,
    isActive,
}: BoardSwitcherLinkProps) => {
    const isAriel = !isMainBoard(layout)

    return (
        <Link
            asChild
            py="1.5"
            flex="1"
            justifyContent="center"
            bg={isActive ? "app.raised" : "transparent"}
            borderRadius="md"
            boxShadow={isActive ? "insetRing" : "none"}
            color={
                isAriel
                    ? isActive
                        ? "board.arielActive"
                        : "board.ariel"
                    : isActive
                      ? "app.fg"
                      : "app.muted"
            }
            fontSize="sm"
            fontWeight={isActive ? "semibold" : "medium"}
            textDecoration="none"
            _hover={{
                color: isAriel ? "board.arielActive" : "app.fg",
                textDecoration: "none",
            }}
        >
            <RouterLink
                params={{ classId: classId, layout: layout }}
                to="/planner/$classId/$layout"
                search={true}
                resetScroll={false}
                aria-current={isActive ? "page" : undefined}
            >
                {BOARD_NAMES[layout]}
            </RouterLink>
        </Link>
    )
}
