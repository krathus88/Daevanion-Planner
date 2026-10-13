import { Tooltip as ChakraTooltip, Portal } from "@chakra-ui/react"
import type { ReactNode, Ref, RefObject } from "react"

export interface TooltipProps extends ChakraTooltip.RootProps {
    content: ReactNode
    ref?: Ref<HTMLDivElement>
    showArrow?: boolean
    disabled?: boolean
    portalled?: boolean
    portalRef?: RefObject<HTMLElement | null>
    contentProps?: ChakraTooltip.ContentProps
}

export const Tooltip = ({
    content,
    ref,
    showArrow,
    disabled,
    portalled = true,
    portalRef,
    contentProps,
    children,
    ...rest
}: TooltipProps) => {
    if (disabled) {
        return children
    }

    return (
        <ChakraTooltip.Root {...rest}>
            <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>

            <Portal container={portalRef} disabled={!portalled}>
                <ChakraTooltip.Positioner>
                    <ChakraTooltip.Content ref={ref} {...contentProps}>
                        {showArrow && (
                            <ChakraTooltip.Arrow>
                                <ChakraTooltip.ArrowTip />
                            </ChakraTooltip.Arrow>
                        )}

                        {content}
                    </ChakraTooltip.Content>
                </ChakraTooltip.Positioner>
            </Portal>
        </ChakraTooltip.Root>
    )
}
