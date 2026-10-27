import { signIn, signOut, type AuthState } from "@account/auth"
import {
    openSyncConflict,
    retrySync,
    type SyncStatus,
} from "@account/sync/cloudSync"
import { Button, Flex, Icon, Text } from "@chakra-ui/react"
import { FaDiscord } from "react-icons/fa6"

type AccountPanelProps = {
    auth: AuthState
    syncStatus: SyncStatus
}

const getSyncText = (status: SyncStatus) => {
    if (status.state === "synced") {
        return "Plans, pets and timer settings are saved to your account."
    }

    if (status.state === "error") {
        return `Couldn't sync: ${status.message}`
    }

    if (status.state === "conflict") {
        return "Sync is paused: this device and your account have different data."
    }

    return "Syncing…"
}

export const AccountPanel = ({ auth, syncStatus }: AccountPanelProps) => {
    const handleSignIn = () => {
        void signIn()
    }

    const handleSignOut = () => {
        void signOut()
    }

    const handleRetry = () => {
        retrySync()
    }

    const handleChoose = () => {
        openSyncConflict()
    }

    if (auth.status === "loading") {
        return null
    }

    if (auth.status === "signedOut") {
        return (
            <Flex w="full" flexDir="column" alignItems="flex-start" gap="1.5">
                <Text textStyle="hint">
                    Log in to keep your plans, pets and timer settings in your
                    account, on every device. Only for people on the list.
                </Text>

                {auth.error && (
                    <Text textStyle="caption" color="app.danger">
                        {auth.error}
                    </Text>
                )}

                <Button variant="secondary" size="xs" onClick={handleSignIn}>
                    <Icon>
                        <FaDiscord />
                    </Icon>
                    Log in with Discord
                </Button>
            </Flex>
        )
    }

    return (
        <Flex w="full" flexDir="column" gap="2">
            <Flex alignItems="center" justifyContent="space-between" gap="3">
                <Text fontSize="sm" fontWeight="semibold" truncate>
                    {auth.name}
                </Text>

                <Button variant="ghost" size="xs" onClick={handleSignOut}>
                    Log out
                </Button>
            </Flex>

            <Text
                textStyle="caption"
                color={
                    syncStatus.state === "error" ||
                    syncStatus.state === "conflict"
                        ? "app.danger"
                        : undefined
                }
            >
                {getSyncText(syncStatus)}
            </Text>

            {syncStatus.state === "error" && (
                <Button
                    variant="secondary"
                    size="xs"
                    alignSelf="flex-start"
                    onClick={handleRetry}
                >
                    Try again
                </Button>
            )}

            {syncStatus.state === "conflict" && (
                <Button
                    variant="secondary"
                    size="xs"
                    alignSelf="flex-start"
                    onClick={handleChoose}
                >
                    Choose what to keep
                </Button>
            )}
        </Flex>
    )
}
