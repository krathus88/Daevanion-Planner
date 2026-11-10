import type { CraftingItem } from "@crafting/data/craftingData"

// Text that names items: plain strings, and items the page highlights with a
// hover card.
export type TextPart = string | CraftingItem

// The plain text, item names inline.
export const partsToText = (parts: TextPart[]) => {
    let text = ""

    for (const part of parts) {
        text += typeof part === "string" ? part : part.name
    }

    return text
}
