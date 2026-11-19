import { Icon, Link, VisuallyHidden, type Tokens } from "@chakra-ui/react"
import type { ClassId } from "@config/classPresets"
import { BOARD_NAMES, type BoardId } from "@config/boards"
import { Link as RouterLink } from "@tanstack/react-router"
import { LuTriangleAlert } from "react-icons/lu"

type BoardSwitcherLinkProps = {
    classId: ClassId
    layout: BoardId
    isActive: boolean
    hasWarning: boolean
}

const WARNING_TEXT = "Placements differ from the game"

// The stat boards' own colors, at rest and open; main boards use the app's.
const BOARD_COLORS: Partial<
    Record<BoardId, { idle: Tokens["colors"]; active: Tokens["colors"] }>
> = {
    ariel: { idle: "board.ariel", active: "board.arielActive" },
    azphel: { idle: "board.azphel", active: "board.azphelActive" },
}

export const BoardSwitcherLink = ({
    classId,
    layout,
    isActive,
    hasWarning,
}: BoardSwitcherLinkProps) => {
    const colors = BOARD_COLORS[layout] ?? {
        idle: "app.muted",
        active: "app.fg",
    }

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
            color={isActive ? colors.active : colors.idle}
            fontSize="sm"
            fontWeight={isActive ? "semibold" : "medium"}
            textDecoration="none"
            _hover={{
                color: colors.active,
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
