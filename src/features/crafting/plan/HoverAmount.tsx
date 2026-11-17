import { Text } from "@chakra-ui/react"
import { Tooltip } from "@ui/tooltip"
import type { ReactNode } from "react"

type HoverAmountProps = {
    children: ReactNode
    // What shows on hover or focus: how the amount adds up.
    content: ReactNode
}

// An amount with more on hover: a dotted underline says so, like an item
// mention's.
export const HoverAmount = ({ children, content }: HoverAmountProps) => {
    return (
        <Tooltip content={content} openDelay={200}>
            <Text
                as="span"
                textDecoration="underline"
                textDecorationStyle="dotted"
                cursor="help"
                tabIndex={0}
            >
                {children}
            </Text>
        </Tooltip>
    )
}
