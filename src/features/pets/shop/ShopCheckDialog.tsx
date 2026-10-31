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
import { BOUGHT_SOULS, getPetSouls, MAX_PET_SOULS } from "@pets/logic/petLevels"
import { summarizeShop } from "@pets/logic/shopCheck"
import {
    countShopSources,
    filterShopPets,
    type ShopSourceId,
} from "@pets/logic/shopFilters"
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
    const { levels, souls, changeSouls } = usePetCollection()

    const readFile = async (file: File) => {
        const prints = await loadPetPrints(atlas.pets, SHOP_LAYOUT)

        return readShopScreenshot(file, prints)
    }

    const { readings, progress, skippedFiles, readFiles, reset } =
        useScreenshotReader(readFile)

    // The tooltip and the dialog share one trigger button.
    const triggerId = useId()

    const [open, setOpen] = useState(false)
    // Kept between checks, so the same filters apply to the next shop.
    const [sources, setSources] = useState<ShopSourceId[]>([])
    // Pets flagged as bought in this check, with their souls before, so
    // unflagging restores them even after a cap.
    const [bought, setBought] = useState<Record<string, number>>({})

    const close = () => {
        setOpen(false)
        setBought({})
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

    const handleSourceChange = (source: ShopSourceId, picked: boolean) => {
        setSources((current) => {
            const others = current.filter((id) => id !== source)

            return picked ? [...others, source] : others
        })
    }

    const handleBoughtChange = (petId: number, flagged: boolean) => {
        const next = { ...bought }

        if (flagged) {
            const before = getPetSouls(levels, souls, petId)

            next[petId] = before
            changeSouls([
                {
                    petId: petId,
                    souls: Math.min(before + BOUGHT_SOULS, MAX_PET_SOULS),
                },
            ])
        } else {
            changeSouls([{ petId: petId, souls: bought[petId] }])
            delete next[petId]
        }

        setBought(next)
    }

    const summary = summarizeShop(readings, atlas.pets, levels, souls, bought)
    // The source chips filter only the pets worth buying.
    const shownNeeded = filterShopPets(atlas, summary.needed, sources)
    const sourceCounts = countShopSources(atlas, summary.needed)
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
                                    shownNeeded={shownNeeded}
                                    sources={sources}
                                    sourceCounts={sourceCounts}
                                    bought={bought}
                                    skippedFiles={skippedFiles}
                                    onSourceChange={handleSourceChange}
                                    onBoughtChange={handleBoughtChange}
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
