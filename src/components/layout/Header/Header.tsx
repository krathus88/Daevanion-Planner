import { Box, Container, Flex } from "@chakra-ui/react"
import type { ClassId } from "@config/classPresets"
import { ClassSelect } from "@planner/ClassSelect"
import type { LayoutType } from "@planner/config/layouts"
import { BoardNav } from "./BoardNav"
import { Brand } from "./Brand"

type HeaderProps = {
    classId: ClassId
    layout: LayoutType
}

export const Header = ({ classId, layout }: HeaderProps) => {
    return (
        <Box
            as="header"
            pos="sticky"
            top="0"
            zIndex="sticky"
            bg="app.header"
            borderColor="app.border"
            borderBottomWidth="1px"
            backdropFilter="blur(10px)"
        >
            <Container maxW="8xl">
                <Flex
                    py={{ base: "2", md: "0" }}
                    minH="16"
                    flexWrap="wrap"
                    alignItems="center"
                    rowGap="2"
                    columnGap={{ base: "4", md: "8" }}
                >
                    <Brand />

                    {/* Below the brand and class picker on phones. */}
                    <BoardNav
                        classId={classId}
                        layout={layout}
                        order={{ base: 3, md: 2 }}
                    />

                    <Flex
                        ml="auto"
                        order={{ base: 2, md: 3 }}
                        alignItems="center"
                        gap="2"
                    >
                        <ClassSelect classId={classId} layout={layout} />
                    </Flex>
                </Flex>
            </Container>
        </Box>
    )
}
