import { Icon, Tabs } from "@chakra-ui/react"
import { LuLock } from "react-icons/lu"
import type { SidebarTab } from "../types"
import { GlowDot } from "@common/GlowDot"

type SidebarTabListProps = {
    savedCount: number
    hasUnseenResults: boolean
    // The open board isn't planned from All boards (Azphel).
    allBoardsLocked: boolean
}

const LOCKED_TEXT = "This board isn't planned from All boards"

export const SidebarTabList = ({
    savedCount,
    hasUnseenResults,
    allBoardsLocked,
}: SidebarTabListProps) => {
    const tabs: { value: SidebarTab; label: string }[] = [
        { value: "plan", label: "This board" },
        {
            value: "saved",
            label: savedCount > 0 ? `Saved · ${savedCount}` : "Saved",
        },
        { value: "all-boards", label: "All boards" },
    ]

    return (
        <Tabs.List px="2" flexShrink="0" overflowX="auto" overflowY="hidden">
            {tabs.map(({ value, label }) => {
                const isLocked = value === "all-boards" && allBoardsLocked
                const isGlowing =
                    value === "all-boards" && hasUnseenResults && !isLocked

                return (
                    <Tabs.Trigger
                        key={value}
                        value={value}
                        disabled={isLocked}
                        title={isLocked ? LOCKED_TEXT : undefined}
                        gap="1.5"
                        color={isGlowing ? "app.accent" : undefined}
                        textShadow={isGlowing ? "accent.glow" : undefined}
                        aria-description={
                            isGlowing ? "New optimization results" : undefined
                        }
                    >
                        {label}

                        {isLocked && (
                            <Icon boxSize="3.5">
                                <LuLock />
                            </Icon>
                        )}

                        {isGlowing && <GlowDot />}
                    </Tabs.Trigger>
                )
            })}
        </Tabs.List>
    )
}
