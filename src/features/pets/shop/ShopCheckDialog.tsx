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
import { AddScreenshotsButton } from "@common/AddScreenshotsButton"
import { ScreenshotDropzone } from "@common/ScreenshotDropzone"
import { ScreenshotProgress } from "@common/ScreenshotProgress"
import type { PetAtlas } from "@pets/data/petAtlas"
import { usePetCollection } from "@pets/hooks/usePetCollection"
import { useScreenshotReader } from "@pets/hooks/useScreenshotReader"
import { loadPetPrints, preloadPetPrints } from "@pets/importer/loadPetPrints"
import { SHOP_LAYOUT } from "@pets/logic/cardMatching"
import { summarizeShop } from "@pets/logic/shopCheck"
import { Tooltip } from "@ui/tooltip"
import { useId, useState, type ClipboardEvent } from "react"
import { LuStore } from "react-icons/lu"
import { readShopScreenshot } from "./readShopScreenshot"
import { ShopResults } from "./ShopResults"
import { ShopSteps } from "./ShopSteps"

type ShopCheckDialogProps = {
    atlas: PetAtlas
}

// Reads a screenshot of the game Shop's Pets tab and lists which pets on sale
// are still below Insight Lv3.
export const ShopCheckDialog = ({ atlas }: ShopCheckDialogProps) => {
    const { levels } = usePetCollection()

    const readFile = async (file: File) => {
        const prints = await loadPetPrints(atlas.pets, SHOP_LAYOUT)

        return readShopScreenshot(file, prints)
    }

    const { readings, progress, skippedFiles, readFiles, reset } =
        useScreenshotReader(readFile)

    // The tooltip and the dialog share one trigger button.
    const triggerId = useId()

    const [open, setOpen] = useState(false)

    const close = () => {
        setOpen(false)
        reset()
    }

    const handleOpenChange = (details: Dialog.OpenChangeDetails) => {
        if (details.open) {
            setOpen(true)
            preloadPetPrints(atlas.pets, SHOP_LAYOUT)
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

    const summary = summarizeShop(readings, atlas.pets, levels)
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
                content="Check the pet shop"
                openDelay={300}
            >
                <Dialog.Trigger asChild>
                    <IconButton
                        minW="6"
                        h="6"
                        variant="ghost"
                        size="xs"
                        color="app.muted"
                        aria-label="Check the pet shop"
                    >
                        <Icon boxSize="4">
                            <LuStore />
                        </Icon>
                    </IconButton>
                </Dialog.Trigger>
            </Tooltip>

            <Portal>
                <Dialog.Backdrop />

                <Dialog.Positioner>
                    <Dialog.Content bg="app.panel" onPaste={handlePaste}>
                        <Dialog.Header>
                            <Dialog.Title>Check the pet shop</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            {progress ? (
                                <ScreenshotProgress
                                    done={progress.done}
                                    total={progress.total}
                                />
                            ) : hasResults ? (
                                <ShopResults
                                    summary={summary}
                                    skippedFiles={skippedFiles}
                                />
                            ) : (
                                <Flex flexDir="column" gap="4">
                                    <ShopSteps />

                                    <ScreenshotDropzone onFiles={handleFiles} />

                                    <Text textStyle="hint">
                                        Each pet on sale is checked against the
                                        levels saved on this page, so keep them
                                        up to date or import them first.
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

                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={close}
                                >
                                    Done
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
