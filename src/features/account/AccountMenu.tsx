import { useAuth } from "@account/hooks/useAuth"
import { useSyncStatus } from "@account/hooks/useSyncStatus"
import {
    Button,
    Icon,
    IconButton,
    Popover,
    Portal,
    useBreakpointValue,
} from "@chakra-ui/react"
import { FaDiscord } from "react-icons/fa6"
import { AccountPanel } from "./AccountPanel"
import { SyncConflictDialog } from "./conflict/SyncConflictDialog"
import { SyncStatusIcon } from "./SyncStatusIcon"

// Footer login on wider screens (phones use the menu): saves plans, pets and
// timer settings to the account. Stays mounted on phones for the conflict
// dialog.
export const AccountMenu = () => {
    const auth = useAuth()
    const syncStatus = useSyncStatus()
    const isPhone =
        useBreakpointValue({ base: true, md: false }, { ssr: false }) ?? false
    // Opens by itself to say why a Discord login was refused.
    const loginRefused =
        auth.status === "signedOut" && auth.error !== null && !isPhone

    if (auth.status === "loading") {
        return null
    }

    return (
        <>
            <Popover.Root
                key={loginRefused ? "refused" : "normal"}
                defaultOpen={loginRefused}
                positioning={{ placement: "top-end" }}
            >
                <Popover.Trigger asChild>
                    {auth.status === "signedIn" ? (
                        <IconButton
                            variant="ghost"
                            size="xs"
                            flexShrink="0"
                            hideBelow="md"
                            color={
                                syncStatus.state === "error" ||
                                syncStatus.state === "conflict"
                                    ? "app.danger"
                                    : undefined
                            }
                            aria-label={`Account: ${auth.name}`}
                            title={auth.name}
                        >
                            <SyncStatusIcon status={syncStatus} />
                        </IconButton>
                    ) : (
                        <Button
                            variant="ghost"
                            size="xs"
                            flexShrink="0"
                            hideBelow="md"
                        >
                            <Icon>
                                <FaDiscord />
                            </Icon>
                            Log in
                        </Button>
                    )}
                </Popover.Trigger>

                <Portal>
                    <Popover.Positioner zIndex="popover">
                        <Popover.Content w="xs">
                            <Popover.Body p="3">
                                <AccountPanel
                                    auth={auth}
                                    syncStatus={syncStatus}
                                />
                            </Popover.Body>
                        </Popover.Content>
                    </Popover.Positioner>
                </Portal>
            </Popover.Root>

            {syncStatus.state === "conflict" && (
                <SyncConflictDialog
                    conflicts={syncStatus.conflicts}
                    open={syncStatus.open}
                />
            )}
        </>
    )
}
