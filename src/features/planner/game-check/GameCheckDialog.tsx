import {
    Button,
    CloseButton,
    Dialog,
    Flex,
    Portal,
    Text,
} from "@chakra-ui/react"
import { AddScreenshotsButton } from "@common/AddScreenshotsButton"
import { ScreenshotDropzone } from "@common/ScreenshotDropzone"
import { ScreenshotProgress } from "@common/ScreenshotProgress"
import { useBoard } from "@planner/context/boardContext"
import { useGameScreenshots } from "@planner/hooks/useGameScreenshots"
import type { ClipboardEvent } from "react"
import { GameCheckResults } from "./GameCheckResults"
import { GameCheckSteps } from "./GameCheckSteps"

type GameCheckDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

// Reads boards from game screenshots. Each board read replaces that board's
// last reading straight away; nothing of the plan changes.
export const GameCheckDialog = ({
    open,
    onOpenChange,
}: GameCheckDialogProps) => {
    const { gameCheck } = useBoard()
    const { results, progress, readFiles, reset } = useGameScreenshots(
        gameCheck.addReading,
    )

    const close = () => {
        onOpenChange(false)
        reset()
    }

    const handleOpenChange = (details: Dialog.OpenChangeDetails) => {
        if (details.open) {
            onOpenChange(true)
        } else {
            close()
        }
    }

    const handleFiles = (files: File[]) => {
        void readFiles(files)
    }

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
        const files = [...event.clipboardData.files].filter((file) => {
            return file.type.startsWith("image/")
        })

        if (files.length > 0) {
            event.preventDefault()
            void readFiles(files)
        }
    }

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
                    <Dialog.Content bg="app.panel" onPaste={handlePaste}>
                        <Dialog.Header>
                            <Dialog.Title>Check against the game</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            {progress ? (
                                <ScreenshotProgress
                                    done={progress.done}
                                    total={progress.total}
                                />
                            ) : results.length > 0 ? (
                                <GameCheckResults results={results} />
                            ) : (
                                <Flex flexDir="column" gap="4">
                                    <GameCheckSteps />

                                    <ScreenshotDropzone onFiles={handleFiles} />

                                    <Text textStyle="hint">
                                        Each board is found by its shape and
                                        compared with what that board shows
                                        here. Your plans don't change.
                                    </Text>
                                </Flex>
                            )}
                        </Dialog.Body>

                        {results.length > 0 && !progress && (
                            <Dialog.Footer
                                flexWrap="wrap"
                                justifyContent="space-between"
                                gap="2"
                            >
                                <AddScreenshotsButton onFiles={handleFiles} />

                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={close}
                                >
                                    Show on the board
                                </Button>
                            </Dialog.Footer>
                        )}

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}
