import { Flex, Text } from "@chakra-ui/react"
import { ProgressBar } from "@common/ProgressBar"

type ImportProgressProps = {
    done: number
    total: number
}

export const ImportProgress = ({ done, total }: ImportProgressProps) => {
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
