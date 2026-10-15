import { Flex, type FlexProps } from "@chakra-ui/react"
import type { ClassId } from "@config/classPresets"
import { BOARD_IDS, type BoardId } from "@config/boards"
import { BoardNavLink } from "./BoardNavLink"

type BoardNavProps = FlexProps & {
    classId: ClassId
    layout: BoardId
}

export const BoardNav = ({ classId, layout, ...props }: BoardNavProps) => {
    return (
        <Flex
            as="nav"
            w="full"
            minW="0"
            alignSelf="stretch"
            gap="1"
            overflowX="auto"
            aria-label="Select board"
            {...props}
        >
            {BOARD_IDS.map((layoutName) => (
                <BoardNavLink
                    key={layoutName}
                    classId={classId}
                    isActive={layoutName === layout}
                    layout={layoutName}
                />
            ))}
        </Flex>
    )
}
