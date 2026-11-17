import { groupRecipeEntries } from "@crafting/logic/recipeGroups"
import type { RecipeEntry } from "@crafting/logic/recipeList"
import { RecipeGroupRows } from "./RecipeGroupRows"

type RecipeListProps = {
    entries: RecipeEntry[]
    // The starred sections' keys in this window.
    favoriteKeys: readonly string[]
    selectedId?: number
    onSelect: (itemId: number) => void
    onFavoriteChange: (groupKey: string, favorite: boolean) => void
}

// The recipes under their tab headings, starred ones first.
export const RecipeList = ({
    entries,
    favoriteKeys,
    selectedId,
    onSelect,
    onFavoriteChange,
}: RecipeListProps) => {
    return groupRecipeEntries(entries, favoriteKeys).map((group) => (
        <RecipeGroupRows
            key={group.key}
            group={group}
            selectedId={selectedId}
            onSelect={onSelect}
            onFavoriteChange={onFavoriteChange}
        />
    ))
}
