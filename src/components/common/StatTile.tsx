import { Flex, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"

type StatTileProps = {
    value: ReactNode
    label: string
    tone?: "danger" | "success"
}

const toneColors = {
    danger: "app.danger",
    success: "app.success",
} as const

export const StatTile = ({ value, label, tone }: StatTileProps) => {
    return (
        <Flex minW="0" flex="1" flexDir="column" gap="0.5">
            <Text textStyle="caption">{label}</Text>

            <Text textStyle="stat" color={tone ? toneColors[tone] : "app.fg"}>
                {value}
            </Text>
        </Flex>
    )
}
