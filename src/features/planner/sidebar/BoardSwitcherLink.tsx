import { Icon, Link, VisuallyHidden } from "@chakra-ui/react"
import type { ClassId } from "@config/classPresets"
import { BOARD_NAMES, isMainBoard, type BoardId } from "@config/boards"
import { Link as RouterLink } from "@tanstack/react-router"
import { LuTriangleAlert } from "react-icons/lu"

type BoardSwitcherLinkProps = {
    classId: ClassId
    layout: BoardId
    isActive: boolean
    hasWarning: boolean
}

const WARNING_TEXT = "Placements differ from the game"

export const BoardSwitcherLink = ({
    classId,
    layout,
    isActive,
    hasWarning,
}: BoardSwitcherLinkProps) => {
    const isAriel = !isMainBoard(layout)

    return (
        <Link
            asChild
            py="1.5"
            flex="1"
            justifyContent="center"
            gap="1"
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
                title={hasWarning ? WARNING_TEXT : undefined}
                aria-current={isActive ? "page" : undefined}
            >
                {BOARD_NAMES[layout]}

                {hasWarning && (
                    <>
                        <Icon boxSize="3.5" color="app.danger">
                            <LuTriangleAlert />
                        </Icon>

                        <VisuallyHidden>{WARNING_TEXT}</VisuallyHidden>
                    </>
                )}
            </RouterLink>
        </Link>
    )
}
