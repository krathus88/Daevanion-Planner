import { getPetIconUrl } from "@assets/pets"
import type { PetPin } from "@pets/logic/petFinder"

// Styled by .pet-tooltip in leafletTheme.css.
export const buildPinTooltip = (pin: PetPin) => {
    const content = document.createElement("div")
    const text = document.createElement("div")
    const title = document.createElement("strong")
    const level = document.createElement("span")
    const monster = document.createElement("div")
    const iconUrl = getPetIconUrl(pin.pet.icon)

    content.className = "pet-tooltip"

    if (iconUrl) {
        const icon = document.createElement("img")

        icon.src = iconUrl
        icon.alt = ""
        content.append(icon)
    }

    title.textContent = pin.pet.name
    monster.textContent = `${pin.monster.name} · Lv${pin.monster.level}`
    text.append(title, monster)

    const place = [pin.spot, pin.area].filter(Boolean).join(" · ")

    if (place) {
        const area = document.createElement("div")

        area.textContent = place
        text.append(area)
    }

    // Top right, colored per level by .pet-tooltip-level like the list's
    // badges.
    level.className = "pet-tooltip-level"
    level.dataset.level = String(pin.level)
    level.textContent = pin.level > 0 ? `Lv${pin.level}` : "Locked"
    content.append(text, level)

    return content
}
