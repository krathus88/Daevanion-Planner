import { Flex, Grid, Text } from "@chakra-ui/react"
import type { ImportSummary } from "@pets/logic/screenshotImport"
import { ImportChangeTile } from "./ImportChangeTile"

type ImportReviewProps = {
    summary: ImportSummary
    // Pets the user unticked.
    excluded: number[]
    skippedFiles: string[]
    onCheckedChange: (petId: number, checked: boolean) => void
}

export const ImportReview = ({
    summary,
    excluded,
    skippedFiles,
    onCheckedChange,
}: ImportReviewProps) => {
    const changeCount = summary.changes.length
    const readCount = changeCount + summary.unchanged

    return (
        <Flex flexDir="column" gap="3">
            <Flex flexDir="column" gap="1">
                <Text fontSize="sm">
                    Read {readCount} {readCount === 1 ? "pet" : "pets"}:{" "}
                    {changeCount} to update, {summary.unchanged} already match.
                    Pets in no screenshot keep their level.
                </Text>

                {summary.unknown > 0 && (
                    <Text textStyle="hint">
                        {summary.unknown}{" "}
                        {summary.unknown === 1 ? "card" : "cards"} didn't match
                        any pet and were skipped.
                    </Text>
                )}

                {skippedFiles.length > 0 && (
                    <Text textStyle="hint">
                        No pet cards found in {skippedFiles.join(", ")}.
                    </Text>
                )}
            </Flex>

            {changeCount > 0 ? (
                <Grid
                    templateColumns="repeat(auto-fill, minmax(9.5rem, 1fr))"
                    gap="2"
                >
                    {summary.changes.map((change) => (
                        <ImportChangeTile
                            key={change.pet.id}
                            change={change}
                            checked={!excluded.includes(change.pet.id)}
                            onCheckedChange={onCheckedChange}
                        />
                    ))}
                </Grid>
            ) : (
                <Text py="4" color="app.muted" fontSize="sm">
                    Every pet read already has this level here.
                </Text>
            )}
        </Flex>
    )
}
