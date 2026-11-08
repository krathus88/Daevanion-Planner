import { describe, expect, it } from "vitest"
import { FIELD_BOSSES } from "@timers/config/fieldBosses"
import { compareBosses } from "./bossOrder"

const getShownNames = (region: string) => {
    return [...FIELD_BOSSES.filter((boss) => boss.region === region)]
        .sort(compareBosses)
        .map((boss) => boss.name)
}

describe("compareBosses", () => {
    it.each([
        ["verteron", "Eternal Gartua"],
        ["altgard", "Immortal Gartua"],
    ])("starts %s with Gartua, Lagta, Dartan, Kashapa", (region, gartua) => {
        expect(getShownNames(region).slice(0, 4)).toEqual([
            gartua,
            "High Commander Lagta",
            "Silent Dartan",
            "Soul Ruler Kashapa",
        ])
    })

    it("orders the rest by longest respawn, then by name", () => {
        const rest = [
            ...FIELD_BOSSES.filter((boss) => boss.region === "verteron"),
        ]
            .sort(compareBosses)
            .slice(4)

        for (const [index, boss] of rest.slice(1).entries()) {
            const before = rest[index]

            expect(
                (before.respawn ?? 0) > (boss.respawn ?? 0) ||
                    (before.respawn === boss.respawn &&
                        before.name.localeCompare(boss.name) <= 0),
            ).toBe(true)
        }
    })

    it("keeps scheduled Abyss bosses in config order", () => {
        const abyss = FIELD_BOSSES.filter((boss) => boss.region === "abyss")

        expect([...abyss].sort(compareBosses)).toEqual(abyss)
    })
})
