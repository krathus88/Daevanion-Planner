import type { FieldBossId } from "./fieldBosses"

// The game's boss codes, as NotMeter's live feed lists them (its field boss
// catalog, Nov 2026). Abyss bosses are left out: they keep a fixed schedule.
export const NOTMETER_BOSS_CODES: Readonly<
    Partial<Record<number, FieldBossId>>
> = {
    // Verteron
    2100003: "neikel",
    2100040: "kutar",
    2100050: "kernon",
    2100076: "kusan",
    2100077: "garshim",
    2100079: "teegant",
    2100141: "korin",
    2100177: "saursus",
    2100178: "pnyn",
    2100582: "layla",
    2100617: "lawa",
    2100661: "kasia",
    2100708: "demiros",
    2100718: "ansas",
    2100876: "moshav",
    2100877: "knash",
    2100988: "aulla",
    2100989: "aullamu",
    2100991: "taulo",
    2101016: "setram",
    2101074: "gartua",
    2101120: "dartan",
    2101122: "kashapa",
    2101131: "lagta",

    // Altgard
    2400017: "danar",
    2400074: "aed",
    2400140: "rajit",
    2400141: "vargor",
    2400212: "garsan",
    2400223: "lannar",
    2400274: "trid",
    2400335: "kelpina",
    2400353: "nutah",
    2400358: "resana",
    2400419: "linx",
    2400424: "newbold",
    2400425: "axios",
    2400474: "hardirun",
    2400504: "barthien",
    2400593: "guruta",
    2400607: "shujakan",
    2400608: "karuka",
    2400659: "vishwada",
    2400709: "shylak",
    2400800: "immortal-gartua",
    2400853: "lagta-altgard",
    2400854: "kashapa-altgard",
    2400855: "dartan-altgard",
}
