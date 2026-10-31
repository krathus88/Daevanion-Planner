# AION 2 damage formula and combat stats (state as of 2026-10-30)

Evidence tags used throughout:
- **[OFFICIAL]** NCSoft statement, or official broadcast reported by the press.
- **[CLIENT]** In-game tooltip or value read from client files by a fan database (the text is NC's, the reading is third-party).
- **[TESTED]** Community experiment with numbers shown.
- **[MODEL]** Community formula or stat value that a guide presents without showing its tests. Includes guides repeating the kanonxo / Aion Research Lab model.
- **[ESTIMATE]** Fan approximation or opinion.
- **[SNIPPET]** Seen only in a search result, page not opened. Lower confidence.

Most tests are from KR/TW clients. Dates are the source's own. Pages that could not be read: aion2maps.com "How damage works" (403), arca.live (403), thegameswiki.com damage page (429), aion2.akunito.com (DNS failure), and kanonxo's original document (not found, known only through MMO Herald's credit). Nearly every English guide below appears to derive from the same kanonxo-based model, so their agreement is not independent confirmation.

## Is a full or partial formula published? Order of operations, additive vs multiplicative

### Takeaway
NC has not published a formula. A community model exists that is detailed enough to simulate from, and its main stages rest on independent TW/KR tests. Multi-hit placement, some Attack-stage details, and Global constants remain unproven.

### Cited Findings
- **[MODEL] No official formula; the community model comes from kanonxo and Aion Research Lab, and multi-hit is the part not confirmed** (guide updated 2026-10-10) — [MMO Herald](https://www.mmoherald.com/aion-2/guides/damage-calculation). ExpCarry also says NC has not published it (modified 2026-10-18), and that vendor leaves multi-hit out of its formula because sources disagree — [ExpCarry](https://expcarry.com/aion-2-damage-formula).
- **[MODEL] Most complete published form** (2026-10-02, no author or source named; it calls everything confirmed except multi-hit placement, but shows no tests):
  `[[[((Pure Attack × Weapon Damage Boost) × Multi-Hit × Power Shard) + Attack Bonus) × Attack Increase % + PvE Attack + Boss Attack + Species Attack + Front/Back Attack] × Skill Coefficient] + Skill Additional Damage − [(Defense − Penetration) × 0.1]] × (Damage Boost + PvE + Boss + Species Damage Boost) × Critical Damage × Double × Front/Back Damage Boost × Skill Specialty = Final Damage`; the 0.1 becomes 0.01 in PvP — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html). The same structure, with Perfect listed as a multiplier, is in [MMO Herald](https://www.mmoherald.com/aion-2/guides/damage-calculation) and, as five stages, in [AI Exodus](https://ai-exodus.com/companion/aion/news/how-damage-works-in-aion-2/) (2026-10-07).
- **Pure Attack** = weapon, guard, accessories, Attack stat lines, manastones, closet. The character-sheet Attack excludes Weapon Damage Boost — [AI Exodus](https://ai-exodus.com/companion/aion/news/how-damage-works-in-aion-2/).
- **[TESTED] Taiwanese skeleton:** `(attack × skill coefficient % + skill fixed value − (defense × defense change % − penetration) / 10) × multiplier coefficients` (Inven summary of six Bahamut posts, 2025-12-24) — [Inven 909](https://www.inven.co.kr/board/aion2/6444/909). KR restatement with resist: `(attack × coef + fixed − def/10 + pen/10) × (1 + total amp − resist) × Double/crit/Perfect` (2026-03-08, flagged by its author as experimental and partly estimated) — [FMKorea](https://www.fmkorea.com/9569335827).
- **[TESTED] Additive group:** Damage, PvE, Boss and Race/Species amp sum, then boss damage resistance is subtracted: `(amp + PvE + boss + race) − boss resistance`. Each gave the same average damage per 5% (2025-12-24) — [Inven 902](https://www.inven.co.kr/board/aion2/6444/902). The base data is on [Bahamut, 米毛](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580) (last edit 2025-12-27), where a replier also says boss resistance subtracts directly from amp.
- **[TESTED] Independent multipliers:**
  - Rear amp: 10% amp + 3.1% rear gave 19,550 vs 18,963, exactly +3.1% — [Inven 909](https://www.inven.co.kr/board/aion2/6444/909).
  - Elemental amp / resistance reduction: 4296/3579 ≈ +20%, 4653/3579 ≈ +30%, attribute skills only — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).
  - Double: about ×2, multiplies with crit — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).
- **[TESTED] Exact crit formula** (2026-03-02; the author reports it exact at low inner stats, off by 2–3 at high stats, and possibly an early INT truncation; a full formula with ±10 error is withheld because of one unresolved variable; test procedure not described):
  `crit damage = [base damage + crit attack × (1 + amp% − resist%) × (1 + race amp%)] × (1.5 + crit damage amp%)`. PvP uses 1.25 instead of 1.5 and a 0.15 coefficient on crit attack — [Inven 1431](https://www.inven.co.kr/board/aion2/6444/1431).
- **Race amp placement conflict:** additive with the amp group per [Inven 902](https://www.inven.co.kr/board/aion2/6444/902) and [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580), but a separate `(1 + race amp)` term in the crit-attack part per [Inven 1431](https://www.inven.co.kr/board/aion2/6444/1431).
- **Attack-stage detail [TESTED]:** displayed attack = base + bonus attack × attack-cap %; max attack enters as (max / 2) × attack-cap %. The closet bonus applies to displayed attack, while max attack and weapon manastone attack are not affected by it (2026-07-07) — [Inven 23000](https://www.inven.co.kr/board/aion2/6448/23000). Attack-increase cap is reported as 65% (45% breakthrough + 20% closet) — [FMKorea](https://www.fmkorea.com/9569335827), yet the Inven tester reports a 101.4% attack-cap value and 21.2% wardrobe, so the two sources use different stat definitions.
- **[MODEL] Power Shard:** regular about +4.65–4.7%, Superior about +8.9% — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html), [AI Exodus](https://ai-exodus.com/companion/aion/news/how-damage-works-in-aion-2/).

### Inferences
- Working order for a simulator: Attack stage → coefficient + fixed − net defense → additive amp bucket minus resist → crit → Double → position → element → specialty. Multipliers within the last group commute, so their relative order only matters for rounding.
- My check on the Bahamut crit data supports the additive 1.5 term: 1020/1.5, 1054/1.55 and 1088/1.6 all equal 680. The non-crit sample was 672, so a crit-attack or variance term is probably also present.
- From Inven 23000: 25 × 2.014 × 1.212 = 61.0, matching its predicted gap of about 61. This suggests attack-cap and wardrobe multiply each other, a detail the one-term "Attack Increase %" in the community formula hides. This is my inference from one data point.

### Gaps
- The withheld variable in the ±10 formula, the rounding and truncation points, and what "Attack Increase %" fully contains.
- Whether crit attack and race amp belong inside the common model as Inven 1431 writes them. The English model lists Critical Attack only as a conditional flat, and says nothing on its amp scaling.
- No datamined formula code was found. Client-data sites publish stats and tooltips, not the calculation.

## How does each combat stat work? Caps and diminishing returns

### Takeaway
Client tooltips confirm the Global caps and per-point conversions. Most damage values come from tests. Diminishing returns mainly come from shared buckets and stat-versus-resistance curves, while hard caps need separating by client because Global and KR crit caps are reported differently.

### Cited Findings

**Caps and conversions**
- **[CLIENT] Caps:** Crit rate 50% (reduced by target Crit Resist), Evasion 30%, Cooldown reduction 60%, MP cost reduction 60%, Move Speed 150%. Attributes convert linearly at 0.1% per point: Might→Attack; Precision→Accuracy + Crit; Dexterity→Evasion + Block + Crit Resist. Deity stats also give 0.1%: Destruction→Attack + Perfect Resist; Death→Crit + Regen Penetration; Justice→Defense + Perfect; Freedom→Accuracy + Evasion; Illusion→CDR + Endurance Penetration; Time→Combat Speed + Double Resist; Wisdom→Double + MP Cost reduction (EU/NA client 2.0.9.0, extracted 2026-10-28) — [Aion2.gg](https://aion2.gg/guides/stats-explained).
- **[CLIENT] Tooltip text and further caps:** Combat Speed "Increases Attack Speed and Spell Action Speed," cap +200%; Attack +1,000% (build 0.0.4387.0, undated) — [MetaBot](https://metabot.gg/en/aion-2/stats).
- **[CLIENT] Daevanion full-board totals:** Nezekan Combat Speed +3%, CDR +3%; Zikel Damage Boost +3%, Attack Bonus +33; Vaizel Crit Damage +3%, Crit +55; Triniel Multi-hit +4.5%, Crit +75; Ariel PvE amp +6%, Boss amp +4%; Azphel PvP amp +6% (updated 2026-10-27) — [MetaBot Daevanion](https://metabot.gg/en/aion-2/guides/daevanion-guide).

**Attack, weapon min/max, variance**
- **[TESTED] Weapon attack is the only variance source.** With no weapon, skill damage was fixed at 1030 — [Inven 902](https://www.inven.co.kr/board/aion2/6444/902).
- **[TESTED] Max Attack** raises only the top of the range, so half its value reaches the average; bonus attack gave about 1.46% per 50 points and max attack about 0.87% per 50 points. Max beats bonus only above about 61% Perfect rate — [Inven 23000](https://www.inven.co.kr/board/aion2/6448/23000). A dummy test on whether Weapon Damage Boost applies to Max Attack is noted as not officially confirmed — [FMKorea](https://www.fmkorea.com/9569335827).
- **[MODEL] Value per 10 points:** Attack about 0.17%, Max Attack about 0.13%, Attack Bonus about 0.1% (KR end-game, Season 1, with buffs). Flats outside Pure Attack sit after Attack Increase and are worth less — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).
- **[TESTED] Weapon Damage Boost:** 8.3 points of boost gave about +5.5% at both 3,522 and 2,736 attack, about 0.66% per 1%, suggesting a near-multiplicative effect; based on few comparisons, and the author admits the ratio is not 1:1 (2026-07-28) — [Savetip](https://game.savetip.co.kr/aion2-weapon-damage-amplification-test/). The model puts it at 0.5–0.55% per 1% — [AI Exodus](https://ai-exodus.com/companion/aion/news/how-damage-works-in-aion-2/). Taiwanese early tests found 0.87–2.8% gain depending on gear attack share, so the author read it as "equipment damage amp" — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).

**Crit**
- **Crit chance is contested:**
  - **[CLIENT]** Global tooltip says 50% — [MetaBot](https://metabot.gg/en/aion-2/stats). A vendor reports parses consistent with 50% against Global Expedition/Transcendence bosses and about 95% in stagger windows — [ExpCarry](https://expcarry.com/aion-2-damage-formula).
  - **[MODEL]** Global 50%, Korea 80% — [MMO Herald](https://www.mmoherald.com/aion-2/guides/damage-calculation). The 80% cap on crit-vs-resist also appears in [AI Exodus](https://ai-exodus.com/companion/aion/news/how-damage-works-in-aion-2/) with no client noted, and in the KR [calculator](https://bongbong99999-debug.github.io/aion2ssow/).
  - **[TESTED]** TW dummy tests contradict a 50% cap there: crit 1048/1220/1326 gave 56%/80%/90% over 100 hits each. A fit of `1.0461 / [1 + exp(−0.0060 × (crit − 1024.52))]` applies to dummies only, and Rokah warns real boss rates and the cap may differ — [Inven 909](https://www.inven.co.kr/board/aion2/6444/909).
- **[MODEL] Skill passives add directly to crit rate;** at 80% a skill gains nothing from more crit — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).
- **Crit damage:**
  - **[TESTED]** Base ×1.5; crit damage amp adds to it. 672 non-crit → 1020 / 1054 / 1088 at 0% / 5% / 10% — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).
  - **[MODEL]** Boss crit damage resistance subtracts in the same term, with 25% assumed — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html). The KR calculator uses the same subtraction — [calculator](https://bongbong99999-debug.github.io/aion2ssow/).
  - **[MODEL]** About 0.4–0.6% damage per 1%, lower for classes with crit damage passives, higher with guaranteed crits — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).

**Double (also called Smite, Strike, 강타, 強擊)**
- **[TESTED/MODEL] ×2 in PvE;** ExpCarry reports about ×1.5 in PvP, and that "Double" is the Global name and "Smite" the KR/TW name — [ExpCarry](https://expcarry.com/aion-2-damage-formula). Effective chance = your % − target Double Resist, typically 25–32% — [FMKorea](https://www.fmkorea.com/9569335827). Bosses from Dying Dramata onward resist 30% — [MMO Herald](https://www.mmoherald.com/aion-2/guides/damage-calculation).
- **[MODEL] Worked example:** 80% sheet − 30% + 12% buffs = 62% effective, and +1% then adds about 0.617% (162→163) — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).

**Perfect**
- **[TESTED] Forces max weapon attack.** DPS per 1% = (max − min) / [100 × (max + min)] — [Inven 909](https://www.inven.co.kr/board/aion2/6444/909).
- **Gain conflict:** about 3% at 100% Perfect (TW, 2025-12) — [Inven 902](https://www.inven.co.kr/board/aion2/6444/902); versus measured 7–9% gain per Perfect hit across classes (2026-07, small sample) — [Inven 23000](https://www.inven.co.kr/board/aion2/6448/23000). The model mentions a hidden approximately 5% effect, about 0.1% per 1% — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).

**Multi-hit (combo hit, 다단히트)**
- **[CLIENT]** "Adds up to 4 hits, inflicting damage proportional to Attack." Listed per-hit values: extra hit 1 has hit value 20%, hits 2–4 have hit value 50%, and all have damage value 10%. The page does not explain how those combine with Multi-hit Chance — [MetaBot](https://metabot.gg/en/aion-2/stats).
- **[TESTED] Per-hit gain:** 1–4 hits measured 5.26 / 10.34 / 15.52 / 20.6% and 4.86 / 9.72 / 14.58 / 19.53%. In-game logged values must be corrected because of a display bug (2025-12) — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).
- **[TESTED] Gear dependence** (2026-02-19): 4-hit gain was 22.02% full gear, 20.66% without ring and necklace, 18.16% with weapon only. Per-hit gain rises from about 4.8% low spec to 5.8% high spec, and PvP is about 7.23% per hit vs PvE 5.81%. The author presumes it scales with total gear attack and says this is not certain. Damage amp changes did not affect it per the search summary. A skill with a +50% multi-hit modifier greatly raises its value, and stacking two can push further investment toward zero — [DC Inside](https://gall.dcinside.com/mgallery/board/view/?id=aion2&no=1619125).
- **Value per 1% conflict:** about 0.15% — [Inven 909](https://www.inven.co.kr/board/aion2/6444/909); about 0.16% implied by 11.28% → 1.81% — [DC Inside](https://gall.dcinside.com/mgallery/board/view/?id=aion2&no=1619125); about 0.33% at 36–40% chance — [AI Exodus](https://ai-exodus.com/companion/aion/news/how-damage-works-in-aion-2/). Inven 909 also saw about 2% on dummies vs 14–16% on boss logs, later attributed to the display bug — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).

**Accuracy, block, parry, evasion**
- **[MODEL] Accuracy cancels Block 1:1.** Each 100 points of gap is worth about 6–7%; Parry caps at 80%, reached at a 1,200 gap; crit vs resist uses the same logic — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html). The tooltip confirms only the opposed check, not a formula — [Aion2.gg](https://aion2.gg/guides/stats-explained).
- **[MODEL] KR raid requirements (accuracy/crit):** Ludra about 1,500/1,600; Corroded about 2,350/2,500; Muspel Hard about 2,800/3,150. Global Ludra is projected at about 1,200 / 1,200–1,400, unconfirmed — [MMO Herald](https://www.mmoherald.com/aion-2/guides/damage-calculation).
- **Block behaviour [ESTIMATE, unverified replies]:** blocked damage reported equal to Perfect crit damage, and blocks can crit; about 1,200 accuracy gives 95%+ hit rate on a Lv76 sanctuary boss; frontal block is reducible with accuracy; whether rear, crit or Perfect ignores block or evasion was raised without proof — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580). Accuracy has "diminishing returns" per one guide, while also being described as 1:1 — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).

**Penetration and defense**
- **[TESTED] Defense and penetration both act at 1/10 of value as flat damage**, after the skill coefficient, unaffected by attack but scaled by crit, Double and amp. 500 penetration measured about 88 on a 2-hit skill; a skill of about 17,420 gained about 0.5%, a fast one about 3–5% — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).
- **[CLIENT] Penetration** "Ignores target's Defense. Defense does not fall below 0" — [MetaBot](https://metabot.gg/en/aion-2/stats). The PvP factor is 1% instead of 10% per [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).
- **Once per skill use, not per multi-hit:** [Inven 909](https://www.inven.co.kr/board/aion2/6444/909), [Inven 902](https://www.inven.co.kr/board/aion2/6444/902). The Bahamut author: compute defense first, then split into hits. This conflicts with FMKorea's "more hits raise penetration efficiency" — [FMKorea](https://www.fmkorea.com/9569335827) — and, loosely, with 17173's per-attack wording — [17173](https://news.17173.com/content/12182025/164914835.shtml) (snippet).

**Amp and tolerance**
- **[TESTED] Boss resistance sets the value of amp:** efficiency rises with boss resistance and falls with your total amp. Example: at about 25% total amp, a 3.6% PvE title gave about 6% effective, below 3% above 90% total. A replier saw 3.7% PvE amp give about 5.6% on a Fire boss — [Inven 902](https://www.inven.co.kr/board/aion2/6444/902), [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).
- **[MODEL] Amp bucket caps and totals:** in-game maximum 200% per one KR writer — [FMKorea](https://www.fmkorea.com/9569335827); end-game totals exceed 180–200% — [AI Exodus](https://ai-exodus.com/companion/aion/news/how-damage-works-in-aion-2/).
- **[TESTED] Player damage tolerance:** types combine multiplicatively and stop at 80% (2026-03-16, about 10 trials per setup; the tester used a boss hit on a healer) — [DC Inside](https://gall.dcinside.com/mgallery/board/view/?id=aion2&no=1870796).
- **[MODEL] Endurance** halves damage on a chance; bosses have no Endurance Penetration — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).

**Combat speed**
- **[ESTIMATE] Action-cycle model:** cycle = cast time × (1 − cast speed %) + motion time × (1 − attack speed %). A 2 s cycle at +20% gives 1.6 s, or +25% DPS in theory (2025-11-29) — [Inven 533](https://www.inven.co.kr/board/aion2/6444/533).
- **[TESTED] Effect is stepped and skill/class-specific, not smooth:**
  - Brawler: second cap at 117.2–117.3; 810 hits at 117.1 vs 860+ at 117.3 (2026-07-27) — [Inven 2147](https://www.inven.co.kr/board/aion2/6444/2147).
  - KR calculator: Ranger peak 135.1%, Chanter main cap 90.5% — [calculator](https://bongbong99999-debug.github.io/aion2ssow/).
  - [SNIPPET] Chanter 82.5% vs 90.5% by skill — [Inven](https://www.inven.co.kr/board/aion2/6451/11904). Assassin ranges 95.8–100.8% and 145–150% — [Inven](https://www.inven.co.kr/board/aion2/6449/9997). Cleric animation frames step down 63/60/57/54 by bracket — [DC Inside](https://m.dcinside.com/board/aion2/1505114?page=6&recommend=1). Ranger charge speed benefits only up to a threshold — [Inven](https://www.inven.co.kr/board/aion2/6450/9657).
- **[MODEL] Latency interaction:** ping and FPS affect it; a 150–200 ms difference corresponded to "roughly 50–70% damage" for Templar, Brawler and Assassin, with Spiritmaster a possible outlier due to pet damage — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html). AI Exodus phrases it as costing "about half or more" — [AI Exodus](https://ai-exodus.com/companion/aion/news/how-damage-works-in-aion-2/). Wording is ambiguous on damage lost vs retained, and no raw test was available.

**Cooldown reduction**
- **[CLIENT] Cap 60%;** Illusion −0.1% per point — [MetaBot](https://metabot.gg/en/aion-2/stats). Attainable: Global about 19–21% BiS; TW/KR about 34%, near 40% with Illusion Arcana — [Gameplay Tips Spiritmaster](https://gameplay.tips/guides/aion-2-spiritmaster-rotation-macros-guide.html). No test of the formula was found.

### Inferences
- The fit `1.0461 / [1 + exp(...)]` has three free parameters against three data points, so it fits exactly by construction (I recomputed 56.0 / 79.9 / 89.9%). It has no predictive evidence, and its slope (about 12% per 100 between tests) disagrees with the model's 6.66% per 100, so a sim should not treat either as established.
- The 0.33% per 1% multi-hit value cannot follow from a max 4 × about 5.5% = 22% proc unless something else is involved. The 0.15–0.16% figures fit better. Client "10% damage value" vs measured about 5% is also unexplained, possibly a coefficient or pre-defense base (the Yihao theory in the DC post, disputed by its author).
- The penetration conflict likely reflects wording: "once per skill use" is consistent with low-damage fast skills gaining more, without requiring a per-hit application.
- Several guides say "bosses have no crits or multi-hit." In context this describes bosses' own attacks, which makes player resist stats useless, and does not mean players cannot crit bosses.

### Gaps
- Exact crit-rate and hit-rate functions, and which cap applies to which KR/TW client today. The 80% figure lacks a client-data source.
- How multi-hit's hit-value table maps to the 1–4 hit distribution, and its true placement in the formula.
- Whether CDR divides or multiplies cooldown, and how it interacts with Combat Speed.
- Block's damage reduction percentage, and evasion's formula. I found no numeric block reduction source.
- Current per-class Combat Speed breakpoints on Global. Published ones are KR/TW and mixed in date.

## How do skill levels, stigmas/specialization and Daevanion nodes change skill damage? Are coefficients visible?

### Takeaway
Tooltips show coefficients (fixed value plus "+X% Attack"), so skill data can be taken from client-derived databases. KR/TW tests say level changes only the fixed part, but I found no per-level progression table to verify that.

### Cited Findings
- **[CLIENT] Tooltip format and level-1 examples:** Rage Burst 1,327 (+218% Attack); Triniel's Dagger 1,374 (+256%); Fire Wall 1,300 (+220%) plus Embers 650 (+110%) per second for 10 s; Ancient Spirit skill 1,082 (+189%) per hit; Marchutan's Wrath 1,384 (+234.3%) (client 2.0.3.0, updated 2026-10-27) — [MetaBot Stigma](https://metabot.gg/en/aion-2/guides/stigma-guide).
- **[CLIENT] Tooltips with level-1 and "At max level" views** exist — [DaevaHelper](https://daevahelper.com/skills) (Global, October 2026). I did not capture an actual level-1 and max pair, and the database's own content did not expose per-level figures to my fetch — [dbaion2](https://dbaion2.ru/en/skills/).
- **[TESTED] Structure:** skill damage is a fixed value plus a percentage of attack. Level changes the fixed value and the attack percentage stays constant; skills still deal damage at 0 attack — [Inven 909](https://www.inven.co.kr/board/aion2/6444/909). One TW-tested skill was about 45% of attack — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580). Inven 902 restates 45% as if general ([Inven 902](https://www.inven.co.kr/board/aion2/6444/902)), but the tooltips above show coefficients differ by skill.
- **[CLIENT] Daevanion skill nodes:** each adds +1 level to a named skill; there are 22 per main board (Nezekan, Zikel, Vaizel, Triniel), none on Ariel or Azphel — [MetaBot Daevanion](https://metabot.gg/en/aion-2/guides/daevanion-guide). 12 active (3 points) and 10 passive (2 points) per board — [MetaRoad](https://metaroad.gg/aion2/progression/aion-2-daevanion-and-arcana) (2026-10-21).
- **Level sources [ESTIMATE, single-sourced]:** points to 10, four Daevanion boards +4, Arcana +2, Soul Bindings to 20; the page calls the ceiling unresolved — [AION2 Guide](https://aion2guide.org/systems/aion-2-skill-points-guide/) (2026-09-30, relaying skycoach.gg).
- **Specializations:** active-skill slots open at levels 8, 12, 20, with an extra option at 16 — [DaevaGuides](https://daevaguides.com/en/guides/global-vs-korea/) (checked 2026-10-21). Stigma specialties auto-activate at levels 5/10/15/20. Examples: "+20% damage with more targets," "deals damage one additional time," single-target to AoE, cooldown −30 s, cast while moving — [MetaBot Stigma](https://metabot.gg/en/aion-2/guides/stigma-guide).
- **[TESTED] Specialty as a multiplier:** a Chanter "+20% with more targets" gave +5/10/15/20% at 1/2/3/4 targets — [Inven 902](https://www.inven.co.kr/board/aion2/6444/902). Its multiplier sits in the final stage per [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html).

### Inferences
- Under the model, a Daevanion skill node's damage gain equals the level's fixed-value increase ÷ total pre-multiplier damage, so a high-attack character sees a smaller percentage from skill levels. That is my reasoning from the structure, not a measured result.
- Skill specialties that are not number tweaks (extra hit, AoE conversion, cooldown changes, mobility) need per-skill rules rather than a shared formula term.

### Gaps
- Actual per-level fixed-value tables. Verify from client data whether "+X% Attack" truly stays constant. The "+689% Attack" example on DaevaHelper could not be tied to a skill or level, so it does not settle this.
- Whether Stigma levels scale the same way as active skills.
- Numeric Global effect of each skill-level source. No source quantifies damage per node.

## How do boss defenses, level differences, positional modifiers and variance work?

### Takeaway
Bosses are characterized by damage resistance, crit and Double resistances, block, and defense values that are only estimated from player tests. Level penalties and positional amps have clean tested values, though the level data dates from December 2025.

### Cited Findings
- **[ESTIMATE] Boss damage resistance:** Transcendence 10-tier first boss about 65.5%; Unbelief (불신) first boss 30%; village dummy 10% (TW/KR, 2025-12) — [Inven 902](https://www.inven.co.kr/board/aion2/6444/902). Conquest Krao first boss about 9% — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580). KR calculator ships partly estimated presets — [calculator](https://bongbong99999-debug.github.io/aion2ssow/).
- **[MODEL] Boss Double Resist 25–32%** — [FMKorea](https://www.fmkorea.com/9569335827). Crit damage resistance about 25% assumed — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html). Higher-level bosses have more crit resist and block per a Bahamut reply, unquantified — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).
- **[ESTIMATE] Defense examples:** the same mechanism applied to the player: boss skill of 50,000 vs 20,000 defense gives 48,000 (−4%), while a 3,000 mob hit gives 1,000 (−67%) — [Inven 2611](https://www.inven.co.kr/board/aion2/6438/2611).
- **[TESTED] Level suppression relative to level 45:** 46 = 0.9488; 47 = 0.8956; 48 = 0.843; 49 = 0.7925; 50 = 0.7427; 51 = 0.722; 53 = 0.711. About −5% per level up to 5 levels, then much less (2025-12) — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580). Accuracy and crit reportedly fall sharply too, no numbers — [ExpCarry](https://expcarry.com/aion-2-damage-formula).
- **[TESTED] Positional:** `(rear amp − rear tolerance) × rear uptime %`, own bucket — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580). Front amp also multiplicative per [SNIPPET] a test relayed in search results. Model assumes about 75% uptime and 0.57–0.65% per 1% — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html). Calculator offers 40–100% uptime — [calculator](https://bongbong99999-debug.github.io/aion2ssow/). Front/Back Attack (flat) is a separate low-tier stat — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html). Global Front/Back boost starts at zero per [MMO Herald](https://www.mmoherald.com/aion-2/guides/damage-calculation). NC announced boss rear-direction markers for May 13, 2026 **[OFFICIAL, via press]** — [DailyGame](https://www.dailygame.co.kr/view.php?ud=20260429113457271043da15d9d2_26).
- **[TESTED] DoT:** ignores defense; does not trigger Perfect, crit, Double or multi-hit; no positional or block/hit checks — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580); similar in [Inven 909](https://www.inven.co.kr/board/aion2/6444/909).
- **[TESTED] Variance** comes from the weapon range. Other randomness comes from crit, Double, Perfect and multi-hit procs — [Inven 902](https://www.inven.co.kr/board/aion2/6444/902).

### Inferences
- For a typical boss, defense is minor on large hits and more meaningful for fast small hits, so penetration and defense can be modelled but will rarely change rankings on heavy skills.
- Fixed-seed variance is simple to reproduce: a uniform roll on [min, max] weapon attack, though that uniform shape is implied and not directly tested.

### Gaps
- No boss defense table for any client. No confirmed Global boss resistance values; all figures above are from KR/TW and 2025–early 2026 content.
- Level-gap values at current level caps, and their Global equivalent. Whether the same multipliers apply when the player is above the target.
- Whether rear attacks have a base bonus without Front/Back amp, or whether they reduce block.

## Which class-specific mechanics would be hard to model?

### Takeaway
A shared formula will not cover rotations: pets with snapshots, stack buffs, party buffs, stagger windows, frame-stepped speed and latency all need per-class handling. No public simulator or proc-rate dataset turned up.

### Cited Findings
- **Spiritmaster** (Global Season 1, 2026-10-10): spirit stats snapshot at summon; Ancient Spirit (90 s) is the main damage; Dimensional Control and Elemental Fusion become available from summons or Spirit skill use; charged skill to level 3; stacks to 5 on Cold Shock and Element Unification; mana is a constraint; ping, FPS and skill-queue setting affect results; external macros reported slightly better — [Gameplay Tips Spiritmaster](https://gameplay.tips/guides/aion-2-spiritmaster-rotation-macros-guide.html). Elemental Fusion extra damage measured about 29.89% and 18.67% of comparisons on Bahamut — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).
- **Crit damage passives and guaranteed crit:** Gladiator Murderous Burst, Chanter Wind's Promise, Ranger Hunter's Resolve and Bow of Blessing, Assassin Assault Stance and Illusive Clone, Cleric Earth's Grace — [Gameplay Tips](https://gameplay.tips/guides/aion-2-how-stats-work-damage-formula-guide.html). Guaranteed-crit skills ignore crit rate but still suffer crit damage resistance — [calculator](https://bongbong99999-debug.github.io/aion2ssow/).
- **Party buffs in the KR calculator:** Cleric/Chanter +25% amp and +5% Double; Templar Lv30 +40% amp; a 질풍 speed buff of +20%p that does not self-stack — [calculator](https://bongbong99999-debug.github.io/aion2ssow/). The same tool excludes some Sorcerer speed-up effects and all skill coefficients.
- **Elemental skills:** Bahamut's ×1.2–1.3 applied only to attribute skills — [Bahamut](https://forum.gamer.com.tw/C.php?bsn=82913&snA=2580).
- **Chanter:** rotation built around buff windows and skill-specific Combat Speed thresholds — [Inven](https://www.inven.co.kr/board/aion2/6451/11904) [SNIPPET]; class patches moved a healing buff and changed PvP damage **[OFFICIAL, via press]** — [DailyGame](https://www.dailygame.co.kr/view.php?ud=20260429113457271043da15d9d2_26).
- **Stagger windows:** about 95% crit rate — [ExpCarry](https://expcarry.com/aion-2-damage-formula); Spiritmaster uses cooldown-reducing skills in stagger — [Gameplay Tips Spiritmaster](https://gameplay.tips/guides/aion-2-spiritmaster-rotation-macros-guide.html).
- **Multi-hit modifiers on skills:** +50% skills change stat values by class — [DC Inside](https://gall.dcinside.com/mgallery/board/view/?id=aion2&no=1619125).
- **Latency:** see Combat Speed above. It makes a tick-based sim hard to match real play without a ping and FPS model.

### Inferences
- The hardest parts to model are, in order: latency and Combat Speed breakpoints, buff uptime with real player rotation, pet snapshots and pet stat inheritance, and proc rates that are unpublished. Stat-efficiency comparison (as the KR calculator does) is much more feasible than an absolute DPS sim.

### Gaps
- Proc rates for most class passives and combo chains. Assassin, Brawler, Gladiator, Ranger and Sorcerer specifics were not established to a modelling standard here.
- Pet stat inheritance (which player stats apply to spirit damage and whether they multiply). Only the snapshot claim and tooltip numbers were found.
- I found no public full rotation simulator, only stat-efficiency calculators and a video on a calculator I did not open ([YouTube](https://www.youtube.com/watch?v=MPd1xPREivQ)).

## How much does this differ between Korean and Global clients?

### Takeaway
The stacking structure is believed shared, but constants, available stats, gear ranges, caps and content differ enough that KR numbers should not be reused for Global without checking. Stat-priority orderings transfer better than decimal values.

### Cited Findings
- **Differences reported as confirmed** (checked 2026-10-21): Global has level cap 45 vs KR/TW 50; 4 stigma slots vs 6; max stigma level 20 vs 25; 6 Daevanion boards vs 8 (no Marchutan or Yustiel); 5 Arcana slots and no Libra vs more; pet Genus max 3 vs 5; no Heroic gear; lower item levels and soul-imprint maximums; no large PvE % on crafted gear; 8 classes vs 9 (no Brawler). The same page says "Damage bonuses stack the same way," and reports Strike as weaker on Global from a single TW post — [DaevaGuides](https://daevaguides.com/en/guides/global-vs-korea/).
- **Timeline:** Global early access 2026-09-30, free-to-play 2026-10-05, Ariel board added October 21 or 23 by source — [DaevaGuides](https://daevaguides.com/en/guides/global-vs-korea/), [MetaBot Daevanion](https://metabot.gg/en/aion-2/guides/daevanion-guide).
- **Crit:** Global 50% vs Korea 80% — [MMO Herald](https://www.mmoherald.com/aion-2/guides/damage-calculation); warning against 80% targets on Global — [ExpCarry](https://expcarry.com/aion-2-damage-formula).
- **CDR:** Global about 19–21% vs KR/TW 34–40%. The same guide says Wisdom is absent on Global — [Gameplay Tips Spiritmaster](https://gameplay.tips/guides/aion-2-spiritmaster-rotation-macros-guide.html), which sits oddly with Wisdom's listed effects in the Global-client conversion table — [Aion2.gg](https://aion2.gg/guides/stats-explained). They may mean Arcana or gear availability.
- **Daevanion node sizes:** a global-test-client vs KR comparison reported Combat Speed 1.5% vs 2.5% and Damage Boost 2.5% vs 5% **[SNIPPET: seen in a search summary, source page not pinned down, and test-client only]**. MetaBot's live page lists Nezekan Combat Speed +3% total on two nodes (1.5% each, matching that figure) — [MetaBot](https://metabot.gg/en/aion-2/stats).
- **Value caveat:** the English model's stat tables are from KR end-game with support buffs. Global characters have fewer stats and less dilution, so use the order rather than decimals — [AI Exodus](https://ai-exodus.com/companion/aion/news/how-damage-works-in-aion-2/). Pre-launch commentary said Global Might/Precision ranges are much lower, and Attack, Crit, Accuracy higher, per scale-test data with no measured results — [AION Strategies](https://www.aionstrategies.com/2026/09/aion-2-stats-guide-combat-stats-explained.html) (2026-09-28).
- **KR PvP change [OFFICIAL, via press]:** announced 2026-04-28: PvP amp and resist caps removed, a 20% minimum correction added, accuracy (적중) standardized at 1.2% across classes, with Gladiator down from 2% (my reading is that this may be a status-hit stat; the article gives no formula) — [DailyGame](https://www.dailygame.co.kr/view.php?ud=20260429113457271043da15d9d2_26).

### Inferences
- Current model constants like 1.5 crit, ×2 Double, and 0.1 defense are shared only by assumption or from limited Global checks. They should be re-tested on the Global client.
- Most tested values predate later KR patches (Chapter 1 in July 2026, class changes) and predate Global altogether, so treat them as structure rather than current magnitudes. A Global re-measurement of a small set of skills against a dummy would be the cheapest validation.

### Gaps
- No independent Global replication of the full formula was readable. aion2maps.com, cited by ExpCarry as a Global model and test source, returned 403 and should be read manually.
- Global Double (Strike) multiplier, boss resistances, and current KR/TW crit cap source. Also whether the KR 80% figure was changed by a patch or never was a hard cap.
- Global build labels vary among databases (0.0.4387.0, 2.0.3.0, 2.0.9.0), and it is unclear which values changed across them.
