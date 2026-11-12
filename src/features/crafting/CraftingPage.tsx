import { CompanionNote } from "@account/CompanionNote"
import { getPlayingCharacter } from "@account/game/playingCharacter"
import { CompanionLockedContext } from "@account/companionLockedContext"
import { useCompanionFills } from "@account/hooks/useCompanionFills"
import { useCompanionStatus } from "@account/hooks/useCompanionStatus"
import { Container, Flex, Grid, Heading, Link, Text } from "@chakra-ui/react"
import type { CategoryId, ProfessionId } from "@crafting/config/professions"
import { getItem } from "@crafting/data/craftingData"
import { RecipeFinder } from "@crafting/finder/RecipeFinder"
import { useCraftingSettings } from "@crafting/hooks/useCraftingSettings"
import { useGameCharacters } from "@crafting/hooks/useGameCharacters"
import { useMarketPrices } from "@crafting/hooks/useMarketPrices"
import { useSharedPrices } from "@crafting/hooks/useSharedPrices"
import { getPlanItemIds } from "@crafting/logic/planItems"
import { pickPrices } from "@crafting/logic/prices"
import {
    filterRecipeEntries,
    getListedId,
    getRecipeEntries,
    getStartWindow,
    type CraftingWindow,
} from "@crafting/logic/recipeList"
import { CraftPlanPanel } from "@crafting/plan/CraftPlanPanel"
import type { PlanSettings } from "@crafting/types"
import { getRouteApi } from "@tanstack/react-router"
import { ServerSelect } from "@timers/bosses/ServerSelect"
import { getServer } from "@timers/config/servers"
import { useDeferredValue, useEffect, useEffectEvent, useState } from "react"
import { CharacterSelect } from "./CharacterSelect"
import { NoRecipeSelected } from "./NoRecipeSelected"
import { PriceSharingNote } from "./PriceSharingNote"

const route = getRouteApi("/crafting")

export const CraftingPage = () => {
    const data = route.useLoaderData()
    const search = route.useSearch()
    const navigate = route.useNavigate()
    const {
        settings,
        sharing,
        changeServer,
        changeCharacter,
        selectPlaying,
        changeOwned,
        changePrice,
        changeSuccess,
        changeBought,
        changeProficiency,
    } = useCraftingSettings()
    const sharedPrices = useSharedPrices(settings.server)
    const characters = useGameCharacters(settings.server)
    const companion = useCompanionStatus()
    // While the companion app runs, bag counts come from the game.
    const ownedLocked = useCompanionFills(companion, "items", settings.server)
    // The chosen character's crafting levels ("" matches no character).
    const proficiencyLocked = useCompanionFills(
        companion,
        "professions",
        settings.server,
        settings.character ?? "",
    )
    const playing = getPlayingCharacter(companion)
    const playingName = playing?.name ?? null
    const playingServer = playing?.server ?? null
    // Aion2Market's prices for the open item's whole recipe tree.
    const marketPrices = useMarketPrices(
        search.item !== undefined && data.recipes.has(search.item)
            ? getPlanItemIds(data, search.item)
            : [],
    )

    const [craftWindow, setCraftWindow] = useState<CraftingWindow>(() => {
        return getStartWindow(data, search.item)
    })
    const [query, setQuery] = useState("")
    const [profession, setProfession] = useState<ProfessionId | null>(null)
    const [category, setCategory] = useState<CategoryId | null>(null)

    const deferredQuery = useDeferredValue(query)

    // Picks the character the game says is being played, once per change, so
    // a pick made by hand stays until the next character.
    const selectPlayingCharacter = useEffectEvent(
        (server: string, name: string) => {
            selectPlaying(server, name)
        },
    )

    useEffect(() => {
        document.title = "Daevanion - Crafting"
    }, [])

    useEffect(() => {
        if (playingServer !== null && playingName !== null) {
            selectPlayingCharacter(playingServer, playingName)
        }
    }, [playingServer, playingName])

    // Each profession has its own tabs.
    const handleProfessionChange = (next: ProfessionId | null) => {
        setProfession(next)
        setCategory(null)
    }

    // From the list or a Crafted from link: the list switches to the item's
    // window so its row shows.
    const handleSelect = (itemId: number) => {
        setCraftWindow(getStartWindow(data, itemId))
        navigate({
            search: { item: itemId },
            resetScroll: false,
        })
    }

    const handleCountChange = (count: number) => {
        navigate({
            search: (previous) => {
                return { ...previous, count: count > 1 ? count : undefined }
            },
            replace: true,
            resetScroll: false,
        })
    }

    const server = getServer(settings.server)
    const entries = filterRecipeEntries(
        getRecipeEntries(data, server.faction),
        craftWindow,
        deferredQuery,
        profession,
        category,
    )
    const recipe =
        search.item === undefined ? undefined : data.recipes.get(search.item)
    const planSettings: PlanSettings = {
        owned: settings.owned,
        prices: pickPrices(settings.prices[server.id], sharedPrices),
        marketPrices: marketPrices.prices,
        pendingPrices: marketPrices.pending,
        bought: settings.bought,
        success: settings.success,
        proficiency: settings.proficiency,
    }

    return (
        <CompanionLockedContext value={ownedLocked}>
            <Container
                as="main"
                py={{ base: "4", md: "6" }}
                maxW="8xl"
                flex="1"
            >
                <Flex flexDir="column" gap="5">
                    <Flex
                        flexWrap="wrap"
                        alignItems="flex-end"
                        justifyContent="space-between"
                        gap="3"
                    >
                        <Flex flexDir="column" gap="1">
                            <Heading size="lg">Crafting</Heading>

                            <Text textStyle="hint">
                                What an item takes to craft, what you still
                                need, and what it costs.
                            </Text>

                            <PriceSharingNote
                                serverName={server.name}
                                sharing={sharing}
                            />

                            <CompanionNote status={companion} />
                        </Flex>

                        <Flex flexWrap="wrap" gap="2">
                            {characters.length > 0 && (
                                <CharacterSelect
                                    value={settings.character}
                                    characters={characters}
                                    onChange={changeCharacter}
                                />
                            )}

                            <ServerSelect
                                value={server.id}
                                onChange={changeServer}
                            />
                        </Flex>
                    </Flex>

                    <Grid
                        templateColumns={{
                            base: "minmax(0, 1fr)",
                            lg: "auto 1fr",
                        }}
                        alignItems="start"
                        gap="4"
                    >
                        <RecipeFinder
                            entries={entries}
                            craftWindow={craftWindow}
                            query={query}
                            profession={profession}
                            category={category}
                            selectedId={
                                recipe
                                    ? getListedId(data, recipe.id)
                                    : undefined
                            }
                            onWindowChange={setCraftWindow}
                            onQueryChange={setQuery}
                            onProfessionChange={handleProfessionChange}
                            onCategoryChange={setCategory}
                            onSelect={handleSelect}
                        />

                        {recipe ? (
                            <CraftPlanPanel
                                data={data}
                                item={getItem(data, recipe.id)}
                                recipe={recipe}
                                count={search.count ?? 1}
                                settings={planSettings}
                                proficiencyLocked={proficiencyLocked}
                                onCountChange={handleCountChange}
                                onOwnedChange={changeOwned}
                                onSuccessChange={changeSuccess}
                                onPriceChange={changePrice}
                                onBoughtChange={changeBought}
                                onProficiencyChange={changeProficiency}
                                onItemSelect={handleSelect}
                            />
                        ) : (
                            <NoRecipeSelected />
                        )}
                    </Grid>

                    <Text textStyle="hint">
                        Recipes from the{" "}
                        <Link
                            href="https://aion2hub.com/tools/crafting-calculator"
                            color="app.muted"
                            target="_blank"
                            rel="noreferrer"
                        >
                            AION 2 Hub crafting calculator
                        </Link>
                        , read {data.fetched}. Prices from{" "}
                        <Link
                            href="https://aion2.exchange/"
                            color="app.muted"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Aion2Market
                        </Link>
                        . Item icons © NCSOFT.
                    </Text>
                </Flex>
            </Container>
        </CompanionLockedContext>
    )
}
