import { Button, Flex, Input, Switch, Text } from "@chakra-ui/react"
import type { BoardId } from "@config/boards"
import { CLASS_NAMES } from "@config/classPresets"
import { StatusText } from "@common/StatusText"
import { useState, type ChangeEvent } from "react"
import { BackToMyPlansLink } from "./BackToMyPlansLink"
import { defaultSharedName, saveSharedPlan, type SharedPlan } from "./shareCode"

type SharedPlanSaveProps = {
    plan: SharedPlan
    layout: BoardId
}

// Copies the shared plan into the viewer's saved lists, under a name they
// can change. Their priorities are only replaced if they ask.
export const SharedPlanSave = ({ plan, layout }: SharedPlanSaveProps) => {
    const defaultName = defaultSharedName(plan)
    const [name, setName] = useState(defaultName)
    const [includeSettings, setIncludeSettings] = useState(false)
    const [result, setResult] = useState<
        { summary: string } | { error: string } | null
    >(null)

    const className = CLASS_NAMES[plan.classId]
    const isSaved = result !== null && "summary" in result
    const trimmedName = name.trim()

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value)
    }

    const handleCheckedChange = (details: Switch.CheckedChangeDetails) => {
        setIncludeSettings(details.checked)
    }

    const handleSave = () => {
        // The suggested name is tagged so it's clear where it came from; a
        // typed name is kept as is.
        setResult(
            saveSharedPlan(
                plan,
                trimmedName === defaultName
                    ? `${defaultName} (shared)`
                    : trimmedName,
                includeSettings,
            ),
        )
    }

    return (
        <Flex flexDir="column" gap="3">
            <Flex flexDir="column" gap="1">
                <Text textStyle="label">Save as</Text>

                <Input
                    size="sm"
                    value={name}
                    disabled={isSaved}
                    aria-label="Name for the saved plan"
                    onChange={handleNameChange}
                />
            </Flex>

            {plan.settings && (
                <Flex flexDir="column" gap="1">
                    <Switch.Root
                        size="sm"
                        checked={includeSettings}
                        disabled={isSaved}
                        onCheckedChange={handleCheckedChange}
                    >
                        <Switch.HiddenInput />

                        <Switch.Control />

                        <Switch.Label>
                            Also use the shared priorities
                        </Switch.Label>
                    </Switch.Root>

                    <Text textStyle="hint">
                        Replaces your {className} optimizer priorities.
                    </Text>
                </Flex>
            )}

            <Flex flexWrap="wrap" gap="2">
                <Button
                    variant="primary"
                    size="sm"
                    disabled={isSaved || !trimmedName}
                    onClick={handleSave}
                >
                    {isSaved ? "Saved" : "Save to my plans"}
                </Button>

                <BackToMyPlansLink classId={plan.classId} layout={layout} />
            </Flex>

            {result && (
                <StatusText tone={"error" in result ? "danger" : "muted"}>
                    {"error" in result ? result.error : result.summary}
                </StatusText>
            )}
        </Flex>
    )
}
