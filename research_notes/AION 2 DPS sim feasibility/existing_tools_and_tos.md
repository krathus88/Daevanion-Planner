# Existing AION 2 tools and terms-of-service status (as of 2026-10-30)

Method note for the report writer: no tool was downloaded or run. Pages were read through a summarizing fetcher, so Korean "quotes" should be re-checked against the page before being reprinted. Many English guide sites are SEO blogs or vendors of their own meters, so their claims are weaker than the primary sources (plaync.com policy page, Korean press reports of NC live streams).

## Which DPS meters exist, how they get data, what they expose, and are they maintained?

### Takeaway
The meter category is crowded, with at least 15 named tools. Nearly all passively capture network packets via Npcap, and several expose per-skill damage and crit rate. Saved fights and web uploads are common, but I could not confirm a documented raw log file export (CSV/JSON) on any meter I checked. "A2Viewer", named in the assignment, could not be found under that name; the closest name is A2Tools, and no link between them is established.

### Cited Findings
**Packet capture (Npcap), open source or free**
- RATmeter: GPL-3.0, for global servers, 24 stars, 8 forks, 344 commits. It has per-skill damage, per-player crit, back-attack, perfect-hit and parry rates, a live combat log and auto-saved session history. It also has a Stat Efficiency Calculator showing projected Total Damage and Gain %. No export is mentioned, and the release date was not visible — [GitHub](https://github.com/Kuroukihime/AIon2-Dps-Meter)
- Aion-DPS-Meter (SkeeveAN): added AION 2 support through Npcap capture because the UE5 client writes no Chat.log; now requires admin rights — [GitHub releases](https://github.com/SkeeveAN/Aion-DPS-Meter/releases)
- aion2t-dps-meter (Grachy): release notes record packet protocol updates for new client versions (new markers, damage format changes, shifted opcodes), which shows that patches break meters and upkeep is ongoing — [GitHub releases](https://github.com/Grachy/aion2t-dps-meter/releases)
- AION 2 Companion (Alazuriel), needs Npcap — [GitHub releases](https://github.com/Alazuriel/Aion2_Companion/releases). Aion-combat-analyzer, passive Npcap with no memory reading or injection — [GitHub wiki](https://github.com/sulthoni122/aion-combat-analyzer/wiki)
- A protocol write-up (Rust + Tauri, July 2026) describes passive TCP capture and parsing of damage, heals, buffs/debuffs, deaths and boss detection. Verified boss kills upload to a leaderboard with a build snapshot; the author's profile links aion2t.com. It does not mention crit flags — [DEV Community](https://dev.to/aionon/reverse-engineering-an-mmo-aion-2s-network-protocol-to-build-a-real-time-dps-meter-rust-tauri-3157)
- Questlog app v0.1.45: reads a copy of network traffic via Npcap. It shows per-skill damage, DPS and crit rate, hit rates and rotation, and saves fights. **Training dummy mode** has timed runs and compares two runs per skill. Runs upload to questlog.gg; no file export is described — [Questlog](https://questlog.gg/aion-2/en/app)
- AionFlex: passive packets, per-skill breakdown, crit tracking and uptime, encounter logs, leaderboards. Taiwan and Korea supported, NA/EU "planned" on this page. It tells users to follow the game's ToS — [AION2 Hub](https://aion2hub.com/tools/dps-meter)
- Abyss Logs (passive packets, combat logs, leaderboards) — [abysslogs.com](https://abysslogs.com/). JaMeter — [jameter.net](https://jameter.net/en). A2Tools (free, open source) and AionFlex are also listed as of 2026-10-04 — [aion2guide](https://aion2guide.org/guides/aion-2-damage-meter/)
- Korean tools: ING Meter (AIONING) — [DC Inside](https://m.dcinside.com/board/aion2/1672097); A2DIL — [a2dil.com](https://a2dil.com/); a free user-made meter — [Inven](https://www.inven.co.kr/board/aion2/6388/185496)

**Other capture methods**
- Open-source OCR meters reading screenshots of the combat log are reported on GitHub (no specific project named) — [aion2guide](https://aion2guide.org/guides/aion-2-damage-meter/)
- One Inven user's reverse engineering claims that a Taiwanese meter injects a DLL and hooks packet functions, while Trxplex uses Winsock capture and Lagofast relays traffic as a node. This is a single user post dated 2026-02-23, not verified. In that post the Taiwanese meter read 6.193M, Trxplex 6.21M and Lago 6.32M on the same content, which is a roughly 2% spread. Lago appeared to count healing as damage, and the post's own Lago gap figure (1.4M) doesn't match its totals — [Inven](https://www.inven.co.kr/board/aion2/6388/104374)
- A comparison post on FMKorea also exists — [FMKorea](https://www.fmkorea.com/9415196925)

**Maintenance**
- Metaroad (2026-09-28, updated 10-21) counts "six" meters, none with NC's permission: one commercial with a paid tier, Aletheia (Taiwanese, actively developed), and Korean ones. One Korean open-license meter was declared discontinued on 2026-06-19 — [Metaroad](https://metaroad.gg/aion2/getting-started/aion-2-tools-korean-community-uses). The list above is longer than six, so Metaroad's count is an undercount or uses a narrower definition.

### Inferences
- Packet parsing exposes the data a simulator needs (per-skill damage, crit, hit flags, rotation), so meters can answer the validation question technically. The barrier is export format and policy, not data existence.
- Meter totals disagree by about 2% with no ground truth, so a simulator validated against one meter inherits that noise. The in-game window is the better reference.

### Gaps
- Whether any meter offers raw log export. Not stated on the pages read; repos and Abyss Logs were not inspected in depth.
- Current maintenance for SkeeveAN, Grachy, Alazuriel and sulthoni122 was not checked beyond the existence of releases.
- A2Viewer: not found in English or Korean searches. The user may mean A2Tools or something Discord-only; worth asking.

## Are there simulators, stat calculators, gear comparison tools, efficiency sheets or rotation tools? Does any make a new sim redundant?

### Takeaway
Several partial competitors exist, and the idea of a stat-efficiency or what-if tool is already taken. I found no tool that publicly documents validation against real combat logs. No source showed a gear-versus-gear DPS answer built on a verified formula. The nearest direct competitors are STIGMA's DPS simulator, AION2 Atlas's rotation estimator, and the AION2 Timers and RATmeter efficiency calculators.

### Cited Findings
- **STIGMA**: lists a DPS simulator ("per-skill damage and rotation DPS estimate"), stat weights, compare items, Build Lab with character import, and a Daevanion planner. The page states no inputs, validation, formula source or patch — [stigma.pro/tools](https://stigma.pro/tools)
- **AION2 Atlas what-if estimator**: the user enters skill potency, cast time and cooldown; the model casts the biggest ready skill or else a filler, then compares Setup A and B. It caps cooldown reduction at 60% and crit at 50%. The 1.5x crit damage is "community-reported, not confirmed", and it ignores Damage Boost's diminishing returns. It states it is not a parse of real fights — [AION2 Atlas](https://aion2atlas.app/dps-meter/)
- **AION2 Timers calculator**: per a search snippet, it ranks which stat gives most damage per step against a boss or PvP target, with presets and a Combat Speed cap checker — [aion2timers.com](https://www.aion2timers.com/calculator/). When fetched, this site returned only a title and a "Continue" link to an unrelated YouTube video, which I did not follow, so the description is unverified.
- **RATmeter** Stat Efficiency Calculator — [GitHub](https://github.com/Kuroukihime/AIon2-Dps-Meter)
- **AION2 Hub**: Stat Calculator does linear attribute-to-derived conversion only (for example Smite = Wisdom x 0.2). It says values were "verified against in-game values" but "may not be 100% accurate", and excludes gear and buffs — [stat calculator](https://aion2hub.com/tools/stat-calculator). A Build Planner sums full gear stat sheets — [AION2 Hub tools](https://www.aion2hub.com/tools)
- **Guild Order**: character builder with comparison panels, Daevanion and skill planners, armory snapshots. No meters or simulators — [guide, 2026-10-09](https://guildorder.com/ja/games/aion2/guides/aion-2-tools-overview)
- **Korean**: Atool/aion2tool.com (enhancement odds, chores; rates from NC's published probabilities, may lag patches); buson2.com (nine calculators including stat efficiency, with no version date); Inven skill simulator (actively maintained); Arcana Skill Simulator (v1.6.8-beta, 2026-04-18) — [Metaroad](https://metaroad.gg/aion2/getting-started/aion-2-tools-korean-community-uses). Atool also computes a combat score used as a party entry cut — [search result, Vortex Gaming](https://vortexgaming.io/postdetail/717212)
- Inven hosts user-made calculators, such as an option expected-value simulator by Roah (10-16, 4,970 views, 8 comments) — [Inven](https://www.inven.co.kr/board/aion2/6444/2354), linked from [Inven](https://www.inven.co.kr/board/aion2/6444/1067). A simple damage-efficiency and attack-speed calculator was indicated only by a search snippet.

### Inferences
- A new simulator is not redundant if it is accurate and shows its validation, because the visible competitors assume unconfirmed constants or don't disclose their method. It would still be entering a contested space, not an empty one.
- A what-if comparison alone adds little, since free tools already offer one. The differentiator would be validation evidence, plus gear-to-gear answers that need no manual potency entry.

### Gaps
- No user reception or accuracy testing was found for STIGMA, Atlas or AION2 Timers. Their accuracy is unknown, not poor. STIGMA's simulator was not opened, so it may be more capable than its one-line description suggests.
- No community theorycraft spreadsheet was found. Absence from search doesn't rule out Discord or private sheets.

## Does the game provide a combat log, damage numbers, a training dummy or a personal DPS display?

### Takeaway
Yes. Built-in Combat Analysis (Ctrl+X) shows per-skill data for your own character, and level-matched, infinite-health training dummies exist. This is the lowest-risk source of real data. No built-in export is documented, but results can be read or screenshotted.

### Cited Findings
- NC said on 2025-12-23: "유저간 분쟁을 최소화하기 위해 전투 기여도를 확인할 수 있는 개인 딜 미터기를 개발 중이다" (developing a personal DPS meter to reduce disputes) — [Daum](https://v.daum.net/v/20251223215349523)
- Combat Analysis (Ctrl+X, or main menu → Content) offers Auto-Analysis, Single-Target and Multi-Target modes. It shows DPS, total damage, time, healing, hits, crits, per-skill damage and damage taken, with run history; own character only — [AION2 Atlas, updated 2026-10-09](https://aion2atlas.app/dps-meter/)
- Per-skill data includes hits, accuracy, crit rate and damage share. Detailed Mode flags Perfect Hits, Double Hits, Front/Back Attacks, Multi-Hits, Blocks and Endurance. Older results drop off when the list fills. This page cites Game8 — [aion2guide, 2026-10-04](https://aion2guide.org/guides/aion-2-damage-meter/)
- Conflict: a fan blog lists only time, DPS, total damage and per-skill contribution, and mentions no per-skill crit rate — [DTG Reviews, 2026-10-05](https://www.dtgre.com/2026/10/aion-2-combat-analysis-check-damage-best-skills.html?m=1). This is likely less complete rather than contradictory, but it should be verified in-game.
- Training dummies match your level, have infinite health, and are at the Legion Hall and faction Main Base — [search summary of guides](https://www.destructoid.com/all-training-dummy-locations-in-aion-2/); [Playnews](https://www.playnews.gg/en/guides/aion-2-training-dummy-where-to-find-it-on-the-elyos-and-asmodian-side)
- The UE5 client writes no Chat.log — [SkeeveAN releases](https://github.com/SkeeveAN/Aion-DPS-Meter/releases)

### Inferences
- Real combat logs are obtainable for validation without any third-party meter: dummy runs read from Ctrl+X, with one variable changed at a time. Screenshot OCR of that window would fit the planner's existing screenshot-reading approach (`game-check`, Pets importer), but no prototype was tested.
- Per-skill crit rate and hit counts are enough to check skill coefficients and crit assumptions, though they give aggregates and not hit-by-hit timing. Timing would have to come from meters or video.

### Gaps
- No official NC manual page for Combat Analysis was read; details come from fan guides citing Game8.
- History capacity is unknown, and no first-party export was confirmed either way.

## What do NCSoft's ToS, operation policy and public statements say? Have there been bans? Does using exported data on a website carry risk?

### Takeaway
No official statement was found that names DPS meters as allowed or banned. The operation policy's "unauthorized programs" rule carries a permanent integrated-account ban and is broad enough to be argued either way. No documented meter-specific ban was found. The sharpest official signal concerns websites: in May 2026 Korean developers threatened to block data collection and take legal action over sites sharing players' damage records without consent.

### Cited Findings
**Policy text (primary)**
- AION2 Operation Policy, section 7 sanctions table: unauthorized program use is defined as "서비스의 기술적 보호 조치를 무력화하거나 정상적인 운영을 방해하는 컴퓨터 프로그램이나 기기 또는 장치" (programs or devices that defeat technical protection or disrupt normal operation). Sanction: 통합 = permanent integrated account restriction. Modifying client or server programs is in the same tier. Spreading others' personal information without consent: permanent. The policy contains no clause on users collecting game data. Dates listed on the page run to 2026-07-31, but which one applies to AION2 is unclear — [plaync.com](https://www.plaync.com/policy/operation/aion2)
- An article reports an added example: enabling acts normal users can't do under client limits. It also reports a 15-day appeal window and recovery of gains; it did not name meters — [tali.kr, 2026-10-27](https://tali.kr/aion2-dps-policy)
- Another page cites a "September 2026 revision" of the policy, which conflicts with or postdates the dates I saw — [aion2guide](https://aion2guide.org/guides/aion-2-damage-meter/)

**Public statements**
- 2026-05-26 live stream (Korea), as reported: "원치 않는 이용자의 딜 기록이 타인에게 공유되는 상황을 매우 심각하게 인지하고 있다". If site operators did not act before the weekend: "게임 내 데이터 수집을 전면 차단하고, 법무팀을 통한 법적 조치까지 진행할 것" — [Youth Daily, 2026-05-27](https://www.youthdaily.co.kr/news/article.html?no=219731)
- 2026-01-20 live stream: NC is reviewing inaccurate information shown on external sites and will follow up — [GameToc](https://www.gametoc.co.kr/news/articleView.html?idxno=105645)
- NC has published no third-party tool policy for AION 2; "silence is not permission" — [Metaroad](https://metaroad.gg/aion2/getting-started/aion-2-tools-korean-community-uses). No Global ban announcement on meters — [AION2 Atlas](https://aion2atlas.app/dps-meter/)
- Meter makers' "safe" claims are their own descriptions, not permission — [tali.kr](https://tali.kr/aion2-dps-policy). Aletheia's docs disclaim responsibility for account restrictions — [Metaroad](https://metaroad.gg/aion2/getting-started/aion-2-tools-korean-community-uses). AionFlex and RATmeter tell users to act at their own discretion — [AION2 Hub](https://aion2hub.com/tools/dps-meter), [RATmeter](https://github.com/Kuroukihime/AIon2-Dps-Meter)

**Enforcement**
- NC filed criminal complaints against macro users: 5 on 2025-12-12 and 7 on 2026-01-20. It had sanctioned 727,748 accounts across 65 waves by then — [Inven](https://www.inven.co.kr/webzine/news/?news=312963); [Nate](https://m.news.nate.com/view/20260120n28057). The stated reasons were account sales, currency distribution and service disruption, not meters.
- A Korean user wrote in Feb 2026 that NC had banned no one for meters in three months, while warning it could — [Inven](https://www.inven.co.kr/board/aion2/6388/104374) (anecdote).
- Community practice treats passive trackers as tolerated and injection as higher risk (community-reported, not official) — [aion2guide](https://aion2guide.org/guides/aion-2-damage-meter/)
- October Global wave totals conflict across sources (10,000 / 4,996 / 12,586) — [ExitLag](https://www.exitlag.com/blog/aion-2-bans-10000-accounts); [MMOexp](https://www.mmoexp.com/News/aion-2-daily-reset-bug-missing-shugo-keys-and-12-586-account-restrictions.html). These are bot-related, not meter-related.

**Third-party data terms**
- AIONING's terms forbid scraping and republishing its combat logs, DPS and rankings elsewhere without asking, with legal action threatened. This is a site's own terms, not NC's — [aion.ing](https://aion.ing/aion2/) (via search result)

### Inferences
- A website that never touches packets (a simulator with manual input or user-supplied Ctrl+X screenshots of their own character) is not a "program" acting on the service in any obvious sense, so it looks well outside the unauthorized-program clause. This is my reading, not legal advice or an NC ruling.
- The risk rises with each step toward other players' data: publishing named damage records, leaderboards, or scraped character data matches what NC threatened in May 2026. Own-character, consented, anonymized data is the safer design.
- Encouraging or bundling a packet meter is riskier than accepting data from it. The policy also sanctions making and distributing unauthorized programs, per [tali.kr](https://tali.kr/aion2-dps-policy). If meter data is ever accepted, the site should avoid distributing or promoting meters.
- The May 2026 statement came from the Korean service. Whether it binds Global practice is unconfirmed, but it is the best indicator of NC's attitude.

### Gaps
- Which sites the May 2026 warning targeted, whether they complied, and whether NC acted were not found. Whether "data collection" meant packet meters or something else is also unclear from the article.
- The Global-specific ToS text was not read; the plaync page is the Korean service policy. The Jan 2026 external-site review had no follow-up that I could find.
- No documented case of a player banned for a meter, and no official confirmation that none exist.

## Where do players discuss gear choices, and how do they decide today?

### Takeaway
Discussion centers on Korean boards (Inven, DC Inside, FMKorea) plus r/Aion2 and Discord. Current practice is empirical: test on a dummy with Ctrl+X or a meter, changing one variable, helped by stat-efficiency calculators and community stat priority lists. Combat score or item level are known to be poor proxies.

### Cited Findings
- Venues: Inven AION2 boards — [tools/calculators board](https://m.inven.co.kr/board/aion2/6444), [free board](https://www.inven.co.kr/board/aion2/6388/104374); [DC Inside minor gallery](https://m.dcinside.com/board/aion2/1672097); [FMKorea](https://www.fmkorea.com/9415196925); [Aion2kr Discord](https://discord.com/servers/2---aion2kr-1423329982293217322); r/Aion2 is cited as community reporting — [aion2guide](https://aion2guide.org/guides/aion-2-damage-meter/); Vortex Gaming guides — [example](https://vortexgaming.io/postdetail/1239220)
- Testing advice: repeat tests and change one variable at a time, because target, positioning, buffs, rotation and crits add variance — [DTG Reviews](https://www.dtgre.com/2026/10/aion-2-combat-analysis-check-damage-best-skills.html?m=1)
- Item level misleads: NC said new dungeon gear has a higher item level, but crafted gear performs better because of tuning slots and percentage options — [GameToc, 2026-01-20](https://www.gametoc.co.kr/news/articleView.html?idxno=105645). A guide says the same in general terms — [GamesFuze](https://gamesfuze.com/game-tips/aion-2-how-to-increase-damage-gear-optimization/)
- Combat score criticism: a Korean guide (via search snippet) says penetration was over-weighted and buff calculation was bugged, yet still recommends a fixed stat order (damage boost, then accuracy/attack, then crit) — [Vortex Gaming](https://vortexgaming.io/postdetail/717212)
- Weapon comparison videos and guides exist for new items — [Vortex Gaming](https://vortexgaming.io/postdetail/1284485) (via search snippet; conditions and date unconfirmed)

### Inferences
- The unmet need is plausible: players want "is item A better than item B for my character" but answer it by slow dummy testing, and only for gear they already own. A sim's value is answering before crafting or buying.
- Global launched only in early October 2026, so English-language practice is still forming and Korean experience is likely to lead.

### Gaps
- Global launch date differs by source (Oct 4 per [aion2guide](https://aion2guide.org/guides/aion-2-damage-meter/), Oct 5 per [Quasarzone search result](https://quasarzone.com/bbs/qn_game/views/462178)), likely time-zone related.
- Reddit and Discord threads were not read directly, so no measured view of how players receive the existing calculators is available.
