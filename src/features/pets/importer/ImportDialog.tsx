import {
    Button,
    CloseButton,
    Dialog,
    Flex,
    Icon,
    IconButton,
    Portal,
    Text,
} from "@chakra-ui/react"
import type { PetAtlas } from "@pets/data/petAtlas"
import { usePetCollection } from "@pets/hooks/usePetCollection"
import { useScreenshotReader } from "@pets/hooks/useScreenshotReader"
import { COLLECTION_LAYOUT } from "@pets/logic/cardMatching"
import { summarizeImport } from "@pets/logic/screenshotImport"
import { Tooltip } from "@ui/tooltip"
import { useId, useState, type ClipboardEvent } from "react"
import { LuImageUp } from "react-icons/lu"
import { AddScreenshotsButton } from "@common/AddScreenshotsButton"
import { ImportCardWarning } from "./ImportCardWarning"
import { ScreenshotDropzone } from "@common/ScreenshotDropzone"
import { ScreenshotProgress } from "@common/ScreenshotProgress"
import { ImportReview } from "./ImportReview"
import { ImportSteps } from "./ImportSteps"
import { loadPetPrints, preloadPetPrints } from "./loadPetPrints"
import { readScreenshot } from "./readScreenshot"

type ImportDialogProps = {
    atlas: PetAtlas
}

// Sets pet levels and souls from screenshots of the game's Pets grid, after a review.
export const ImportDialog = ({ atlas }: ImportDialogProps) => {
    const { levels, souls, changeSouls } = usePetCollection()
    const readFile = async (file: File) => {
        const prints = await loadPetPrints(atlas.pets, COLLECTION_LAYOUT)

        return readScreenshot(file, prints)
    }

    const { readings, progress, skippedFiles, readFiles, reset } =
        useScreenshotReader(readFile)

    // The tooltip and the dialog share one trigger button.
    const triggerId = useId()

    const [open, setOpen] = useState(false)
    // Pets the user unticked in the review.
    const [excluded, setExcluded] = useState<number[]>([])
    // Total souls the user corrected in the review, by pet id.
    const [edits, setEdits] = useState<Record<string, number>>({})

    const close = () => {
        setOpen(false)
        setExcluded([])
        setEdits({})
        reset()
    }

    const handleOpenChange = (details: Dialog.OpenChangeDetails) => {
        if (details.open) {
            setOpen(true)
            preloadPetPrints(atlas.pets, COLLECTION_LAYOUT)
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

    const handleCheckedChange = (petId: number, checked: boolean) => {
        setExcluded((previous) => {
            return checked
                ? previous.filter((id) => id !== petId)
                : [...previous, petId]
        })
    }

    const handleSoulsChange = (petId: number, souls: number) => {
        setEdits((previous) => {
            return { ...previous, [petId]: souls }
        })
    }

    const handleApply = () => {
        changeSouls(
            selected.map((change) => ({
                petId: change.pet.id,
                souls: edits[change.pet.id] ?? change.souls,
            })),
        )
        close()
    }

    const summary = summarizeImport(readings, atlas.pets, levels, souls)
    const selected = summary.changes.filter((change) => {
        return !excluded.includes(change.pet.id)
    })
    const hasResults = readings.length > 0 || skippedFiles.length > 0

    return (
        <Dialog.Root
            ids={{ trigger: triggerId }}
            size="lg"
            open={open}
            scrollBehavior="inside"
            onOpenChange={handleOpenChange}
        >
            <Tooltip
                ids={{ trigger: triggerId }}
                content="Import levels from screenshots"
                openDelay={300}
            >
                <Dialog.Trigger asChild>
                    <IconButton
                        minW="6"
                        h="6"
                        variant="ghost"
                        size="xs"
                        color="app.muted"
                        aria-label="Import levels from screenshots"
                    >
                        <Icon boxSize="4">
                            <LuImageUp />
                        </Icon>
                    </IconButton>
                </Dialog.Trigger>
            </Tooltip>

            <Portal>
                <Dialog.Backdrop />

                <Dialog.Positioner>
                    <Dialog.Content bg="app.panel" onPaste={handlePaste}>
                        <Dialog.Header>
                            <Dialog.Title>
                                Import levels from screenshots
                            </Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            {progress ? (
                                <ScreenshotProgress
                                    done={progress.done}
                                    total={progress.total}
                                />
                            ) : hasResults ? (
                                <ImportReview
                                    summary={summary}
                                    excluded={excluded}
                                    edits={edits}
                                    skippedFiles={skippedFiles}
                                    onCheckedChange={handleCheckedChange}
                                    onSoulsChange={handleSoulsChange}
                                />
                            ) : (
                                <Flex flexDir="column" gap="4">
                                    <ImportSteps />

                                    <ImportCardWarning />

                                    <ScreenshotDropzone onFiles={handleFiles} />

                                    <Text textStyle="hint">
                                        You review every change before it's
                                        saved. Pets missing from every
                                        screenshot stay as they are.
                                    </Text>
                                </Flex>
                            )}
                        </Dialog.Body>

                        {hasResults && !progress && (
                            <Dialog.Footer
                                flexWrap="wrap"
                                justifyContent="space-between"
                                gap="2"
                            >
                                <AddScreenshotsButton onFiles={handleFiles} />

                                <Flex gap="2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={close}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={selected.length === 0}
                                        onClick={handleApply}
                                    >
                                        Apply {selected.length}{" "}
                                        {selected.length === 1
                                            ? "change"
                                            : "changes"}
                                    </Button>
                                </Flex>
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
