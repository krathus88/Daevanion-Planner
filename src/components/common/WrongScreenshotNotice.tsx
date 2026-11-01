import { Flex, Icon, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"
import { LuTriangleAlert } from "react-icons/lu"

type WrongScreenshotNoticeProps = {
    children: ReactNode
    title: string
    files: string[]
}

// Says which screenshots were skipped for not showing the screen a dialog reads.
export const WrongScreenshotNotice = ({
    children,
    title,
    files,
}: WrongScreenshotNoticeProps) => {
    return (
        <Flex
            px="3"
            py="2.5"
            alignItems="flex-start"
            gap="2.5"
            bg="app.accentMuted"
            borderWidth="1px"
            borderLeftWidth="3px"
            borderColor="app.accent"
            borderRadius="md"
            role="alert"
        >
            <Icon mt="0.5" boxSize="4" flexShrink="0" color="app.accent">
                <LuTriangleAlert />
            </Icon>

            <Flex flexDir="column" gap="0.5">
                <Text
                    color="app.accentHover"
                    fontSize="sm"
                    fontWeight="semibold"
                >
                    {title}
                </Text>

                <Text fontSize="sm">
                    Skipped {files.join(", ")}. {children}
                </Text>
            </Flex>
        </Flex>
    )
}
