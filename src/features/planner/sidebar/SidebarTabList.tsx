import { Tabs } from "@chakra-ui/react"
import type { SidebarTab } from "../types"
import { GlowDot } from "@common/GlowDot"

type SidebarTabListProps = {
    savedCount: number
    // New "Optimize all boards" results are waiting on the All boards tab.
    hasUnseenResults: boolean
}

export const SidebarTabList = ({
    savedCount,
    hasUnseenResults,
}: SidebarTabListProps) => {
    const tabs: { value: SidebarTab; label: string }[] = [
        { value: "plan", label: "Plan" },
        {
            value: "saved",
            label: savedCount > 0 ? `Saved · ${savedCount}` : "Saved",
        },
        { value: "all-boards", label: "All boards" },
    ]

    return (
        <Tabs.List px="2" flexShrink="0" overflowX="auto" overflowY="hidden">
            {tabs.map(({ value, label }) => {
                const isGlowing = value === "all-boards" && hasUnseenResults

                return (
                    <Tabs.Trigger
                        key={value}
                        value={value}
                        gap="1.5"
                        color={isGlowing ? "app.accent" : undefined}
                        textShadow={isGlowing ? "accent.glow" : undefined}
                        aria-description={
                            isGlowing ? "New optimization results" : undefined
                        }
                    >
                        {label}

                        {isGlowing && <GlowDot />}
                    </Tabs.Trigger>
                )
            })}
        </Tabs.List>
    )
}
