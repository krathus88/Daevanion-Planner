import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { getItem } from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"
import {
    INGOT,
    makeCraftingData,
    makeSettings,
    ORE,
    SOLVENT,
    SPLENDENT_SWORD,
    SWORD,
} from "@test/craftingFixture"
import { renderWithChakra } from "@test/renderWithChakra"
import { CraftPlanPanel } from "./CraftPlanPanel"

const data = makeCraftingData()

// jsdom has none; the segment switch's indicator measures with one.
class NoResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
}

beforeAll(() => {
    vi.stubGlobal("ResizeObserver", NoResizeObserver)
})

afterAll(() => {
    vi.unstubAllGlobals()
})

const setup = (
    settings: PlanSettings = makeSettings(),
    count = 2,
    itemId = SWORD,
) => {
    const handlers = {
        onCountChange: vi.fn(),
        onOwnedChange: vi.fn(),
        onSuccessChange: vi.fn(),
        onPriceChange: vi.fn(),
        onBoughtChange: vi.fn(),
        onProficiencyChange: vi.fn(),
        onItemSelect: vi.fn(),
    }
    const recipe = data.recipes.get(itemId)

    if (!recipe) {
        throw new Error("The fixture has this recipe.")
    }

    renderWithChakra(
        <CraftPlanPanel
            data={data}
            item={getItem(data, itemId)}
            recipe={recipe}
            count={count}
            settings={settings}
            {...handlers}
        />,
    )

    return handlers
}

// Every tree line and material row is a group named after its item.
const getTreeLine = (name: string) => {
    const card = screen.getByText("Main craft").parentElement

    if (!card) {
        throw new Error("No Main craft card.")
    }

    return within(card).getByRole("group", { name: name })
}

// A crafted line shows its fields and recipe once opened.
const openLine = async (name: string) => {
    const line = getTreeLine(name)

    await userEvent.click(within(line).getAllByRole("button")[0])

    return line
}

// All materials is closed until its heading is clicked.
const openMaterials = async () => {
    const trigger = screen.getByRole("button", { name: /^All materials/ })

    await userEvent.click(trigger)

    const section = trigger.parentElement

    if (!section) {
        throw new Error("No All materials section.")
    }

    return section
}

describe("CraftPlanPanel", () => {
    it("shows what each craft of the main craft uses", () => {
        setup()

        expect(
            screen.getByText("2 to make · 2 crafts · — success"),
        ).toBeVisible()
        expect(within(getTreeLine("Ingot")).getByText("3×")).toBeVisible()
        expect(within(getTreeLine("Ingot")).getByText("6")).toBeVisible()
        expect(within(getTreeLine("Ore")).getByText("30")).toBeVisible()
    })

    it("takes a price on any tree line", async () => {
        const { onPriceChange } = setup()

        await userEvent.type(
            within(getTreeLine("Ore")).getByLabelText("Price (Kinah)"),
            "7",
        )

        expect(onPriceChange).toHaveBeenLastCalledWith(ORE, 7)
    })

    it("opens a crafted line into its own recipe", async () => {
        setup()

        expect(screen.queryByRole("group", { name: "Solvent" })).toBeNull()

        const ingot = await openLine("Ingot")

        expect(
            within(ingot).getByText("6 needed · 1 craft of 10 · — success"),
        ).toBeVisible()
        expect(
            within(
                within(ingot).getByRole("group", { name: "Solvent" }),
            ).getByText("10×"),
        ).toBeVisible()
    })

    it("lists the main craft's own materials first", async () => {
        setup()

        const section = await openMaterials()

        expect(
            within(section)
                .getAllByRole("group")
                .map((row) => row.getAttribute("aria-label")),
        ).toEqual(["Ingot", "Ore"])
    })

    it("lists every item of the whole chain, upgrades first", async () => {
        setup(makeSettings({ owned: { [ORE]: 30 } }))

        const section = await openMaterials()

        await userEvent.click(within(section).getByText("Whole chain"))

        const rows = within(section).getAllByRole("group")

        expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
            "Ingot",
            "Ore",
            "Solvent",
        ])
        expect(within(rows[0]).getByText("Crafted")).toBeVisible()
    })

    it("shows this craft's own cost beside the whole chain's", () => {
        // Ingots cost 25 to craft, 20 to buy.
        setup(
            makeSettings({
                prices: { [ORE]: 10, [SOLVENT]: 5 },
                marketPrices: { [INGOT]: 20 },
            }),
        )

        // The amounts are spans inside the line.
        const line = screen.getByText((_, element) => {
            return (
                element?.tagName === "P" &&
                (element.textContent ?? "").startsWith("Whole chain")
            )
        })

        expect(line).toHaveTextContent(
            "Whole chain 125 Kinah each · this craft only 110 Kinah",
        )
    })

    it("sums up the combo in numbers, asking only for a missing price", () => {
        setup(makeSettings({ prices: { [ORE]: 10, [SOLVENT]: 5 } }))

        // 2 attempts at 25%: 1 - 0.75² is about 44%.
        expect(screen.getByText("Your plan: 44% sure")).toBeVisible()
        expect(
            // Sword is an item mention inside the line.
            screen.getByText(/sells for \(Main craft\) to count the ones/),
        ).toBeVisible()
        expect(screen.queryByText(/Crafting 100/)).toBeNull()
    })

    it("opens the item it's crafted from", async () => {
        const { onItemSelect } = setup(makeSettings(), 1, SPLENDENT_SWORD)

        await userEvent.click(screen.getByRole("button", { name: "Sword" }))

        expect(onItemSelect).toHaveBeenLastCalledWith(SWORD)
    })

    it("opens a used item's craft from its name", async () => {
        const { onItemSelect } = setup()

        await userEvent.click(
            within(getTreeLine("Ingot")).getByRole("button", { name: "Ingot" }),
        )

        expect(onItemSelect).toHaveBeenLastCalledWith(INGOT)
        // Its recipe stays closed: the name opens the item, not the line.
        expect(screen.queryByRole("group", { name: "Solvent" })).toBeNull()
        // Raw materials have no craft to open.
        expect(
            within(getTreeLine("Ore")).queryByRole("button", { name: "Ore" }),
        ).toBeNull()
    })

    it("shows a market price read-only, over one set by hand", () => {
        setup(
            makeSettings({
                prices: { [ORE]: 10, [SOLVENT]: 5 },
                marketPrices: { [ORE]: 12 },
            }),
        )

        const ore = getTreeLine("Ore")

        expect(within(ore).getByText("12")).toBeVisible()
        expect(within(ore).getByText("market")).toBeVisible()
        expect(within(ore).queryByLabelText("Price (Kinah)")).toBeNull()
        // No market price: the field stays.
        expect(
            within(getTreeLine("Ingot")).getByLabelText("Price (Kinah)"),
        ).toBeVisible()
    })

    it("shows a loading placeholder while the market price loads", () => {
        setup(makeSettings({ pendingPrices: { [ORE]: true } }))

        const ore = getTreeLine("Ore")

        expect(
            within(ore).getByLabelText("Loading the market price"),
        ).toBeVisible()
        expect(within(ore).queryByLabelText("Price (Kinah)")).toBeNull()
    })

    it("holds every Kinah sum while market prices load", async () => {
        setup(
            makeSettings({
                prices: { [ORE]: 10, [SOLVENT]: 5, [SWORD]: 200 },
                pendingPrices: { [INGOT]: true },
            }),
        )

        // To spend, the cost line and the Ingot's craft cost wait.
        expect(screen.queryByText("350 Kinah")).toBeNull()
        expect(screen.queryByText(/^Cost/)).toBeNull()
        expect(
            within(getTreeLine("Ingot")).getByLabelText("Loading prices"),
        ).toBeVisible()

        const section = await openMaterials()

        expect(
            within(
                within(section).getByRole("group", { name: "Ore" }),
            ).getByLabelText("Loading prices"),
        ).toBeVisible()
    })

    it("reports a new count", async () => {
        const { onCountChange } = setup()

        await userEvent.type(screen.getByLabelText("How many"), "5")

        expect(onCountChange).toHaveBeenLastCalledWith(5)
    })

    it("reports bag counts, prices and success by item", async () => {
        const { onOwnedChange, onPriceChange, onSuccessChange } = setup()
        const ingot = await openLine("Ingot")

        await userEvent.type(within(ingot).getByLabelText("Success %"), "5")

        const ore = within(await openMaterials()).getByRole("group", {
            name: "Ore",
        })

        await userEvent.type(within(ore).getByLabelText("In the bag"), "9")
        await userEvent.type(within(ore).getByLabelText("Price (Kinah)"), "4")

        expect(onSuccessChange).toHaveBeenLastCalledWith(INGOT, 5)
        expect(onOwnedChange).toHaveBeenLastCalledWith(ORE, 9)
        expect(onPriceChange).toHaveBeenLastCalledWith(ORE, 4)
    })

    it("only lets intermediates be bought instead", async () => {
        const { onBoughtChange } = setup()
        const card = screen.getByText("Main craft").parentElement

        expect(
            within(card ?? document.body).getAllByText("Success %"),
        ).toHaveLength(1)
        expect(
            within(card ?? document.body).queryByText("Buy instead"),
        ).toBeNull()

        await userEvent.click(
            within(await openLine("Ingot")).getByText("Buy instead"),
        )

        expect(onBoughtChange).toHaveBeenLastCalledWith(INGOT, true)
    })

    it("asks for the proficiency of each profession in the plan", async () => {
        const { onProficiencyChange } = setup()

        await userEvent.selectOptions(
            screen.getByLabelText("Blacksmithing rank"),
            "Professional",
        )

        expect(onProficiencyChange).not.toHaveBeenCalled()

        await userEvent.type(screen.getByLabelText("Blacksmithing level"), "6")

        // Professional Lv. 6 is the game's level 56.
        expect(onProficiencyChange).toHaveBeenLastCalledWith(
            "blacksmithing",
            56,
        )
    })

    it("keeps the level when the rank changes", async () => {
        const { onProficiencyChange } = setup(
            makeSettings({ proficiency: { blacksmithing: 61 } }),
        )

        expect(screen.getByLabelText("Blacksmithing rank")).toHaveValue("1")
        expect(screen.getByLabelText("Blacksmithing level")).toHaveValue("11")

        await userEvent.selectOptions(
            screen.getByLabelText("Blacksmithing rank"),
            "Novice",
        )

        expect(onProficiencyChange).toHaveBeenLastCalledWith(
            "blacksmithing",
            11,
        )
    })

    it("caps the level at 50", async () => {
        const { onProficiencyChange } = setup()

        await userEvent.click(screen.getByLabelText("Blacksmithing level"))
        await userEvent.paste("75")

        expect(onProficiencyChange).toHaveBeenLastCalledWith(
            "blacksmithing",
            50,
        )
    })

    it("shows the Kinah once every material has a price", () => {
        setup(
            makeSettings({
                prices: { [ORE]: 10, [SOLVENT]: 5, [SWORD]: 200 },
            }),
        )

        // To spend, cost each, then the profit: its 200 Kinah price pays out
        // 180 after the 10% Market tax.
        expect(screen.getByText("350 Kinah")).toBeVisible()
        expect(screen.getByText("125 Kinah")).toBeVisible()
        expect(screen.getByText("+55 Kinah")).toBeVisible()
    })

    it("says how many materials still need a price", () => {
        setup(makeSettings({ prices: { [ORE]: 10 } }))

        // Solvent is missing too, so To spend counts the Ore alone.
        expect(
            screen.getByText(
                "Price 1 more material to see the cost each and profit. To spend leaves out 1 unpriced material.",
            ),
        ).toBeVisible()
    })
})
