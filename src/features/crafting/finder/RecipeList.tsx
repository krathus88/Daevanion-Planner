import { groupRecipeEntries } from "@crafting/logic/recipeGroups"
import type { RecipeEntry } from "@crafting/logic/recipeList"
import { RecipeGroupRows } from "./RecipeGroupRows"

type RecipeListProps = {
    entries: RecipeEntry[]
    selectedId?: number
    onSelect: (itemId: number) => void
}

// The recipes under their tab headings.
export const RecipeList = ({
    entries,
    selectedId,
    onSelect,
}: RecipeListProps) => {
    return groupRecipeEntries(entries).map((group) => (
        <RecipeGroupRows
            key={group.key}
            group={group}
            selectedId={selectedId}
            onSelect={onSelect}
        />
    ))
}
