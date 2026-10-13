"use client"

import type { IconButtonProps, SpanProps } from "@chakra-ui/react"
import { ClientOnly, IconButton, Skeleton, Span } from "@chakra-ui/react"
import type { ThemeProviderProps } from "next-themes"
import { ThemeProvider } from "next-themes"
import { forwardRef } from "react"
import { LuMoon, LuSun } from "react-icons/lu"
import { useColorMode } from "./colorMode"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ColorModeProviderProps extends ThemeProviderProps {}

export function ColorModeProvider(props: ColorModeProviderProps) {
    return (
        <ThemeProvider
            attribute="class"
            disableTransitionOnChange
            // next-themes renders an inline script meant for server rendering;
            // this app renders client-side, where React never runs it and warns.
            // A data-block type keeps it inert and silences the warning.
            scriptProps={{ type: "application/json" }}
            {...props}
        />
    )
}

export function ColorModeIcon() {
    const { colorMode } = useColorMode()
    return colorMode === "dark" ? <LuMoon /> : <LuSun />
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {}

export const ColorModeButton = forwardRef<
    HTMLButtonElement,
    ColorModeButtonProps
>(function ColorModeButton(props, ref) {
    const { toggleColorMode } = useColorMode()
    return (
        <ClientOnly fallback={<Skeleton boxSize="9" />}>
            <IconButton
                onClick={toggleColorMode}
                variant="ghost"
                aria-label="Toggle color mode"
                size="sm"
                ref={ref}
                {...props}
                css={{
                    _icon: {
                        width: "5",
                        height: "5",
                    },
                }}
            >
                <ColorModeIcon />
            </IconButton>
        </ClientOnly>
    )
})

export const LightMode = forwardRef<HTMLSpanElement, SpanProps>(
    function LightMode(props, ref) {
        return (
            <Span
                color="fg"
                display="contents"
                className="chakra-theme light"
                colorPalette="gray"
                colorScheme="light"
                ref={ref}
                {...props}
            />
        )
    },
)

export const DarkMode = forwardRef<HTMLSpanElement, SpanProps>(
    function DarkMode(props, ref) {
        return (
            <Span
                color="fg"
                display="contents"
                className="chakra-theme dark"
                colorPalette="gray"
                colorScheme="dark"
                ref={ref}
                {...props}
            />
        )
    },
)
