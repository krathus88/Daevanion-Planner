import type { CraftingData } from "@crafting/data/craftingData"
import type { PlanIndex, TreeLine } from "@crafting/logic/craftTree"
import type { PlanSettings } from "@crafting/types"
import { CraftTreeLine } from "./CraftTreeLine"
import type { PlanHandlers } from "./planHandlers"

type CraftTreeLinesProps = {
    data: CraftingData
    lines: TreeLine[]
    settings: PlanSettings
    index: PlanIndex
    handlers: PlanHandlers
}

export const CraftTreeLines = ({
    data,
    lines,
    settings,
    index,
    handlers,
}: CraftTreeLinesProps) => {
    return lines.map((line) => (
        <CraftTreeLine
            key={line.item.id}
            data={data}
            line={line}
            settings={settings}
            index={index}
            handlers={handlers}
        />
    ))
}
