import { collapsibleSlotRecipe } from "./collapsible"
import { fieldSlotRecipe } from "./field"
import { nativeSelectSlotRecipe } from "./native-select"
import { progressSlotRecipe } from "./progress"
import { segmentGroupSlotRecipe } from "./segment-group"
import { selectSlotRecipe } from "./select"
import { switchSlotRecipe } from "./switch"
import { tabsSlotRecipe } from "./tabs"
import { tooltipSlotRecipe } from "./tooltip"

export const slotRecipes = {
    collapsible: collapsibleSlotRecipe,
    field: fieldSlotRecipe,
    nativeSelect: nativeSelectSlotRecipe,
    progress: progressSlotRecipe,
    segmentGroup: segmentGroupSlotRecipe,
    select: selectSlotRecipe,
    switch: switchSlotRecipe,
    tabs: tabsSlotRecipe,
    tooltip: tooltipSlotRecipe,
}
