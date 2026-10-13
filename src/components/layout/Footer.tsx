import { Box, Container, Flex, Text } from "@chakra-ui/react"

export const Footer = () => {
    return (
        <Box
            as="footer"
            mt={{ base: "6", md: "10" }}
            borderColor="app.border"
            borderTopWidth="1px"
        >
            <Container py="6" maxW="8xl">
                <Flex
                    maxW="4xl"
                    flexDir="column"
                    gap="2"
                    color="app.subtle"
                    fontSize="xs"
                    lineHeight="tall"
                >
                    <Text>
                        Daevanion Planner is an unofficial, fan-made tool. It is
                        not affiliated with, endorsed, sponsored, or approved by
                        NCSOFT Corporation or any of its affiliates.
                    </Text>

                    <Text>
                        AION 2, Daevanion, and all related names, characters,
                        skill names, and skill icons are trademarks or
                        copyrighted material of NCSOFT Corporation and are used
                        here for informational purposes only. Skill icons ©
                        NCSOFT Corporation. All rights reserved.
                    </Text>

                    <Text>
                        All other trademarks are the property of their
                        respective owners. Game data may be incomplete or out of
                        date.
                    </Text>
                </Flex>
            </Container>
        </Box>
    )
}
