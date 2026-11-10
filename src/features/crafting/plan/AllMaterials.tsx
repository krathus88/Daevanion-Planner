import { Section } from "@common/Section"
import type { CraftingData } from "@crafting/data/craftingData"
import type { CraftPlan } from "@crafting/logic/craftPlan"
import {
    getMaterialIndex,
    type MaterialScope,
} from "@crafting/logic/materialOrder"
import type { PlanSettings } from "@crafting/types"
import { useState } from "react"
import { MaterialList } from "./MaterialList"
import { MaterialScopeSwitch } from "./MaterialScopeSwitch"

type AllMaterialsProps = {
    data: CraftingData
    plan: CraftPlan
    settings: PlanSettings
    onOwnedChange: (itemId: number, owned: number) => void
    onPriceChange: (itemId: number, price: number | null) => void
    onBoughtChange: (itemId: number, bought: boolean) => void
    onItemSelect: (itemId: number) => void
}

// Every item the plan uses, closed by default: the main craft's own
// materials first, or the whole chain's.
export const AllMaterials = ({
    data,
    plan,
    settings,
    onOwnedChange,
    onPriceChange,
    onBoughtChange,
    onItemSelect,
}: AllMaterialsProps) => {
    const [scope, setScope] = useState<MaterialScope>("craft")
    const rows = getMaterialIndex(data, settings, plan, scope)

    return (
        <Section title="All materials" defaultOpen={false} count={rows.length}>
            <MaterialScopeSwitch value={scope} onChange={setScope} />

            <MaterialList
                rows={rows}
                settings={settings}
                onOwnedChange={onOwnedChange}
                onPriceChange={onPriceChange}
                onBoughtChange={onBoughtChange}
                onItemSelect={onItemSelect}
            />
        </Section>
    )
}
