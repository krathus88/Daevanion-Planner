import { Progress } from "@chakra-ui/react"

type ProgressBarProps = {
    // 0 to 100.
    value: number
    label: string
    tone?: "accent" | "danger"
}

export const ProgressBar = ({
    value,
    label,
    tone = "accent",
}: ProgressBarProps) => {
    return (
        <Progress.Root
            size="xs"
            value={Math.min(100, value)}
            aria-label={label}
        >
            <Progress.Track>
                <Progress.Range
                    bg={tone === "danger" ? "app.danger" : "app.accent"}
                />
            </Progress.Track>
        </Progress.Root>
    )
}
