import { Button, Flex, Text } from "@chakra-ui/react"
import { classPresets } from "@config/classPresets"
import { Card } from "@common/Card"
import { StatusText } from "@common/StatusText"
import {
    applyImport,
    exportBackup,
    planImport,
    type ImportPlan,
} from "@planner/backup/backupFile"
import {
    bumpStorageRevision,
    clearStorageNotice,
    useStorageRevision,
} from "@planner/storage/storageRevision"
import { useRef, useState, type ChangeEvent } from "react"

const countLabel = (count: number, one: string, many: string) => {
    return `${count} ${count === 1 ? one : many}`
}

const describeAdded = (plan: ImportPlan) => {
    const parts = [
        plan.routeCount > 0 && countLabel(plan.routeCount, "route", "routes"),
        plan.boardCount > 0 &&
            countLabel(plan.boardCount, "manual board", "manual boards"),
    ].filter(Boolean)

    return parts.length > 0 ? parts.join(" and ") : null
}

const classNames = (plan: ImportPlan) => {
    return plan.replacedClasses
        .map((classId) => classPresets[classId].name)
        .join(", ")
}

// Saves every class's plans to a file, and adds a file's plans back.
export const BackupFile = () => {
    const inputRef = useRef<HTMLInputElement>(null)
    const { notice } = useStorageRevision()
    const [pending, setPending] = useState<ImportPlan | null>(null)
    const [status, setStatus] = useState<{
        text: string
        tone: "muted" | "danger"
    } | null>(null)

    const handleExport = () => {
        clearStorageNotice()
        const result = exportBackup()
        setStatus(
            "error" in result
                ? { text: result.error, tone: "danger" }
                : { text: result.note, tone: "muted" },
        )
    }

    const handleChooseFile = () => {
        clearStorageNotice()
        inputRef.current?.click()
    }

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        // Lets the same file be picked again.
        event.target.value = ""
        if (!file) {
            return
        }

        let text: string
        try {
            text = await file.text()
        } catch {
            setStatus({ text: "Could not read that file.", tone: "danger" })
            return
        }

        const plan = planImport(text)
        if (typeof plan === "string") {
            setPending(null)
            setStatus({ text: plan, tone: "danger" })
            return
        }

        setStatus(null)
        setPending(plan)
    }

    const handleCancel = () => {
        setPending(null)
    }

    const handleConfirm = () => {
        if (!pending) {
            return
        }

        const error = applyImport(pending)
        setPending(null)
        if (error) {
            setStatus({ text: error, tone: "danger" })
            return
        }

        const added = describeAdded(pending)
        // Remounts the board, so it shows the new saved entries.
        bumpStorageRevision(
            [
                added
                    ? `Imported ${added}.`
                    : "No new routes or boards to add.",
                pending.replacedClasses.length > 0 &&
                    `Optimizer settings replaced for ${classNames(pending)}.`,
            ]
                .filter(Boolean)
                .join(" "),
        )
    }

    const added = pending && describeAdded(pending)

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="hint">
                A file with every class&apos;s saved routes, manual boards and
                optimizer priorities, to move them to another device.
            </Text>

            <Flex flexWrap="wrap" gap="2">
                <Button variant="secondary" size="xs" onClick={handleExport}>
                    Export file
                </Button>

                <Button
                    variant="secondary"
                    size="xs"
                    disabled={pending !== null}
                    onClick={handleChooseFile}
                >
                    Import file
                </Button>

                <input
                    ref={inputRef}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={handleFileChange}
                />
            </Flex>

            {pending && (
                <Card gap="2">
                    <Text fontSize="sm">
                        {added
                            ? `Adds ${added} to your saved lists, marked "(imported)".`
                            : "Every route and board in this file is already saved here."}{" "}
                        Your current boards and optimizer history stay as they
                        are.
                    </Text>

                    {pending.replacedClasses.length > 0 && (
                        <Text color="app.danger" fontSize="sm">
                            Replaces your optimizer settings (priorities and
                            point budget) for {classNames(pending)}.
                        </Text>
                    )}

                    <Flex gap="2">
                        <Button
                            variant="primary"
                            size="xs"
                            onClick={handleConfirm}
                        >
                            Import
                        </Button>

                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    </Flex>
                </Card>
            )}

            {status && (
                <StatusText tone={status.tone}>{status.text}</StatusText>
            )}

            {!status && !pending && notice && (
                <StatusText tone="muted">{notice}</StatusText>
            )}
        </Flex>
    )
}
