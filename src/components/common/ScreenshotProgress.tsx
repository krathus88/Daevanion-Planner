import { Flex, Text } from "@chakra-ui/react"
import { ProgressBar } from "@common/ProgressBar"

type ScreenshotProgressProps = {
    done: number
    total: number
}

export const ScreenshotProgress = ({
    done,
    total,
}: ScreenshotProgressProps) => {
    return (
        <Flex py="6" flexDir="column" gap="2">
            <Text fontSize="sm">
                Reading screenshot {Math.min(done + 1, total)} of {total}…
            </Text>

            <ProgressBar
                value={(done / total) * 100}
                label="Reading screenshots"
            />
        </Flex>
    )
}
