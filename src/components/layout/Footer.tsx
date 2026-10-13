import { Box, Container, Flex, Text } from "@chakra-ui/react"

export const Footer = () => (
    <Box
        as="footer"
        borderColor="app.border"
        borderTopWidth="1px"
        mt={{ base: "6", md: "10" }}
    >
        <Container maxW="8xl" py="6">
            <Flex
                color="app.subtle"
                direction="column"
                fontSize="xs"
                gap="2"
                lineHeight="tall"
                maxW="4xl"
            >
                <Text>
                    Daevanion Planner is an unofficial, fan-made tool. It is not
                    affiliated with, endorsed, sponsored, or approved by NCSOFT
                    Corporation or any of its affiliates.
                </Text>
                <Text>
                    AION 2, Daevanion, and all related names, characters, skill
                    names, and skill icons are trademarks or copyrighted
                    material of NCSOFT Corporation and are used here for
                    informational purposes only. Skill icons © NCSOFT
                    Corporation. All rights reserved.
                </Text>
                <Text>
                    All other trademarks are the property of their respective
                    owners. Game data may be incomplete or out of date.
                </Text>
            </Flex>
        </Container>
    </Box>
)
