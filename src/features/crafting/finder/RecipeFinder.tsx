import { Flex, Grid, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { SearchField } from "@common/SearchField"
import type { CategoryId, ProfessionId } from "@crafting/config/professions"
import { useScrollToSelected } from "@crafting/hooks/useScrollToSelected"
import { useWindowScroll } from "@crafting/hooks/useWindowScroll"
import type { CraftingWindow, RecipeEntry } from "@crafting/logic/recipeList"
import { useRef } from "react"
import { CategorySelect } from "./CategorySelect"
import { ProfessionSelect } from "./ProfessionSelect"
import { RecipeList } from "./RecipeList"
import { WindowSwitch } from "./WindowSwitch"

type RecipeFinderProps = {
    entries: RecipeEntry[]
    craftWindow: CraftingWindow
    query: string
    profession: ProfessionId | null
    // The profession's tab; null is All.
    category: CategoryId | null
    // The picked character's starred sections in this window, listed first.
    favoriteKeys: readonly string[]
    selectedId?: number
    onWindowChange: (craftWindow: CraftingWindow) => void
    onQueryChange: (query: string) => void
    onProfessionChange: (profession: ProfessionId | null) => void
    onCategoryChange: (category: CategoryId | null) => void
    onSelect: (itemId: number) => void
    onFavoriteChange: (groupKey: string, favorite: boolean) => void
}

export const RecipeFinder = ({
    entries,
    craftWindow,
    query,
    profession,
    category,
    favoriteKeys,
    selectedId,
    onWindowChange,
    onQueryChange,
    onProfessionChange,
    onCategoryChange,
    onSelect,
    onFavoriteChange,
}: RecipeFinderProps) => {
    const listRef = useRef<HTMLDivElement>(null)

    const handleListScroll = useWindowScroll(listRef, craftWindow)

    useScrollToSelected(listRef, selectedId)

    return (
        <Card
            pos={{ lg: "sticky" }}
            top={{ lg: "20" }}
            w={{ base: "full", lg: "petList" }}
            maxH={{ base: "lg", lg: "sidebarMaxH" }}
        >
            <Flex alignItems="center" justifyContent="space-between" gap="2">
                <Text textStyle="label">Recipes</Text>

                <Text textStyle="caption">{entries.length} shown</Text>
            </Flex>

            <WindowSwitch value={craftWindow} onChange={onWindowChange} />

            <SearchField
                value={query}
                placeholder="Search an item"
                label="Search recipes"
                onChange={onQueryChange}
            />

            <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="2">
                <ProfessionSelect
                    value={profession}
                    onChange={onProfessionChange}
                />

                <CategorySelect
                    profession={profession}
                    value={category}
                    onChange={onCategoryChange}
                />
            </Grid>

            <Flex
                ref={listRef}
                mx="-1"
                px="1"
                minH="0"
                flex="1"
                flexDir="column"
                gap="3"
                overflowY="auto"
                onScroll={handleListScroll}
            >
                {entries.length > 0 ? (
                    <RecipeList
                        entries={entries}
                        favoriteKeys={favoriteKeys}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onFavoriteChange={onFavoriteChange}
                    />
                ) : (
                    <Text py="4" color="app.muted" fontSize="sm">
                        No recipes match. Try another name, or another tab.
                    </Text>
                )}
            </Flex>
        </Card>
    )
}
