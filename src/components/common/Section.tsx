import { Collapsible, Flex, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"
import { LuChevronRight } from "react-icons/lu"

type SectionProps = {
    children: ReactNode
    title: string
    // "card" is a bordered section; "sub" is a lighter heading inside one.
    variant?: "card" | "sub"
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
                    <LuChevronRight size={variant === "card" ? 16 : 14} />
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
