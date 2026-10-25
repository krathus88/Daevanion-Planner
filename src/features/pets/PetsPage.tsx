import { Container, Flex, Grid, Heading, Link, Text } from "@chakra-ui/react"
import {
    PET_CATEGORY_IDS,
    type PetCategoryId,
} from "@pets/config/petCategories"
import type { PetMapId } from "@pets/config/petMaps"
import {
    filterFarmSpots,
    getFarmSpots,
    isPetNeeded,
} from "@pets/logic/farmSpots"
import { getPetLevel } from "@pets/logic/petLevels"
import {
    filterPets,
    getMapCounts,
    getMapPins,
    getPetMapCounts,
    getPetMapSources,
} from "@pets/logic/petFinder"
import { getRouteApi } from "@tanstack/react-router"
import { useDeferredValue, useEffect, useState } from "react"
import { PetDetails } from "./details/PetDetails"
import { PetMinimized } from "./details/PetMinimized"
import { FarmSpotsMinimized } from "./farm/FarmSpotsMinimized"
import { FarmSpotsPanel } from "./farm/FarmSpotsPanel"
import { PetFinder } from "./finder/PetFinder"
import { usePetCollection } from "./hooks/usePetCollection"
import { LevelTip } from "./LevelTip"
import { PetMapPanel } from "./map/PetMapPanel"

const route = getRouteApi("/pets")

export const PetsPage = () => {
    const search = route.useSearch()
    const navigate = route.useNavigate()
    const atlas = route.useLoaderData()
    const {
        levels,
        hiddenLevels,
        minimized,
        tipDismissed,
        changeLevel,
        changeLevelHidden,
        changeMinimized,
        dismissTip,
    } = usePetCollection()

    const [query, setQuery] = useState("")
    const [category, setCategory] = useState<PetCategoryId | null>(null)
    // Best spots must still have a pet of each of these types.
    const [requiredCategories, setRequiredCategories] = useState<
        PetCategoryId[]
    >([])
    // The inputs update at once; the list, map and ranking follow when the
    // browser has time, so typing never waits on them.
    const deferredQuery = useDeferredValue(query)
    const deferredCategory = useDeferredValue(category)
    const deferredHiddenLevels = useDeferredValue(hiddenLevels)
    const deferredLevels = useDeferredValue(levels)
    // Spot the map is zoomed to: a farm spot, or one of the open pet's. It
    // lives in the URL so a new map and its spot arrive in one update, and
    // the map never zooms for the old map with the new spot.
    const focusedSpot = search.spot ?? null

    useEffect(() => {
        document.title = "Daevanion - Pets"
    }, [])

    // Picking a pet jumps to its best map; picking it again deselects it.
    const handlePetSelect = (petId: number) => {
        navigate({
            search: (previous) => ({
                ...previous,
                pet: previous.pet === petId ? undefined : petId,
                map: undefined,
                spot: undefined,
            }),
            replace: true,
            resetScroll: false,
        })
    }

    // A pin of the open pet keeps it open.
    const handlePinSelect = (petId: number) => {
        if (petId !== search.pet) {
            handlePetSelect(petId)
        }
    }

    const handlePetClear = () => {
        navigate({
            search: (previous) => ({
                ...previous,
                pet: undefined,
                spot: undefined,
            }),
            replace: true,
            resetScroll: false,
        })
    }

    // From a farm area: stay on the map being farmed.
    const handleFarmPetSelect = (petId: number) => {
        navigate({
            search: (previous) => ({
                ...previous,
                pet: petId,
                spot: undefined,
            }),
            replace: true,
            resetScroll: false,
        })
    }

    const handleMapChange = (mapId: PetMapId) => {
        navigate({
            search: (previous) => ({
                ...previous,
                map: mapId,
                spot: undefined,
            }),
            replace: true,
            resetScroll: false,
        })
    }

    // A pet's spot opens its map; clicking the open spot again zooms out.
    const handlePetSpotSelect = (spotMapId: PetMapId, spot: string) => {
        const same = spotMapId === mapId && spot === focusedSpot

        navigate({
            search: (previous) => ({
                ...previous,
                map: spotMapId,
                spot: same ? undefined : spot,
            }),
            replace: true,
            resetScroll: false,
        })
    }

    // A farm spot, or null to zoom back out.
    const handleSpotFocus = (spot: string | null) => {
        navigate({
            search: (previous) => ({ ...previous, spot: spot ?? undefined }),
            replace: true,
            resetScroll: false,
        })
    }

    const handleRequiredChange = (
        changed: PetCategoryId,
        required: boolean,
    ) => {
        setRequiredCategories(
            PET_CATEGORY_IDS.filter((item) => {
                return item === changed
                    ? required
                    : requiredCategories.includes(item)
            }),
        )
    }

    const handleMinimize = () => {
        changeMinimized(true)
    }

    const handleExpand = () => {
        changeMinimized(false)
    }

    const pets = filterPets(
        atlas,
        {
            query: deferredQuery,
            category: deferredCategory,
            hiddenLevels: deferredHiddenLevels,
        },
        deferredLevels,
    )
    const selectedPet = atlas.pets.find((pet) => pet.id === search.pet)
    const sources = selectedPet ? getPetMapSources(atlas, selectedPet) : []
    const mapId = search.map ?? sources[0]?.mapId ?? "verteron"
    const mapCounts = selectedPet
        ? getPetMapCounts(atlas, selectedPet)
        : getMapCounts(atlas, pets)
    const source = sources.find((item) => item.mapId === mapId)
    const farm = getFarmSpots(atlas, pets, deferredLevels, mapId)
    const pins = getMapPins(
        atlas,
        selectedPet ? [selectedPet] : pets,
        mapId,
        selectedPet ? source?.labels : farm.labels,
    )
    const farmSpots = filterFarmSpots(farm.spots, requiredCategories)
    // A focused spot shows only its pins: the open pet's, or a farm spot's
    // pets below Lv3.
    const focusPins = selectedPet
        ? pins.filter((pin) => {
              return focusedSpot === null || pin.spot === focusedSpot
          })
        : pins.filter((pin) => {
              return (
                  pin.spot === focusedSpot &&
                  isPetNeeded(pin.pet, deferredLevels)
              )
          })
    const focusKey = `${mapId}:${selectedPet?.id ?? ""}:${focusedSpot ?? ""}`
    // With a spot focused, the open map's tab counts the pins it shows.
    const tabCounts = focusedSpot
        ? { ...mapCounts, [mapId]: focusPins.length }
        : mapCounts

    return (
        <Container as="main" py={{ base: "4", md: "6" }} maxW="8xl" flex="1">
            <Flex flexDir="column" gap="5">
                <Flex flexDir="column" gap="1">
                    <Heading size="lg">Pets</Heading>

                    <Text textStyle="hint">
                        Find which maps spawn the monsters that drop a pet's
                        soul, and how many there are. Global client, patch{" "}
                        {atlas.patch}. The Insight levels you set stay on this
                        device.
                    </Text>
                </Flex>

                {!tipDismissed && <LevelTip onDismiss={dismissTip} />}

                <Grid
                    templateColumns={{ base: "1fr", lg: "auto 1fr" }}
                    alignItems="start"
                    gap="4"
                >
                    <PetFinder
                        atlas={atlas}
                        pets={pets}
                        levels={deferredLevels}
                        query={query}
                        category={category}
                        hiddenLevels={hiddenLevels}
                        selectedPetId={selectedPet?.id}
                        onQueryChange={setQuery}
                        onCategoryChange={setCategory}
                        onLevelHiddenChange={changeLevelHidden}
                        onPetSelect={handlePetSelect}
                    />

                    <Flex minW="0" flexDir="column" gap="4">
                        {minimized ? (
                            selectedPet ? (
                                <PetMinimized
                                    pet={selectedPet}
                                    source={source}
                                    mapId={mapId}
                                    level={getPetLevel(levels, selectedPet.id)}
                                    focusedSpot={focusedSpot}
                                    onExpand={handleExpand}
                                    onClose={handlePetClear}
                                />
                            ) : (
                                <FarmSpotsMinimized
                                    spots={farmSpots}
                                    mapId={mapId}
                                    focusedSpot={focusedSpot}
                                    onExpand={handleExpand}
                                    onPetSelect={handleFarmPetSelect}
                                />
                            )
                        ) : selectedPet ? (
                            <PetDetails
                                pet={selectedPet}
                                sources={sources}
                                mapId={mapId}
                                level={getPetLevel(levels, selectedPet.id)}
                                focusedSpot={focusedSpot}
                                onMapChange={handleMapChange}
                                onSpotSelect={handlePetSpotSelect}
                                onLevelChange={changeLevel}
                                onMinimize={handleMinimize}
                                onClose={handlePetClear}
                            />
                        ) : (
                            <FarmSpotsPanel
                                spots={farmSpots}
                                mapId={mapId}
                                focusedSpot={focusedSpot}
                                requiredCategories={requiredCategories}
                                onSpotFocus={handleSpotFocus}
                                onRequiredChange={handleRequiredChange}
                                onPetSelect={handleFarmPetSelect}
                                onMinimize={handleMinimize}
                            />
                        )}

                        <PetMapPanel
                            mapId={mapId}
                            pins={focusedSpot ? focusPins : pins}
                            focusPins={focusPins}
                            focusKey={focusKey}
                            counts={tabCounts}
                            selectedPetId={selectedPet?.id}
                            onMapChange={handleMapChange}
                            onPinSelect={handlePinSelect}
                        />
                    </Flex>
                </Grid>

                <Text textStyle="hint">
                    Spawn data from the{" "}
                    <Link
                        href="https://pristine-zone-6q93xmk.shipstatic.com/"
                        color="app.muted"
                        target="_blank"
                        rel="noreferrer"
                    >
                        AION 2 Pet Atlas
                    </Link>
                    ; map art and area names from the{" "}
                    <Link
                        href="https://github.com/aion2-interactive-map/aion2-interactive-map"
                        color="app.muted"
                        target="_blank"
                        rel="noreferrer"
                    >
                        AION2 Interactive Map
                    </Link>{" "}
                    (CC BY-NC 4.0). Pet portraits © NCSOFT. A listed monster can
                    drop the soul; drops are not guaranteed.
                </Text>
            </Flex>
        </Container>
    )
}
