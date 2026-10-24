import { Text } from "@chakra-ui/react"
import type { ReactNode } from "react"

type StatusTextProps = {
    children: ReactNode
    // "alert" interrupts screen readers; use it for warnings.
    role?: "status" | "alert"
    tone?: "muted" | "danger"
}

const toneColors = {
    muted: "app.muted",
    danger: "app.danger",
} as const

export const StatusText = ({
    children,
    role = "status",
    tone = "danger",
}: StatusTextProps) => {
    return (
        <Text color={toneColors[tone]} fontSize="sm" role={role}>
            {children}
        </Text>
    )
}
