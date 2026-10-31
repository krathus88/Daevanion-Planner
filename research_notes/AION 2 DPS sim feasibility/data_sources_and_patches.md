# AION 2 DPS simulator: data sources and patch cadence

Status as of 2026-10-30. "Global" means the NA/EU/Asia/LatAm client that launched on 2026-10-05. "KR" means the Korean service, live since 2025-11-19. All HTTP header tests were run by this researcher on 2026-10-30 from a non-browser client. They used a handful of plain requests and bypassed no protection.

## Which databases exist, and how complete and reusable is each?

### Takeaway
Aion2Data is the best source by a wide margin. It publishes 68 JSON datasets read from the Global client, with `Access-Control-Allow-Origin: *`, and they cover per-level skill damage as flat + % Attack, hits, cooldown, cast time, Daevanion nodes, items, sets and boss mechanics. No source has boss HP or defense, the damage formula, or cancel and animation timing, because none of these are in the client.

### Cited Findings

**Inventory**

| Source | Skills and coefficients | Levels | Gear / sets / stats | Stigmas | Daevanion | Bosses | Format | Freshness | Reuse terms |
|---|---|---|---|---|---|---|---|---|---|
| [Aion2Data](https://aion2data.com/raw/index.json) | Yes: flat + % Attack, hits, PvP value set | Per level to 40 | Items with fixed stats and soul-binding odds; Arcana sets; stat conversions | Yes | Node grid position, cost, effects | 521 listed; mechanics, enrage, no HP | **JSON** at `/raw/*.json`, Markdown at `/md/*`, `format=json` on calculators | Client 2026.10.28, Steam build 26262663, read 2026-10-28 | "Free to read and quote with a link to the page the number came from"; game data and art belong to NCSOFT |
| [MetaBot](https://metabot.gg/en/aion-2/methodology) | [Yes](https://metabot.gg/en/aion-2/skills/rush-strike): flat + % Attack | Per-level table to 40 | 2,024 gear pieces, 6,750 items, stat pages | As skill category | Planner, 5 boards per class | 48 bosses, no HP or mechanics | HTML; no AION 2 API documented | Global client build 0.0.4387.0; re-read on client patches | [llms.txt](https://metabot.gg/llms.txt) allows data use with a dofollow link, and points to [full terms](https://metabot.gg/en/legal/terms-of-service) (not read) |
| [AION2 Hub](https://aion2hub.com/tools) | Skills in its item database; coefficients not stated | Not verified | [9,450 Global + 3,689 KR/TW items](https://aion2hub.com/database), set bonuses, stat calculator | Not verified | Build planner | Mobs and bosses, [no HP or defense shown](https://aion2hub.com/database) | HTML; no API mentioned | Client-extracted; KR/TW content labelled | Unofficial fan site; no reuse terms on the pages read |
| [GEGEBASE](https://gegebase.com/games/aion2) | Class skill bars; coefficients not verified | Not verified | Equipment listed; sets and stats not listed as sections | Only inside guide text | Interactive planner and guide | Dungeon guide with mechanics | HTML; no API or export mentioned | No date; "331 wiki articles" | Independent fan wiki; game data belongs to NCSOFT |
| [Fextralife wiki](https://aion2.wiki.fextralife.com/Aion+2+Wiki) | Skills page; visible class text was shallow | Not verified | Weapons, armor, accessories | Not in navigation | Guide | No dedicated section | HTML | No date; some stale text | Custom licence; [licence page](https://fextralife.com/wiki-license) shows Valnet copyright and no explicit reuse grant |
| [Inven DB](https://aion2.inven.co.kr/db/) | Not verifiable | Not verifiable | Not verifiable | Not verifiable | Not verifiable | Not verifiable | Page exists ("아이온2 통합 DB"), but the fetch returned only a title | Unknown | Unknown |
| [GameWith](https://gamewith.ai/aion2/en) | Class skills, gear and Daevanion per class | Not verified | Manastones, spirit stones, build stats | Not verified | Yes | Not verified | HTML | [Build stats fetched 2026-10-08](https://gamewith.ai/aion2/en/build-stats/eu/assassin) | Not read |
| [Aion 2 Interactive Map](https://github.com/aion2-interactive-map/aion2-interactive-map) | No | n/a | No | No | No | Map markers only | GitHub repo; live API behind bot verification per [CLAUDE.md](../../CLAUDE.md) | [Last push 2026-07-06](https://api.github.com/repos/aion2-interactive-map/aion2-interactive-map) | CC BY-NC 4.0 per [buildPetAtlas.ts](../../scripts/buildPetAtlas.ts) |
| AION 2 Pet Atlas | No | n/a | Pets and spawn pins only | No | No | No | Inline `DATA` in an HTML page, [URL in buildPetAtlas.ts](../../scripts/buildPetAtlas.ts) | Unknown | Not stated |

Other sites seen but not assessed: [aion2.online](https://www.exitlag.com/blog/aion-2-item-database/), [thegameswiki](https://thegameswiki.com/aion-2/wiki/skills-and-specialties), [aion2gg](https://aion2gg.com/en), [misti.services](https://misti.services/tools/aion-2/character), [aion2helper](https://aion2helper.com/armory/). wikily.gg/aion-2/patch-notes returned HTTP 403 and was not retried.

**Aion2Data detail (highest value for a simulator)**
- `/raw/skills.json` is about 825 KB with 327 records. Fields include category, `maxLevel`, `learnMax`, per-level `[lv, flat min, flat max, % Attack]`, `hits`, a `pvp` value set, and per-level cooldown, cast, MP and required character level — [skills.json](https://aion2data.com/raw/skills.json).
- Example: Rush Strike has `hits: 2`, level 10 is `1267 + 125% Attack`, level 40 is `3030 + 125% Attack`, cooldown 20,000 ms, cast 0 ms — [skills.json](https://aion2data.com/raw/skills.json).
- The dataset names its source tables (SkillList, Skill, SkillLv, SkillEffect, SkillEffectLv, SkillAbnormalEffect and others) — [skills.json](https://aion2data.com/raw/skills.json).
- Other relevant datasets are `items`, `daevanion`, `stats`, `power-stats`, `power-systems`, `skill-levels`, `arcana-skills`, `macros`, `builds`, `boss-mechanics`, `nightmare`, `monsters` and `combat-power` — [index.json](https://aion2data.com/raw/index.json).
- `/macros/<class>` lists each damage skill's cooldown, cast time, range and follow-up skill, plus player-reported rotations — [Gladiator macro page](https://aion2data.com/md/macros/gladiator).
- Header test on 2026-10-30: `/raw/skills.json` returned `Access-Control-Allow-Origin: *` and `Cache-Control: public, max-age=3600` — [skills.json](https://aion2data.com/raw/skills.json).
- Its fan-content wording is "Free to use in guides, videos, blogs, wikis and forums", keeping a visible link, and "NCSOFT's own rules for fan content apply" — [llms.txt](https://aion2data.com/llms.txt).

**What the client does not contain**
- Monster HP and combat stats, boss mechanics, and market prices are server-side, per MetaBot. It says it "would rather show nothing than a guess" — [MetaBot methodology](https://metabot.gg/en/aion-2/methodology).
- Aion2Data agrees that "HP and combat stats are not in the client" — [index.json](https://aion2data.com/raw/index.json).
- Combat Power: "There is no formula or stat weight among them" — [combat-power.json](https://aion2data.com/raw/combat-power.json).
- The stat page says the client data has no damage formula — [MetaBot stats](https://metabot.gg/en/aion-2/stats).

**Damage model (community only)**
- ExpCarry's model: (Equipment Attack × Weapon Damage Boost + Attack Bonus) × Attack Increase + conditional Attack, × Skill Coefficient, + Skill Flat Damage; minus PvE defense reduction `max(Defense − Penetration, 0) × 0.1`; × damage-boost bucket, critical, double, position, element and specialty. NC has not published the formula, Multi-Hit placement is disputed, and most evidence is KR/TW — [ExpCarry](https://expcarry.com/aion-2-damage-formula).
- A second guide also says there is no official formula and that Multi-Hit placement is unconfirmed — [Gameplay.tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).
- Stat conversion is 0.1% per point for the 6 primary and 10 deity stats — [MetaBot stats](https://metabot.gg/en/aion-2/stats). Stated caps include Critical Hit 50%, Evasion 30%, Cooldown 60% — [Aion2Data llms.txt](https://aion2data.com/llms.txt).
- Skills above `learnMax` come from Daevanion and gear — [skills.json](https://aion2data.com/raw/skills.json).

**Conflicts between sources**
- Rush Strike: MetaBot's tooltip was reported as "deals 330 (+125% Attack)" at level 1 with no hit count listed — [MetaBot](https://metabot.gg/en/aion-2/skills/rush-strike). Aion2Data's text says "2 × 1,267" at level 10 — [skills.json](https://aion2data.com/raw/skills.json). Hit counts should be verified in game.
- MetaBot's "Cap" column (for example +1,000% Attack) does not reconcile with its 0.1% per-point rate — [MetaBot stats](https://metabot.gg/en/aion-2/stats).
- Names differ: the same class is Elementalist on Global and Spiritmaster in KR-derived notes — [search result summary of a Global/KR comparison](https://www.exitlag.com/blog/aion-2-pvp-nerf/) (that page returned 403 when fetched directly, so this rests on the snippet only).

### Inferences
- A browser-only data pipeline is technically possible from Aion2Data, but a build-time snapshot in the style of `scripts/buildPetAtlas.ts` is the safer design, because it pins the data to a build and avoids depending on a third-party host at runtime.
- "Free to read and quote with a link" does not clearly cover bulk redistribution of whole datasets. Asking the operator for permission is the prudent step. The same applies to NCSOFT's ownership of the underlying data.
- Table fields are good enough for direct-hit damage. Buffs, DoTs, procs and specialization effects are partly text (`text`, abnormal effect tables), so expect hand encoding per class.

### Gaps
- Inven DB is client-rendered and could not be assessed. Questlog showed no AION 2 result in search.
- Stigma specialization values and Arcana skill effects were not inspected field by field.
- NCSOFT's fan-content policy and terms of service were not found or read.
- Accuracy of Aion2Data was not checked against the game. It is a single operator's derivation.
- Animation lock and minimum cancel time were not found in any dataset checked. `cast` is 0 ms for at least one instant skill.

## Is there an official API or armoury, and can a static site import a character?

### Takeaway
There is an official character lookup but no documented public API. Its JSON routes cover all Global regions and return stats, gear and Daevanion boards, but a browser on a static site cannot read them, because the search route answers 403 when an Origin header is sent and the info route sends no CORS header. A small server-side proxy is required, and every project found uses one.

### Cited Findings
- No official API documentation was found. MetaBot says player data "will be added once the official global API is live" — [MetaBot methodology](https://metabot.gg/en/aion-2/methodology).
- Community-documented routes: `api-search.plaync.com/aion2global/search/v2/character`, `aion2.plaync.com/api/character/info`, `/api/character/equipment`, `/api/character/equipment/item` — [AION-2-Character-Check](https://github.com/nklsgod/AION-2-Character-Check). The authors state these routes are unofficial and can change — [aion2_api](https://github.com/axsddlr/aion2_api).
- Region coverage: Global shards NAE, NAW, EU, SA, Asia, plus KR and TW; KR's API returns 404 outside Korea — [nuriland/aion2-api](https://github.com/nuriland/aion2-api). Region codes on another site are nae, naw, eu, la, as — [Aion2Data llms.txt](https://aion2data.com/llms.txt).
- NC removed the Item route from Global around 2026-10-12, Global has no item catalog or player boards, and rankings are down in 2026 — [nuriland/aion2-api](https://github.com/nuriland/aion2-api). This may conflict with `/equipment/item` still being listed — [AION-2-Character-Check](https://github.com/nklsgod/AION-2-Character-Check).
- Character profile response has top-level keys `profile` (including `combatPower`), `stat.statList`, `title`, `ranking`, `daevanion.boardList` — direct test of [aion2.plaync.com/api/character/info](https://aion2.plaync.com/api/character/info) on 2026-10-30.
- Third-party armouries expose gear with enchant, rolled stats and manastones, 6 primary and 10 deity stats, learned skills, stigmas and Daevanion, for 106 servers — [MetaBot Armory](https://metabot.gg/en/aion-2/armory).
- A trained versus in-game skill level split can be read, though bonus levels from Daevanion and Arcana are not computed by the raw API — [aion2-tracker](https://github.com/doarjo/aion2-tracker). Figures reflect the active preset only — [aion2-tracker](https://github.com/doarjo/aion2-tracker).

**CORS test results (2026-10-30, Origin `https://krathus88.github.io`)**
- Search route GET with Origin: **403**, empty body, with `Access-Control-Allow-Origin` echoed — [api-search.plaync.com](https://api-search.plaync.com/aion2global/search/v2/character).
- Search route GET without Origin: 200 with JSON — [api-search.plaync.com](https://api-search.plaync.com/aion2global/search/v2/character).
- Search route preflight: 200, echoes Origin, allows credentials — [api-search.plaync.com](https://api-search.plaync.com/aion2global/search/v2/character).
- Info route GET with Origin: 200 but **no** `Access-Control-Allow-Origin`, so a browser would refuse to expose the response — [aion2.plaync.com](https://aion2.plaync.com/api/character/info).
- Independent statement: "The browser cannot call plaync.com directly (CORS)", solved with an Express or Netlify Function proxy, about 4 requests per second, 10-minute cache — [AION-2-Character-Check](https://github.com/nklsgod/AION-2-Character-Check).
- A more conservative proxy: one lookup per 5 s, searches at least 1 s apart, and a 10-minute hold after 403 or 429 — [odyle-dashboard PR 70](https://github.com/oldbear24/odyle-dashboard/pull/70).

**Character data sites**
- Aion2Data offers character search and profiles from NCSOFT's public character service, and says players and rankings are available as JSON — [Aion2Data](https://aion2data.com/characters); [llms.txt](https://aion2data.com/llms.txt).

### Inferences
- A static GitHub Pages build cannot import characters by itself. The realistic options are a Supabase Edge Function (the project already uses Supabase), a Netlify-style function, or a manual or screenshot-based import like the existing Game Check and Pets flows.
- A proxy creates a dependency on undocumented routes that have already changed once (Item route, October 2026), so import should be an optional feature with a graceful failure mode.
- The server-side origin check looks deliberate, since the same search request succeeds without an Origin header. Routing around it through a proxy is a common community pattern, but whether NCSOFT permits it is unknown, so the terms should be checked first.

### Gaps
- NCSOFT's terms on automated access to these routes were not read.
- Exact equipment and skill response fields were not inspected for this note (only `/info` keys were listed).
- Whether Aion2Data exposes character JSON with open CORS was not verified. If it does, using it needs the operator's agreement.
- Stats returned are final or partial totals in unknown combinations. Whether buffs or presets affect them needs a test with a known character.

## Is there public client datamining?

### Takeaway
Client data is being extracted and published in derived form (Aion2Data, MetaBot, AION2 Hub), but this search found no public repository of raw unpacked tables or an unpacker. GitHub is instead full of packet-capture DPS meters, some of which ship display data under GPL.

### Cited Findings
- MetaBot reads "the same files the game itself loads" from the Global client, and says nothing comes from KR or TW — [MetaBot methodology](https://metabot.gg/en/aion-2/methodology).
- Aion2Data names table sources such as SkillList, SkillEffectLv, DaevanionNode, NpcBehaviorCase — [index.json](https://aion2data.com/raw/index.json).
- AION2 Hub says its data is extracted from the client, the same dataset used by the AionFlex meter — [AION2 Hub tools](https://aion2hub.com/tools).
- GitHub repository search on 2026-10-30: `aion2` 770 results; `aion2 datamine` 0; `aion2 pak` 0; `aion2 simulator` 4 (none a DPS simulator by description) — [GitHub search API](https://api.github.com/search/repositories?q=aion2).
- Meters analyse network traffic and do not modify files or read memory — [Aion2Flow-Extend](https://github.com/crazyde21/Aion2Flow-Extend). Others include [A2Tools-DPS-Meter](https://github.com/taengu/A2Tools-DPS-Meter) (GPL-3.0, 86 stars) and [RATmeter](https://github.com/Kuroukihime/AIon2-Dps-Meter) (GPL-3.0, 24 stars).
- A2Tools bundles buff and debuff tables in `src/data/abnormals.json` — [A2Tools-DPS-Meter](https://github.com/taengu/A2Tools-DPS-Meter).
- Character-side tool with a PvE DPS profile, using a weighting heuristic and not a calculation — [aion2-tracker](https://github.com/doarjo/aion2-tracker).

### Inferences
- A wave of repositories with near-identical star counts (58–60), same-day pushes and vague "companion" descriptions (for example `authorized69/aion2-status-companion`, `rag1874/ezzar-daeva-companion`, `sulthoni122/aion-combat-analyzer`) looks like star-farming. They should be treated as untrusted and not run. This is a pattern judgement from [search results](https://api.github.com/search/repositories?q=aion2+dps), not a confirmed finding.
- No existing open-source AION 2 DPS simulator surfaced, so there is likely no ready skill-and-rotation model to reuse.
- GPL-3.0 meter data cannot simply be copied into a differently licensed project without taking on GPL obligations.

### Gaps
- Unauthenticated GitHub search was rate limited and `gh` is not installed, so code search was not possible. A raw-tables repo could still exist.
- Discord-hosted or Chinese and Korean-language datamining communities were not reachable through search.
- The legality of extraction under NCSOFT's terms was not checked.

## How often do balance patches change skills and stats, and how far apart are KR and Global?

### Takeaway
KR changed class skills in about 31 of 57 listed patch notes, falling in about 27 of 47 weeks, with several large passes. Global has patched weekly since launch and has already touched skills and base HP, while KR remains months ahead with different numbers and a ninth class. A simulator should assume weekly data checks and treat KR notes only as a preview.

### Cited Findings

**KR timeline** (translated notes, classified from one-line blurbs in the [AION2 Hub index](https://aion2hub.com/updates), so the 31/57 count is approximate; individual dates link to notes where read)

| Date | Scope |
|---|---|
| 2025-11-19 to 11-23 | Launch-week tuning on 4 separate days: Templar, Cleric, Ranger, Sorcerer |
| 2025-12-10, 12-17 | Class-wide damage and aggro pass; broad balance pass |
| 2026-01-07, 01-14, 01-21, 01-28 | Four consecutive weeks of class changes; PvP damage pass and macro feature on 01-28 |
| 2026-02-04 | Balance pass; Ranger Gale Arrow rework |
| 2026-03-11 | Class changes |
| 2026-04-01 | Cleric pass; built-in DPS meter added |
| 2026-04-22 | PvE/PvP damage split and life-steal rework (blurb not labelled balance) |
| 2026-04-29 | Class-wide PvP pass; Gladiator Rage Burst rework |
| 2026-05-13, 05-20, 05-27 | Heavy Sorcerer pass; wide pass; "sweeping" changes |
| 2026-06-17, 06-24 | PvE damage pass for every class; combat power equalized |
| [2026-07-01](https://aion2hub.com/updates/aion-2-update-2026-07-01) | Chapter 1: new Brawler class, full eight-class pass. Example: Gladiator Experienced Counterstrike PvE amp 20/35/50% to 17/24/31%, duration 10s to 20s |
| 2026-07-08, 07-15, 07-22, 07-29 | Four more consecutive balance weeks, including a survival-skill rebalance and Brawler rework |
| 2026-08-12 | Healing rework, 20–50% lower recovery — [note list](https://aion2hub.com/updates) |
| 2026-08-19 | Gladiator Ruinous Blow rework |
| [2026-08-26](https://aion2hub.com/updates/aion-2-update-2026-08-26) | "Largest class patch since Chapter 1": 9 classes, about 70 skill entries by a summariser's count. Pummel PvE +30%, Spinning Strike cooldown 30s to 15s, Experienced Counterstrike PvE amp to 9/13/17% |
| 2026-09-02, [09-04](https://aion2hub.com/updates/aion-2-update-2026-09-04) | Templar and Chanter; emergency "class care" pass |
| [2026-09-16](https://aion2hub.com/updates/aion-2-update-2026-09-16) | Anti-macro cancel-delay increases (no delay value published), +10–20% PvE damage on many skills, Abyss 12-set PvE amp up 10 points, Snowfield boss HP −10% |
| [2026-10-14](https://aion2hub.com/updates/aion-2-update-2026-10-14) | RvR pass, PvP damage about −30%, Spiritmaster, Sorcerer and Cleric attacks gain elements. Official note: [article 6ace86b8…](https://aion2.plaync.com/ko-kr/board/update/view?articleId=6ace86b86cfe4756db5b8d81) |

- The same index also shows an Apr 29 versus May 13 date ambiguity for the Rage Burst rework in search summaries — [AION2 Hub](https://aion2hub.com/updates).

**Global timeline**
- Founder's early access 2026-09-30, free-to-play 2026-10-05 — [MetaBot](https://metabot.gg/en/aion-2).
- 2026-10-05, 10-07, 10-09 and 10-14: launch maintenance, first weekly patch, follow-up, then a Halloween patch with Sorcerer and Spiritmaster fixes — [AION2 Hub](https://aion2hub.com/updates).
- 2026-10-21: patch touching Spinning Strike, Cold Storm, Fire Wall, Summon: Ancient Spirit, Bittercold Wind, per a search summary only — [Wikily](https://wikily.gg/aion-2/patch-notes) (403 on direct fetch).
- 2026-10-28: base HP at level 45 from 4,702 to 6,202 (Gladiator, Templar) or 5,702 (others); Assassin Illusion Clone cooldown 90s to 60s; Transcendence levels 1–2 boss HP −6.5%; Expedition and Transcendence boss attack cuts of 10–15% — [mein-mmo ticker](https://mein-mmo.de/en/aion-2-server-down-all-about-the-server-maintenance-and-the-patch-notes-on-october-28-2026-in-the-live-ticker,1593868/). This translated ticker uses non-standard class names.
- Season 1 ends 2026-12-16 — [MetaBot](https://metabot.gg/en/aion-2).

**Client gap**
- KR and TW are "months ahead" with "different numbers" — [MetaBot methodology](https://metabot.gg/en/aion-2/methodology).
- Global launched with QoL improvements from KR but not the full content, and KR's ninth class is not in the Global roster; dungeon parties are 5 versus 4 and the first raid 10 versus 8 — [ExitLag summary, via search snippet](https://www.exitlag.com/blog/aion-2-global/); [MassivelyOP headline](https://massivelyop.com/2026/09/08/aion-2-confirms-time-delayed-content-from-the-korean-launch-and-a-lack-of-crossplay/) (full text returned 403).
- As of 2026-10-16 NCSOFT had not said if or when the KR 30% PvP cut reaches Global, per a search snippet — [ExitLag](https://www.exitlag.com/blog/aion-2-pvp-nerf/).
- AION2 Hub lists 3,689 KR/TW-only items beside 9,450 Global items — [AION2 Hub database](https://aion2hub.com/database).

### Inferences
- KR rate: 31 class-touching notes in about 47 weeks (2025-11-19 to 2026-10-14). From 07-01 to 09-16 the pace was 11 in 11 weeks, then a pause until 10-14. Blurb-based classification likely undercounts, because 04-22, 03-04, 02-11 and 12-03 changed skills without being labelled balance.
- Estimated Global load: a weekly diff of the client-derived JSON is cheap (an automated snapshot plus review of changed records), since Aion2Data stamps every dataset with `clientVersion` and `steamBuild`. Formula-level changes such as PvE/PvP splits, new damage buckets or cancel delays are the expensive ones and need hand work and retesting.
- KR is a useful leading indicator of mechanics, but its values cannot be applied to Global.
- The simulator should show its data build and date, and warn when the data is older than the current client.

### Gaps
- Official Global notes at [aion2.plaync.com/en-us/board/update/list](https://aion2.plaync.com/en-us/board/update/list) rendered no content when fetched, so Global dates rest on secondary sources. Oct 21 and Oct 28 should be checked against them.
- How many KR changes were already baked into Global's launch tables is unknown, and no precise "Global equals KR patch X" mapping was found.
- TW patch history was not collected.
- The 70-skill count for Aug 26 is an automated tally, not an official figure.

## Is boss and raid data usable, and is there a training dummy?

### Takeaway
The game has training dummies, and client data offers boss levels, suggested item levels, skills, enrage timers and walkthrough steps. HP, defense, phase thresholds and uptime are not published anywhere reliable, so a boss model must be fed by players' measurements or left as user-set parameters.

### Cited Findings
**Available**
- `/raw/boss-mechanics.json` has 527 records for group dungeon bosses: lines, triggers, skill cast time, cooldown, range, buffs, Frenzy timers, stagger, walkthrough steps and sourced player notes. "HP thresholds are not in the client" — [boss-mechanics.json](https://aion2data.com/raw/boss-mechanics.json).
- Enrage example: Krao Cave, Ultimate Berk, 300 s (Conquest), 240 s (Conquest Hard) — [boss-mechanics.json](https://aion2data.com/raw/boss-mechanics.json).
- `/raw/nightmare.json` has each Nightmare boss's level and, for each of 10 challenge levels, a Suggested Item Level and rewards — [index.json](https://aion2data.com/raw/index.json).
- Aion2Data lists 521 bosses in the Global version (79 field bosses, 442 hero and legend monsters) — [Aion2Data bosses](https://aion2data.com/md/bosses). MetaBot lists 48 with a narrower definition, showing level and recommended power — [MetaBot bosses](https://metabot.gg/en/aion-2/bosses).

**Missing**
- MetaBot: "Boss HP and mechanics are not in the client files" — [MetaBot bosses](https://metabot.gg/en/aion-2/bosses).
- No numeric boss defense was found. Bosses "can have substantial Damage Tolerance", which subtracts from the damage-boost bucket, there is a penalty against higher-level enemies, and accuracy requirements vary by encounter — [ExpCarry](https://expcarry.com/aion-2-damage-formula).
- A search for raid and Nightmare HP values found no figures — [AION2 Hub Nightmare](https://aion2hub.com/database/nightmare) and others searched.
- Only relative HP changes are visible in patch notes, for example −6.5% — [mein-mmo](https://mein-mmo.de/en/aion-2-server-down-all-about-the-server-maintenance-and-the-patch-notes-on-october-28-2026-in-the-live-ticker,1593868/); −10% — [AION2 Hub](https://aion2hub.com/updates/aion-2-update-2026-09-16).

**Measured sources**
- Packet meters show boss HP live — [aion2-dps-meter](https://github.com/cyberbadger6969/aion2-dps-meter); Aion2Flow lists boss HP among its bundled display data — [Aion2Flow](https://github.com/cloris-chan/Aion2Flow).
- Logs and leaderboards exist on [a2tools.app, per A2Tools](https://github.com/taengu/A2Tools-DPS-Meter), and through AionFlex, per [AION2 Hub](https://aion2hub.com/tools). Note that `aionflex.com` is an unrelated cybersecurity company, so AionFlex's real address needs checking.
- A built-in personal meter with a per-skill mode arrived in KR on 2026-04-01 — [AION2 Hub](https://aion2hub.com/updates/aion-2-update-2026-04-01). One guide reports it tracks both eDPS and aDPS — [games.gg](https://games.gg/aion-2/guides/aion-2-combat-analysis-guide/).

**Training dummies**
- Elyos: Dawn Legion Base, west of the Kibelisk, plus two on the facing cliff. Asmodians: two sets at the Safe Haven HQ in Altgard. Regular and Melee types; the melee type does its own AoE attacks. Dummies "match your chosen character's level" (published 2026-10-06) — [Destructoid](https://www.destructoid.com/all-training-dummy-locations-in-aion-2/).
- Called Training Scarecrows, available from level 10 — [search summary of guide sites](https://allthings.how/aion-2-training-dummy-locations-for-elyos-and-asmodian-players/).
- Dummy-based stat weights "can't perfectly predict endgame boss DPS" — [ExpCarry](https://expcarry.com/aion-2-damage-formula).

### Inferences
- A pure target dummy mode is feasible, with defense and tolerance as a user-editable preset, calibrated against real dummy logs.
- Boss fights can start as a timeline model using client data (enrage, boss casts) with uptime as a user-set percentage. HP and defense presets would need to be measured and labelled "measured on build X".
- Dummy tests plus the built-in or third-party meter are the most practical way to validate the formula, including hit counts and cancel timings.

### Gaps
- Dummy HP, defense and resistances: none found, official or community.
- Measured boss defense or damage tolerance per boss: none found.
- Uptime statistics and phase thresholds: none found outside scattered player notes.
- Whether third-party meters are allowed under NCSOFT's terms was not confirmed, nor whether the built-in meter is present and identical on Global.
