import { Flex, type FlexProps } from "@chakra-ui/react"
import { LAYOUT_NAMES } from "@planner/config/layouts"
import { getRouteApi } from "@tanstack/react-router"
import { BoardSwitcherLink } from "./BoardSwitcherLink"

const route = getRouteApi("/planner/$classId/$layout")

// Switches board from the sidebar on tablets and up; phones have board tabs
// in the header instead.
export const BoardSwitcher = ({ ...props }: FlexProps) => {
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
            {LAYOUT_NAMES.map((layoutName) => (
                <BoardSwitcherLink
                    key={layoutName}
                    classId={classId}
                    layout={layoutName}
                    isActive={layoutName === layout}
                />
            ))}
        </Flex>
    )
}
