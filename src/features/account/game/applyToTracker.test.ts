import { describe, expect, it } from "vitest"
import { STARTER_TASKS } from "@tracker/config/starterTasks"
import { getEnergyPeriod } from "@tracker/logic/odyleEnergy"
import { getResetPeriods } from "@tracker/logic/resetPeriods"
import type { TrackerData } from "@tracker/types"
import {
    applyCorridorHold,
    applyToTracker,
    toCorridorHold,
} from "./applyToTracker"
import type { GameSnapshot } from "./gameSnapshot"

const AT = Date.UTC(2026, 10, 11, 23, 0)

const data = (overrides: Partial<TrackerData> = {}): TrackerData => {
    return {
        characters: [
            { id: "a", name: "Testchar", classId: "cleric", server: "siel" },
        ],
        tasks: null,
        counts: {},
        entries: {},
        minimized: [],
        goalsOpen: [],
        ignored: {},
        energy: {},
        notes: {},
        cubeKeys: {},
        arena: {},
        corridorHolds: {},
        corridorsLeft: {},
        declined: [],
        membership: true,
        ...overrides,
    }
}

const snapshot = (overrides: Partial<GameSnapshot> = {}): GameSnapshot => {
    return {
        character: { name: "testchar", server: 1301, class: 30 },
        ...overrides,
    }
}

describe("applyToTracker", () => {
    it("sets Odyle Energy and entries from the counters", () => {
        const next = applyToTracker(
            data(),
            snapshot({
                counters: {
                    "60000001": [15, 865],
                    "1": [0, 5],
                    "101": [13, 30],
                    "80000001": [0, 15],
                    "4": [5, 2],
                    "8": [1, 0],
                },
                countersAt: AT,
            }),
        )
        const periods = getResetPeriods(AT)

        expect(next.entries.a.nightmare).toEqual({
            period: periods.daily,
            base: 5,
            bonus: 2,
        })

        expect(next.energy.a).toEqual({
            period: getEnergyPeriod(AT),
            base: 15,
            bonus: 865,
        })
        expect(next.entries.a["ascension-trial"]).toEqual({
            period: periods.weekly,
            base: 0,
            bonus: 15,
        })
        // Shared tasks count once per server.
        expect(next.entries["server:siel"]["shugo-festival"]).toEqual({
            period: periods.daily,
            base: 0,
            bonus: 5,
        })
        expect(next.entries["server:siel"]["unknown-fissure"]).toEqual({
            period: periods.weekly,
            base: 13,
            bonus: 30,
        })
        expect(next.entries["server:siel"].invasion).toEqual({
            period: periods.daily,
            base: 1,
            bonus: 0,
        })
    })

    it("counts Hidden Cube keys in the bag and Character Storage", () => {
        const next = applyToTracker(
            data(),
            snapshot({
                items: {
                    "1": { "630900003": 34, "660900003": 5 },
                    "15": { "630900003": 2 },
                    "2": { "630900003": 100 },
                },
                itemsAt: AT,
            }),
        )

        // Key: Hidden Cube (Bound), 660900003, counts too.
        expect(next.cubeKeys).toEqual({ a: 41 })
    })

    it("reads counters left out as 0", () => {
        const next = applyToTracker(
            data(),
            snapshot({ counters: {}, countersAt: AT }),
        )

        expect(next.energy.a.base).toBe(0)
        expect(next.entries.a["ascension-trial"]).toMatchObject({
            base: 0,
            bonus: 0,
        })
    })

    it("keeps entries within the task's caps", () => {
        const next = applyToTracker(
            data(),
            snapshot({ counters: { "80000001": [9, 99] }, countersAt: AT }),
        )

        expect(next.entries.a["ascension-trial"]).toMatchObject({
            base: 3,
            bonus: 30,
        })
    })

    it("skips tasks removed from the user's list", () => {
        const tasks = STARTER_TASKS.filter((task) => {
            return task.id !== "ascension-trial"
        })
        const next = applyToTracker(
            data({ tasks: tasks }),
            snapshot({ counters: { "80000001": [0, 15] }, countersAt: AT }),
        )

        expect(next.entries.a?.["ascension-trial"]).toBeUndefined()
    })

    it("marks the daily supply request done once an Emergency card is delivered", () => {
        const supply = (delivered: number) => {
            return snapshot({
                supply: [
                    {
                        kind: 1,
                        start: AT - 3_600_000,
                        end: AT + 3_600_000,
                        cards: 10,
                        delivered: delivered,
                    },
                    {
                        kind: 2,
                        start: AT - 3_600_000,
                        end: AT + 3_600_000,
                        cards: 10,
                        delivered: 3,
                    },
                ],
                supplyAt: AT,
            })
        }
        const period = getResetPeriods(AT).daily

        expect(
            applyToTracker(data(), supply(1)).counts.a["supply-requests"],
        ).toEqual({ period: period, count: 1 })
        expect(
            applyToTracker(data(), supply(0)).counts.a["supply-requests"],
        ).toEqual({ period: period, count: 0 })
    })

    it("ignores an Emergency tab that has ended", () => {
        const next = applyToTracker(
            data(),
            snapshot({
                supply: [
                    { kind: 1, start: 1, end: 2, cards: 10, delivered: 5 },
                ],
                supplyAt: AT,
            }),
        )

        expect(next.counts.a).toBeUndefined()
    })

    it("counts duty quests turned in from today's duty board, server-wide", () => {
        const duty = (done: number, ends = AT + 3_600_000) => {
            return snapshot({ duty: [done, ends], dutyAt: AT })
        }
        const period = getResetPeriods(AT).daily
        const next = applyToTracker(data(), duty(1))

        expect(next.counts["server:siel"]["duty-missions"]).toEqual({
            period: period,
            count: 1,
        })
        // Another character's board, read earlier the same day.
        expect(
            applyToTracker(next, duty(0)).counts["server:siel"][
                "duty-missions"
            ],
        ).toEqual({ period: period, count: 1 })
        expect(
            applyToTracker(data(), duty(9)).counts["server:siel"][
                "duty-missions"
            ].count,
        ).toBe(5)
    })

    it("counts each arena mode's week from where it stood at the reset", () => {
        const weekly = getResetPeriods(AT).weekly
        // Before the week's first match: nothing played, so this is the start.
        const start = applyToTracker(
            data(),
            snapshot({
                arena: { "1": [0, 0], "2": [17, 20] },
                arenaAt: AT,
                progress: {},
                progressAt: AT,
            }),
        )
        // A 5v5 loss and win, then a 1v1 win.
        const next = applyToTracker(
            start,
            snapshot({
                arena: { "1": [1, 0], "2": [18, 21] },
                arenaAt: AT + 60_000,
                progress: {
                    "231210800": [3, AT + 60_000],
                    "231210900": [2, AT + 60_000],
                },
                progressAt: AT + 60_000,
            }),
        )

        expect(next.counts.a["arena-participation"]).toEqual({
            period: weekly,
            count: 2,
        })
        expect(next.counts.a["arena-wins"].count).toBe(1)
        expect(next.counts.a["arena-1v1-participation"].count).toBe(1)
        expect(next.counts.a["arena-1v1-wins"].count).toBe(1)
    })

    it("leaves arena tasks alone in a week whose start is unknown", () => {
        const next = applyToTracker(
            data(),
            snapshot({
                arena: { "2": [18, 21] },
                arenaAt: AT,
                progress: { "231210800": [2, AT] },
                progressAt: AT,
            }),
        )

        expect(next.counts.a).toBeUndefined()
        expect(next.arena.a.base).toBeUndefined()
    })

    it("sets one-off goals from the shops' lifetime purchase counts", () => {
        // Kryx's Nightmare shop and Krathy's Abyss shop, 2026-11-14: the
        // Abyss shop's stages add up (50 + 2 of 200).
        const next = applyToTracker(
            data(),
            snapshot({
                shops: {
                    "990003": { "402024517": 3, "402024518": 50 },
                    "990001": { "401015113": 50, "401015114": 2 },
                },
                shopsAt: AT,
            }),
        )

        expect(next.counts.a).toEqual({
            "shards-nightmare": { period: 0, count: 3 },
            "crystals-nightmare": { period: 0, count: 50 },
            "shards-abyss": { period: 0, count: 52 },
        })
    })

    it("adds up the Shugo Festival shop's crystal stages", () => {
        // Kryx, 2026-11-14: stages 10/10, 10/10, 15/15, 2/15 and 6/35 shards,
        // plus two entries of other items.
        const next = applyToTracker(
            data(),
            snapshot({
                shops: {
                    "990007": {
                        "405015104": 10,
                        "405015133": 10,
                        "405015134": 15,
                        "405015135": 2,
                        "405015137": 6,
                        "405016724": 1,
                        "405016728": 1,
                    },
                },
                shopsAt: AT,
            }),
        )

        expect(next.counts.a).toEqual({
            "crystals-shugo": { period: 0, count: 37 },
            "shards-shugo": { period: 0, count: 6 },
        })
    })

    it("reads an entry missing from an opened shop as never bought", () => {
        const before = data({
            counts: { a: { "shards-nightmare": { period: 0, count: 4 } } },
        })
        const next = applyToTracker(
            before,
            snapshot({ shops: { "990003": { "402024518": 9 } }, shopsAt: AT }),
        )

        expect(next.counts.a["shards-nightmare"]).toEqual({
            period: 0,
            count: 0,
        })
        // A shop not opened says nothing about its goals.
        expect(next.counts.a["shards-abyss"]).toBeUndefined()
    })

    it("ignores yesterday's duty board", () => {
        const next = applyToTracker(
            data(),
            snapshot({ duty: [5, AT - 1], dutyAt: AT }),
        )

        expect(next.counts["server:siel"]).toBeUndefined()
    })

    describe("Abyss corridors", () => {
        // Thursday's siege ended at 21:13 server time; Elyos (Siel) took
        // Reshanta's Root and Sulfur Tree Island.
        const SIEGE_END = Date.UTC(2026, 10, 12, 20, 13, 24)
        const LATER = SIEGE_END + 3_600_000
        const artifacts = { "1001": 1, "1002": 1, "1003": 2, "2001": 0 }
        const twoOnSiel = data({
            characters: [
                {
                    id: "a",
                    name: "Testchar",
                    classId: "cleric",
                    server: "siel",
                },
                { id: "b", name: "Alt", classId: "templar", server: "siel" },
            ],
        })

        it("keeps the corridors the server's faction holds", () => {
            const next = applyToTracker(
                twoOnSiel,
                snapshot({
                    artifacts: artifacts,
                    siegeEnd: SIEGE_END,
                    artifactsAt: LATER,
                }),
            )

            expect(next.corridorHolds.siel).toEqual({
                period: getResetPeriods(SIEGE_END).siege,
                at: SIEGE_END,
                artifacts: ["1001", "1002"],
            })
        })

        it("counts the entrances used since the siege", () => {
            const next = applyToTracker(
                twoOnSiel,
                snapshot({
                    artifacts: artifacts,
                    siegeEnd: SIEGE_END,
                    artifactsAt: LATER,
                    corridors: ["10000002"],
                    corridorsAt: LATER,
                }),
            )

            const period = getResetPeriods(SIEGE_END).siege

            expect(next.corridorsLeft.a.artifacts).toEqual(["1002"])
            // One row per held corridor: Reshanta's Root used, Sulfur Tree
            // Island still open.
            expect(next.counts.a).toEqual({
                "corridors:1001": { period, count: 1 },
                "corridors:1002": { period, count: 0 },
            })
            // The other character's entrances weren't read: left alone.
            expect(next.counts.b).toBeUndefined()
        })

        it("counts another character once its server's corridors come in", () => {
            const left = applyToTracker(
                twoOnSiel,
                snapshot({
                    character: { name: "Alt", server: 1301, class: 33 },
                    corridorsAt: LATER,
                }),
            )
            const next = applyToTracker(
                left,
                snapshot({
                    artifacts: artifacts,
                    siegeEnd: SIEGE_END,
                    artifactsAt: LATER,
                }),
            )

            expect(next.counts.b["corridors:1001"].count).toBe(1)
            expect(next.counts.b["corridors:1002"].count).toBe(1)
        })

        it("ignores entrances read before the siege ended", () => {
            const next = applyToTracker(
                twoOnSiel,
                snapshot({
                    artifacts: artifacts,
                    siegeEnd: SIEGE_END,
                    artifactsAt: LATER,
                    corridors: [],
                    corridorsAt: SIEGE_END - 60_000,
                }),
            )

            expect(next.counts.a).toBeUndefined()
        })

        describe("shared by another member", () => {
            const hold = toCorridorHold("siel", artifacts, SIEGE_END)
            const read = applyToTracker(
                twoOnSiel,
                snapshot({ corridors: ["10000002"], corridorsAt: LATER }),
            )

            it("keeps the server's faction's corridors", () => {
                expect(hold).toEqual({
                    period: getResetPeriods(SIEGE_END).siege,
                    at: SIEGE_END,
                    artifacts: ["1001", "1002"],
                })
                expect(
                    toCorridorHold("israphel", artifacts, SIEGE_END).artifacts,
                ).toEqual(["1003"])
            })

            it("fills the rows of characters whose entrances were read", () => {
                const next = applyCorridorHold(read, "siel", hold)
                const period = getResetPeriods(SIEGE_END).siege

                expect(next.corridorHolds.siel).toEqual(hold)
                expect(next.counts.a).toEqual({
                    "corridors:1001": { period, count: 1 },
                    "corridors:1002": { period, count: 0 },
                })
                expect(next.counts.b).toBeUndefined()
            })

            it("changes nothing when the tracker has it or a later siege", () => {
                const once = applyCorridorHold(read, "siel", hold)

                expect(applyCorridorHold(once, "siel", hold)).toBe(once)
                expect(
                    applyCorridorHold(once, "siel", {
                        ...hold,
                        at: SIEGE_END - 1,
                        artifacts: [],
                    }),
                ).toBe(once)
            })

            it("takes a different read of the same siege", () => {
                const once = applyCorridorHold(read, "siel", hold)
                const next = applyCorridorHold(once, "siel", {
                    ...hold,
                    artifacts: ["1001"],
                })

                expect(next.corridorHolds.siel.artifacts).toEqual(["1001"])
            })

            it("leaves servers without characters alone", () => {
                const other = toCorridorHold("israphel", artifacts, SIEGE_END)

                expect(applyCorridorHold(read, "israphel", other)).toBe(read)
            })
        })
    })

    it("leaves a character it doesn't know for the user to add", () => {
        const before = data()
        const next = applyToTracker(
            before,
            snapshot({
                character: { name: "Newchar", server: 1301, class: 10 },
                counters: { "60000001": [270, 240] },
                countersAt: AT,
            }),
        )

        expect(next).toBe(before)
    })

    it("leaves characters of unknown classes and servers alone", () => {
        const before = data()

        expect(
            applyToTracker(
                before,
                snapshot({
                    character: { name: "Other", server: 1301, class: 42 },
                }),
            ),
        ).toBe(before)
        expect(
            applyToTracker(
                before,
                snapshot({
                    character: { name: "Testchar", server: 9999, class: 30 },
                }),
            ),
        ).toBe(before)
    })

    it("matches the same name on another server as another character", () => {
        const next = applyToTracker(
            data(),
            snapshot({
                character: { name: "Testchar", server: 1302, class: 30 },
            }),
        )

        expect(next.characters).toHaveLength(1)
        expect(next.energy).toEqual({})
    })

    describe("Odyle Energy crafts", () => {
        const week = getResetPeriods(AT).weekly
        const crafted = (server: number, own: number, at = AT) => {
            return snapshot({
                crafts: {
                    "31070001": [server, 0, at],
                    "31070002": [0, own, at],
                },
                craftsAt: at,
            })
        }

        it("counts the server-wide and the character's own crafts", () => {
            const next = applyToTracker(data(), crafted(8, 1))

            expect(next.counts["server:siel"]["odyle-craft-server"]).toEqual({
                period: week,
                count: 8,
            })
            expect(next.counts.a["odyle-craft"]).toEqual({
                period: week,
                count: 1,
            })
        })

        it("keeps a higher server count from this week", () => {
            const before = data({
                counts: {
                    "server:siel": {
                        "odyle-craft-server": { period: week, count: 9 },
                    },
                    a: { "odyle-craft": { period: week, count: 3 } },
                },
            })
            const next = applyToTracker(before, crafted(8, 1))

            expect(next.counts["server:siel"]["odyle-craft-server"].count).toBe(
                9,
            )
            expect(next.counts.a["odyle-craft"].count).toBe(1)
        })

        it("leaves this week's counts alone for last week's crafts", () => {
            const lastWeek = AT - 7 * 24 * 3_600_000
            const before = data({
                counts: { a: { "odyle-craft": { period: week, count: 2 } } },
            })
            const next = applyToTracker(before, crafted(16, 4, lastWeek))

            expect(next.counts.a["odyle-craft"]).toEqual({
                period: week,
                count: 2,
            })
        })

        it("keeps counts within the task's cap", () => {
            const next = applyToTracker(data(), crafted(20, 9))

            expect(next.counts["server:siel"]["odyle-craft-server"].count).toBe(
                16,
            )
            expect(next.counts.a["odyle-craft"].count).toBe(4)
        })
    })

    describe("Odyle Energy shop", () => {
        const week = getResetPeriods(AT).weekly
        const bought = (server: number, own: number, at = AT) => {
            return snapshot({
                limits: { "1209": [own, at], "1210": [server, at] },
                limitsAt: at,
            })
        }

        it("counts the server-wide and the character's own purchases", () => {
            const next = applyToTracker(data(), bought(1, 2))

            expect(next.counts["server:siel"]["odyle-shop-server"]).toEqual({
                period: week,
                count: 1,
            })
            expect(next.counts.a["odyle-shop"]).toEqual({
                period: week,
                count: 2,
            })
        })

        it("keeps a higher server count from this week", () => {
            const before = data({
                counts: {
                    "server:siel": {
                        "odyle-shop-server": { period: week, count: 5 },
                    },
                },
            })
            const next = applyToTracker(before, bought(1, 0))

            expect(next.counts["server:siel"]["odyle-shop-server"].count).toBe(
                5,
            )
        })

        it("leaves this week's counts alone for last week's purchases", () => {
            const lastWeek = AT - 7 * 24 * 3_600_000
            const before = data({
                counts: { a: { "odyle-shop": { period: week, count: 1 } } },
            })
            const next = applyToTracker(before, bought(16, 4, lastWeek))

            expect(next.counts.a["odyle-shop"]).toEqual({
                period: week,
                count: 1,
            })
        })
    })

    describe("Command quests", () => {
        const week = getResetPeriods(AT).weekly
        const lastWeek = AT - 7 * 24 * 3_600_000

        it("adds up this week's Abyss entries and the Faction one", () => {
            const next = applyToTracker(
                data(),
                snapshot({
                    limits: {
                        "133019901": [5, AT],
                        "134019901": [1, AT],
                        "134019902": [2, AT],
                        "134019903": [3, AT],
                        "134019904": [4, AT],
                    },
                    limitsAt: AT,
                }),
            )

            expect(next.counts["server:siel"]["command-faction"]).toEqual({
                period: week,
                count: 5,
            })
            expect(next.counts["server:siel"]["command-abyss"]).toEqual({
                period: week,
                count: 10,
            })
        })

        it("leaves out entries last read in an earlier week", () => {
            // This week's list had only 134019904: the others are at 0.
            const next = applyToTracker(
                data(),
                snapshot({
                    limits: {
                        "134019901": [5, lastWeek],
                        "134019904": [2, AT],
                    },
                    limitsAt: AT,
                }),
            )

            expect(next.counts["server:siel"]["command-abyss"]).toEqual({
                period: week,
                count: 2,
            })
        })
    })
})
