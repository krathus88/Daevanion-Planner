import { Flex, type FlexProps } from "@chakra-ui/react"
import { BOARD_IDS, type BoardId } from "@config/boards"
import { getRouteApi } from "@tanstack/react-router"
import { BoardSwitcherLink } from "./BoardSwitcherLink"

const route = getRouteApi("/planner/$classId/$layout")

type BoardSwitcherProps = FlexProps & {
    // Boards whose game check found gaps that haven't been looked at yet.
    warnings?: readonly BoardId[]
}

export const BoardSwitcher = ({ warnings, ...props }: BoardSwitcherProps) => {
    const { classId, layout } = route.useParams()

    return (
        <Flex
            as="nav"
            p="1"
            gap="1"
            layerStyle="inset"
            borderRadius="lg"
            aria-label="Select board"
            {...props}
        >
            {BOARD_IDS.map((layoutName) => (
                <BoardSwitcherLink
                    key={layoutName}
                    classId={classId}
                    layout={layoutName}
                    isActive={layoutName === layout}
                    hasWarning={warnings?.includes(layoutName) ?? false}
                />
            ))}
        </Flex>
    )
}
