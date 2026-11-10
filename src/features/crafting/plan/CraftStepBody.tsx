import { Flex, Text } from "@chakra-ui/react"
import type { CraftingData } from "@crafting/data/craftingData"
import { getPrice, type CraftStep } from "@crafting/logic/craftPlan"
import { getTreeLines, type PlanIndex } from "@crafting/logic/craftTree"
import { describeCombo, describeStepStatus } from "@crafting/logic/stepLabels"
import { describeSuccess, getSuccessInfo } from "@crafting/logic/successChance"
import { isTradable } from "@crafting/logic/tradable"
import type { PlanSettings } from "@crafting/types"
import { ItemText } from "@crafting/mention/ItemText"
import { CraftStepFields } from "./CraftStepFields"
import { CraftTreeHeader } from "./CraftTreeHeader"
import { CraftTreeLines } from "./CraftTreeLines"
import type { PlanHandlers } from "./planHandlers"

type CraftStepBodyProps = {
    data: CraftingData
    step: CraftStep
    settings: PlanSettings
    index: PlanIndex
    isTarget: boolean
    handlers: PlanHandlers
}

// A crafted item opened in the tree: how many crafts, its fields, then what
// each craft of it uses (lines that open in turn).
export const CraftStepBody = ({
    data,
    step,
    settings,
    index,
    isTarget,
    handlers,
}: CraftStepBodyProps) => {
    const success = getSuccessInfo(data, settings, step.recipe)
    const combo = describeCombo(data, step)
    // The "set your proficiency" note once, on the main craft.
    const successText =
        success.source === "unknown" && !isTarget
            ? null
            : describeSuccess(success, step.recipe)

    return (
        <Flex flexDir="column" gap="2.5">
            <Text color="app.fg" fontSize="sm">
                {describeStepStatus(step, isTarget, success)}
            </Text>

            {/* Fields right under the status, so Buy instead stays put when
            it swaps this body for the bought one. */}
            <CraftStepFields
                step={step}
                isTarget={isTarget}
                tradable={isTradable(data, step.item.id)}
                owned={settings.owned[step.item.id] ?? 0}
                success={success}
                manualSuccess={settings.success[step.item.id] ?? null}
                price={getPrice(settings, step.item.id)}
                handlers={handlers}
            />

            {combo && (
                <Text textStyle="hint">
                    <ItemText parts={combo} />
                </Text>
            )}

            {successText && <Text textStyle="hint">{successText}</Text>}

            <Flex flexDir="column" gap="1">
                <CraftTreeHeader />

                <CraftTreeLines
                    data={data}
                    lines={getTreeLines(data, settings, index, step.recipe)}
                    settings={settings}
                    index={index}
                    handlers={handlers}
                />
            </Flex>
        </Flex>
    )
}
