import {
    closeSyncConflict,
    resolveSyncConflict,
    type SyncConflict,
} from "@account/sync/cloudSync"
import { summarizeConflicts } from "@account/sync/conflictSummary"
import {
    Box,
    Button,
    CloseButton,
    Dialog,
    Flex,
    Grid,
    Portal,
    Text,
} from "@chakra-ui/react"
import { ConflictRow } from "./ConflictRow"

type SyncConflictDialogProps = {
    conflicts: SyncConflict[]
    open: boolean
}

// Shown on login when this device and the account changed the same data.
export const SyncConflictDialog = ({
    conflicts,
    open,
}: SyncConflictDialogProps) => {
    const handleOpenChange = (details: Dialog.OpenChangeDetails) => {
        if (!details.open) {
            closeSyncConflict()
        }
    }

    const handleKeepDevice = () => {
        resolveSyncConflict("device")
    }

    const handleKeepAccount = () => {
        resolveSyncConflict("account")
    }

    const handleMerge = () => {
        resolveSyncConflict("merge")
    }

    const rows = summarizeConflicts(conflicts)

    return (
        <Dialog.Root
            size="md"
            open={open}
            scrollBehavior="inside"
            onOpenChange={handleOpenChange}
        >
            <Portal>
                <Dialog.Backdrop />

                <Dialog.Positioner>
                    <Dialog.Content bg="app.panel">
                        <Dialog.Header>
                            <Dialog.Title>
                                This device and your account differ
                            </Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <Flex flexDir="column" gap="4">
                                <Text textStyle="hint">
                                    Pick what to keep. Data only one side has is
                                    kept either way.
                                </Text>

                                <Grid
                                    templateColumns="auto 1fr 1fr"
                                    alignItems="baseline"
                                    columnGap="4"
                                    rowGap="3"
                                >
                                    <Box />

                                    <Text textStyle="label">This device</Text>

                                    <Text textStyle="label">Account</Text>

                                    {rows.map((row) => (
                                        <ConflictRow key={row.id} row={row} />
                                    ))}
                                </Grid>

                                <Text textStyle="hint">
                                    Merge keeps the saved plans and history of
                                    both, and each pet's higher level. Other
                                    settings come from the side edited last.
                                </Text>
                            </Flex>
                        </Dialog.Body>

                        <Dialog.Footer flexWrap="wrap" gap="2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleKeepDevice}
                            >
                                Keep this device
                            </Button>

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleKeepAccount}
                            >
                                Keep account
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleMerge}
                            >
                                Merge both
                            </Button>
                        </Dialog.Footer>

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}
