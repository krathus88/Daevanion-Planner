import { Collapsible, Flex, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"
import { LuChevronRight } from "react-icons/lu"

type SectionProps = {
    children: ReactNode
    title: string
    // "card" is a bordered section; "featured" adds an accent edge; "sub" is a
    // lighter heading inside one; "nested" is a slightly darker box inside a
    // "sub".
    variant?: "card" | "featured" | "sub" | "nested"
    open?: boolean
    // Read on mount; remount (via key) to apply a new default.
    defaultOpen?: boolean
    count?: number
    // Shown at the end of the heading, e.g. a running total.
    aside?: ReactNode
    onOpenChange?: (open: boolean) => void
}

// A collapsible group of controls.
export const Section = ({
    children,
    title,
    variant = "card",
    open,
    defaultOpen,
    count,
    aside,
    onOpenChange,
}: SectionProps) => {
    const handleOpenChange = (details: Collapsible.OpenChangeDetails) => {
        onOpenChange?.(details.open)
    }

    return (
        <Collapsible.Root
            variant={variant}
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={handleOpenChange}
        >
            <Collapsible.Trigger>
                <Collapsible.Indicator>
                    <LuChevronRight
                        size={
                            variant === "sub" || variant === "nested" ? 14 : 16
                        }
                    />
                </Collapsible.Indicator>

                <Text flex="1">
                    {title}
                    {count !== undefined && count > 0 && ` · ${count}`}
                </Text>

                {aside}
            </Collapsible.Trigger>

            <Collapsible.Content>
                <Flex flexDir="column" gap="3">
                    {children}
                </Flex>
            </Collapsible.Content>
        </Collapsible.Root>
    )
}
