import { Container, Flex, Grid, Heading, Link, Text } from "@chakra-ui/react"
import {
    PET_CATEGORY_IDS,
    type PetCategoryId,
} from "@pets/config/petCategories"
import { PET_MAP_IDS, type PetMapId } from "@pets/config/petMaps"
import {
    filterFarmSpots,
    getFarmSpots,
    isPetNeeded,
} from "@pets/logic/farmSpots"
import { getPetLevel, getPetSouls } from "@pets/logic/petLevels"
import {
    filterPets,
    getMapCounts,
    getMapPins,
    getMostSpawnsMap,
    getPetMapCounts,
    getPetMapSources,
} from "@pets/logic/petFinder"
import {
    getNeighborPins,
    getSpotNeighbors,
    type SpotNeighbors,
} from "@pets/logic/spotNeighbors"
import { getRouteApi } from "@tanstack/react-router"
import { useDeferredValue, useEffect, useState } from "react"
import { PetDetails } from "./details/PetDetails"
import { PetMinimized } from "./details/PetMinimized"
import { FarmSpotsMinimized } from "./farm/FarmSpotsMinimized"
import { FarmSpotsPanel } from "./farm/FarmSpotsPanel"
import { PetFinder } from "./finder/PetFinder"
import { PetFinderMinimized } from "./finder/PetFinderMinimized"
import { usePetCollection } from "./hooks/usePetCollection"
import { LevelTip } from "./LevelTip"
import { PetMapPanel } from "./map/PetMapPanel"

const route = getRouteApi("/pets")
const NO_FARM_SPOTS: ReturnType<typeof getFarmSpots> = {
    spots: [],
    labels: new Map(),
}

export const PetsPage = () => {
    const search = route.useSearch()
    const navigate = route.useNavigate()
    const atlas = route.useLoaderData()
    const {
        levels,
        souls,
        hiddenLevels,
        minimized,
        listMinimized,
        tipDismissed,
        changeLevel,
        changeSouls,
        changeLevelHidden,
        changeMinimized,
        changeListMinimized,
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
    const deferredSouls = useDeferredValue(souls)
    // Spot the map is zoomed to: a farm spot, or one of the open pet's. It
    // lives in the URL so a new map and its spot arrive in one update, and
    // the map never zooms for the old map with the new spot.
    const focusedSpot = search.spot ?? null
    const showOthers = search.others === true

    useEffect(() => {
        document.title = "Daevanion - Pets"
    }, [])

    const handleSoulsChange = (petId: number, total: number) => {
        changeSouls([{ petId: petId, souls: total }])
    }

    // Picking a pet jumps to its best map; picking it again deselects it.
    const handlePetSelect = (petId: number) => {
        navigate({
            search: (previous) => ({
                ...previous,
                pet: previous.pet === petId ? undefined : petId,
                map: undefined,
                spot: undefined,
                others: undefined,
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
                others: undefined,
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
                others: undefined,
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
                others: undefined,
            }),
            replace: true,
            resetScroll: false,
        })
    }

    // A pet's spot opens its map with just the pet's pins, or with its "Also
    // here" pets too (`others`). The open spot again zooms out; "Also here"
    // again goes back to just the pet.
    const handlePetSpotSelect = (
        spotMapId: PetMapId,
        spot: string,
        others: boolean,
    ) => {
        const same = spotMapId === mapId && spot === focusedSpot
        const zoomOut = same && !others && !showOthers
        const nextOthers = others && !(same && showOthers)

        navigate({
            search: (previous) => ({
                ...previous,
                map: spotMapId,
                spot: zoomOut ? undefined : spot,
                others: nextOthers ? true : undefined,
            }),
            replace: true,
            resetScroll: false,
        })
    }

    // A farm spot, or null to zoom back out.
    const handleSpotFocus = (spot: string | null) => {
        navigate({
            search: (previous) => ({
                ...previous,
                spot: spot ?? undefined,
                others: undefined,
            }),
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

    const handleListMinimize = () => {
        changeListMinimized(true)
    }

    const handleListExpand = () => {
        changeListMinimized(false)
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
    const mostSpawnsMap = getMostSpawnsMap(sources)
    const mapId = search.map ?? mostSpawnsMap ?? "verteron"
    const mapCounts = selectedPet
        ? getPetMapCounts(atlas, selectedPet)
        : getMapCounts(atlas, pets)
    const source = sources.find((item) => item.mapId === mapId)
    // An open pet replaces the Best spots panel and labels pins its own way.
    const farm = selectedPet
        ? NO_FARM_SPOTS
        : getFarmSpots(atlas, pets, deferredLevels, mapId)
    const pins = getMapPins(
        atlas,
        selectedPet ? [selectedPet] : pets,
        deferredLevels,
        mapId,
        selectedPet ? source?.labels : farm.labels,
    )
    const farmSpots = filterFarmSpots(farm.spots, requiredCategories)
    // A farm spot whose last pet below Lv3 was just leveled is no longer a
    // spot, so the map zooms back out.
    const farmSpotGone =
        !selectedPet &&
        focusedSpot !== null &&
        !farm.spots.some((spot) => spot.name === focusedSpot)
    const neighbors: SpotNeighbors = selectedPet
        ? getSpotNeighbors(
              atlas,
              selectedPet,
              sources,
              deferredLevels,
              deferredHiddenLevels,
          )
        : new Map()
    const petSpot = source?.spots.find((spot) => spot.name === focusedSpot)
    // Under the open pet's own pins, so those stay on top.
    const neighborPins =
        petSpot && showOthers
            ? getNeighborPins(
                  atlas,
                  petSpot,
                  neighbors.get(petSpot) ?? [],
                  deferredLevels,
                  mapId,
              )
            : []
    // A focused spot shows only its pins: the open pet's (and with `others`
    // its "Also here" pets), or a farm spot's pets below Lv3.
    const focusPins = selectedPet
        ? [
              ...neighborPins,
              ...pins.filter((pin) => {
                  return focusedSpot === null || pin.spot === focusedSpot
              }),
          ]
        : pins.filter((pin) => {
              return (
                  pin.spot === focusedSpot &&
                  isPetNeeded(pin.pet, deferredLevels)
              )
          })
    // "Must include" also narrows the map to the pins of the spots it keeps,
    // and each map's tab to the spawns of its kept spots.
    const filteringSpots = !selectedPet && requiredCategories.length > 0
    const keptSpots = new Set(farmSpots.map((spot) => spot.name))
    const spotPins = filteringSpots
        ? pins.filter((pin) => {
              return (
                  pin.spot !== null &&
                  keptSpots.has(pin.spot) &&
                  isPetNeeded(pin.pet, deferredLevels)
              )
          })
        : pins
    const spotCounts: Partial<Record<PetMapId, number>> = {}

    if (filteringSpots) {
        for (const id of PET_MAP_IDS) {
            const kept =
                id === mapId
                    ? farmSpots
                    : filterFarmSpots(
                          getFarmSpots(atlas, pets, deferredLevels, id).spots,
                          requiredCategories,
                      )

            spotCounts[id] = kept.reduce((total, spot) => {
                return total + spot.spawns
            }, 0)
        }
    }

    useEffect(() => {
        if (farmSpotGone) {
            navigate({
                search: (previous) => ({
                    ...previous,
                    spot: undefined,
                    others: undefined,
                }),
                replace: true,
                resetScroll: false,
            })
        }
    }, [farmSpotGone, navigate])

    const focusKey = `${mapId}:${selectedPet?.id ?? ""}:${focusedSpot ?? ""}`
    // With a spot focused, the open map's tab counts the pins it shows out of
    // those pets' spawns on the whole map, and the other tabs their spawns
    // there.
    const focusCounts: Partial<Record<PetMapId, number>> = {}
    let focusTotal: number | undefined

    if (focusedSpot) {
        const focusPets = [...new Set(focusPins.map((pin) => pin.pet))]
        const counts = getMapCounts(atlas, focusPets)

        for (const id of PET_MAP_IDS) {
            focusCounts[id] =
                id === mapId ? focusPins.length : (counts[id] ?? 0)
        }

        focusTotal = counts[mapId] ?? 0
    }

    const tabCounts = { ...mapCounts, ...spotCounts, ...focusCounts }

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
                    templateColumns={{ base: "minmax(0, 1fr)", lg: "auto 1fr" }}
                    alignItems="start"
                    gap="4"
                >
                    {listMinimized ? (
                        <PetFinderMinimized
                            count={pets.length}
                            onExpand={handleListExpand}
                        />
                    ) : (
                        <PetFinder
                            atlas={atlas}
                            pets={pets}
                            levels={deferredLevels}
                            souls={deferredSouls}
                            query={query}
                            category={category}
                            hiddenLevels={hiddenLevels}
                            selectedPetId={selectedPet?.id}
                            onQueryChange={setQuery}
                            onCategoryChange={setCategory}
                            onLevelHiddenChange={changeLevelHidden}
                            onPetSelect={handlePetSelect}
                            onLevelChange={changeLevel}
                            onMinimize={handleListMinimize}
                        />
                    )}

                    <Flex minW="0" flexDir="column" gap="4">
                        {minimized ? (
                            selectedPet ? (
                                <PetMinimized
                                    pet={selectedPet}
                                    source={source}
                                    mapId={mapId}
                                    level={getPetLevel(levels, selectedPet.id)}
                                    souls={getPetSouls(
                                        levels,
                                        souls,
                                        selectedPet.id,
                                    )}
                                    focusedSpot={focusedSpot}
                                    onExpand={handleExpand}
                                    onClose={handlePetClear}
                                />
                            ) : (
                                <FarmSpotsMinimized
                                    spots={farmSpots}
                                    mapId={mapId}
                                    focusedSpot={focusedSpot}
                                    levels={levels}
                                    onExpand={handleExpand}
                                    onPetSelect={handleFarmPetSelect}
                                    onLevelChange={changeLevel}
                                />
                            )
                        ) : selectedPet ? (
                            <PetDetails
                                pet={selectedPet}
                                sources={sources}
                                neighbors={neighbors}
                                mapId={mapId}
                                level={getPetLevel(levels, selectedPet.id)}
                                souls={getPetSouls(
                                    levels,
                                    souls,
                                    selectedPet.id,
                                )}
                                focusedSpot={focusedSpot}
                                showOthers={showOthers}
                                levels={levels}
                                onMapChange={handleMapChange}
                                onSpotSelect={handlePetSpotSelect}
                                onPetSelect={handleFarmPetSelect}
                                onLevelChange={changeLevel}
                                onSoulsChange={handleSoulsChange}
                                onMinimize={handleMinimize}
                                onClose={handlePetClear}
                            />
                        ) : (
                            <FarmSpotsPanel
                                spots={farmSpots}
                                mapId={mapId}
                                focusedSpot={focusedSpot}
                                levels={levels}
                                requiredCategories={requiredCategories}
                                onSpotFocus={handleSpotFocus}
                                onRequiredChange={handleRequiredChange}
                                onPetSelect={handleFarmPetSelect}
                                onLevelChange={changeLevel}
                                onMinimize={handleMinimize}
                            />
                        )}

                        <PetMapPanel
                            mapId={mapId}
                            pins={focusedSpot ? focusPins : spotPins}
                            focusPins={focusPins}
                            focusKey={focusKey}
                            counts={tabCounts}
                            total={focusTotal}
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
