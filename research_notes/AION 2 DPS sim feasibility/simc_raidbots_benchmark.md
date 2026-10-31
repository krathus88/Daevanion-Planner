# SimulationCraft and Raidbots as the benchmark for a game DPS simulator

Source note: Medium posts by Raidbots returned HTTP 403 on direct fetch. Claims marked "(snippet)" come from search result text only, not from reading the full page. Numbers marked "own test" were run for these notes (Node 24, this PC, script at `C:\Users\marco\AppData\Local\Temp\claude\C--Users-marco-Desktop-Stuff-Projects-Daevanion-Optimizer\31c6516e-32ab-4252-b7c0-59901a927087\scratchpad\bench.js`). They are illustrative and are not measurements of SimC.

## How does SimC model combat, and how many iterations and how much time does it take to separate two gear options?

### Takeaway
SimC is a Monte Carlo event simulation: a character follows a priority list through many randomized fights, and the mean DPS carries a confidence interval that shrinks with the square root of iterations. Separating gaps of 1% or more takes hundreds of iterations, while gaps of 0.1% take tens of thousands, so Raidbots culls candidates in stages instead of running every option at full precision.

### Cited Findings
- An action priority list (APL) is an ordered list of actions. SimC periodically scans it from the top, skips anything unavailable (on cooldown, conditions unmet), and uses the first usable action. Conditions use `if=`, for example `actions+=/recklessness,if=buff.bloodlust.react=1` — [SimC wiki, ActionLists](https://raw.githubusercontent.com/wiki/simulationcraft/simc/ActionLists.md)
- Defaults: `target_error` 0.2 (0.2%), iteration cap 1,000,000, and the run stops once the target is reached. A fixed `iterations=N` with no target runs exactly N — [SimC wiki, StatisticalBehaviour](https://github.com/simulationcraft/simc/wiki/StatisticalBehaviour). The older starter guide still says the default is 1k iterations and recommends 10,000 for stat scaling, so it is probably out of date — [SimC wiki, StartersGuide](https://raw.githubusercontent.com/wiki/simulationcraft/simc/StartersGuide.md)
- The 95% interval on mean DPS is ±1.96·σ/√n. The wiki writes the interval on a difference of two means as "1.96 * sqrt( 1.96 ) * σ / sqrt( n )" — [SimC wiki, FightingVariance](https://raw.githubusercontent.com/wiki/simulationcraft/simc/FightingVariance.md)
- A fixed seed does not make slightly different inputs directly comparable — [StatisticalBehaviour](https://github.com/simulationcraft/simc/wiki/StatisticalBehaviour). Seeding also does not reduce scale factor variance — [SimC wiki, StatsScaling](https://raw.githubusercontent.com/wiki/simulationcraft/simc/StatsScaling.md)
- Scale factors (stat weights) are computed as (DPS with stat + delta − base DPS) / delta. The default delta is the rating for 3.5% haste, deltas must be large enough to beat variance, and larger deltas can lower factors because of diminishing returns. `scale_factor_noise` warns when a factor is at or below its error margin, (error(base) + error(base+delta)) / delta — [StatsScaling](https://raw.githubusercontent.com/wiki/simulationcraft/simc/StatsScaling.md)
- Raidbots Smart Sim runs three stages at 1%, 0.2% and 0.05% error, dropping weak options after each. "Often only 100–200 iterations are needed" in early rounds. Smaller sims (Stat Weights, Gear Compare) target 0.05% instead of a fixed count — [Raidbots, Smart Sim](https://support.raidbots.com/article/55-smart-sim)
- At 0.05% margin, sims "will require tens of thousands of iterations", and lower-precision passes run "in hundreds or thousands" — [Raidbots, gem/enchant sims](https://support.raidbots.com/article/64-why-do-gem-enchant-sims-take-so-long)
- Top Gear with gems and enchants can take "10x longer (or more)" because many close options must reach high precision — [Raidbots, Smart Sim](https://support.raidbots.com/article/55-smart-sim)
- Own test: a toy event sim in plain JS (180 s fight, 12 skills, crit and damage rolls, 296 events per fight) gave a per-fight CV (σ/mean) of 2.85%. A 600 s, 30-skill version gave 1.56%. The toy has no large procs or long cooldowns, so real games should run higher.

### Inferences
- The "sqrt(1.96)" in the wiki looks like a typo for sqrt(2), the standard factor for a difference of two independent means. I use √2 below.
- Implied real CV: with n = (1.96·CV/e)², Raidbots' "tens of thousands" at e = 0.05% implies a CV of about 2.5% at 10k iterations and about 8% at 100k.
- Iterations per option to make a true gap g reach 95% significance, n ≈ 2·(1.96·CV/g)² (own calculation). This gives only about 50% power when the true gap equals g. Multiply by about 2 for 80% power.

| True gap g | CV 2.5% | CV 5% | CV 10% |
|---|---|---|---|
| 2% | 12 | 48 | 192 |
| 1% | 48 | 192 | 768 |
| 0.5% | 192 | 768 | 3,073 |
| 0.1% | 4,802 | 19,208 | 76,832 |

- Identical RNG seeds are not a free variance reduction, because a stat change shifts the event stream and the rolls stop lining up. A browser sim should not count on common random numbers without testing them.
- Deterministic closed-form comparisons have zero sampling noise, which is the main reason they suit very small gaps (see the alternatives section).

### Gaps
- I found no published SimC figure for time per iteration or typical wall-clock time for a whole Top Gear run. Raidbots' pages give no timings.
- No source gives WoW's measured per-fight CV by spec. The 2.5–8% range above is inferred.

## How do SimC and Raidbots get data and keep up with patches, and what is the maintainer effort per class?

### Takeaway
WoW's advantage is that exact spell and item data can be extracted from the game client and a character can be imported automatically. The per-class logic is still written by hand by volunteers, and that is what fails first: spec support visibly lags at expansion prepatches.

### Cited Findings
- `casc_extract.py` downloads game data from Blizzard's CDN and can pull binary DBC files. `dbc_extract.py` converts DBC data into usable formats, and hotfix data comes from the local client's `DBCache.bin`. The workflow is download, generate, rebuild SimC, dump spell data — [SimC wiki mirror, CASC and DBC Extract](https://github.imc.re/simulationcraft/simc/wiki/Using-CASC-Extract-and-DBC-Extract/34830b621a37bcf5c11060ad1842fd5ddd3a4fd0) (snippet; canonical page is [here](https://github.com/simulationcraft/simc/wiki/Using-CASC-Extract-and-DBC-Extract))
- `dbc_extract.py` extracts a master spell list, talents, scaling data for spells and combat ratings, and lists used to automate parts of the modeling — [SimC dbc_extract README](https://raw.githubusercontent.com/simulationcraft/simc/midnight/dbc_extract3/README.md)
- Class logic is coded by hand per class, for example `/engine/class_modules/sc_mage.cpp`, with APL functions in the same file — [SimC wiki, Participate](https://raw.githubusercontent.com/wiki/simulationcraft/simc/Participate.md)
- Maintenance is run by volunteers with "little in the way of strict responsibility and ownership". Each class can have a "main maintainer" and its own Discord, and maintaining talents, gear and default APLs is "a huge task" that "requires virtually zero C++ knowledge" — [Participate](https://raw.githubusercontent.com/wiki/simulationcraft/simc/Participate.md)
- SimC is "an open source project developed by volunteers" focused on damage dealing. Healer and tank specs are often unsupported or unmaintained, and a spec can gain a rotation in one expansion and lose it in the next. Many specs were not working during a prepatch — [Raidbots, Why isn't my spec supported?](https://support.raidbots.com/article/69-why-isnt-my-spec-supported)
- Midnight prepatch support was partial, "hit-or-miss", with Droptimizer disabled — [Raidbots, Midnight Prepatch Support](https://support.raidbots.com/article/71-midnight-prepatch-support) (snippet)
- Game data is "usually updated quickly" after patches and announced hotfixes, though bugs can enter from how data is used or how Blizzard changes it — [Raidbots, tooltip article](https://support.raidbots.com/article/17-a-tooltip-is-wrong-is-the-sim-wrong)
- Raidbots' Nightly SimC build is never more than 24 hours old, and the SimC addon export is the fallback when Blizzard's Armory API has trouble — [Raidbots FAQ](https://medium.com/raidbots/frequently-asked-questions-2933b01a2d6e) (snippet)
- WoWSims divides the work the same way: a shared engine, per-spec sims, and each community owning its spec's accuracy. Items come from a generator (`make items`) — [WoWSims WotLK](https://github.com/wowsims/wotlk)

### Inferences
- The prerequisites that made SimC possible:
  1. Machine-readable, patch-exact spell data from the client.
  2. Automatic character import (API or addon string).
  3. Combat logs that expose real rotations and damage.
  4. A large volunteer pool in every class.
  5. A public test realm, which the wiki's `--product` option for PTR builds implies.
- A game with little public data lacks items 1 to 3 at the start. Without client extraction, every coefficient becomes a manual measurement, and each balance patch can invalidate those measurements.
- Per-class engine and APL work scales linearly with the number of classes (AION 2 has 8 in this repo), and this is true even with perfect data.

### Gaps
- No source quantifies maintainer hours per class. I also found no current maintainer roster. The GitHub commit history would be the way to estimate it.
- Raidbots' own architecture post ([How SimBot works](https://medium.com/raidbots/how-simbot-works-1e9d24e6093b)) could not be read (403), so cloud worker counts and throughput are unknown.

## How is SimC validated against real results, what error is acceptable, and what are the known limits?

### Takeaway
I found no published study of SimC's absolute error against logs. Its reported "error" is statistical noise only and says nothing about model accuracy. Validation seems to happen per ability and per spec through community testing, and the accepted standard is correct relative comparisons in a defined scenario, not a match to any given player's logs.

### Cited Findings
- SimC's "error" estimates sampling stability: more iterations lower it, and the guide's example accepts 0.3% — [StartersGuide](https://raw.githubusercontent.com/wiki/simulationcraft/simc/StartersGuide.md)
- The SimC wiki's own framing is that a simulation centers on the target with scatter, while a formulation is repeatable but possibly off-center, and that what matters is "sufficient accuracy and sufficient precision" — [SimC wiki, FormulationVsSimulation](https://github.com/simulationcraft/simc/wiki/FormulationVsSimulation)
- A competing sim's log comparison (AskMrRobot) matched one fight within about 90k DPS, roughly 12%, after adjusting settings, and the author warned of highly variable results for some specs. This is AMR, not SimC, and a single case — [AMR forum](https://forums.askmrrobot.com/t/simulation-accuracy-amr-matches-real-combat-logs/261) (snippet)
- A player's claim that a Warrior profile is "99%" on target after in-game checks is self-reported with no method — [Icy Veins thread](https://icy-veins.com/forums/topic/6628-simcraft-vs-virtual-reality) (snippet)
- The default Raidbots fight is Patchwerk: single target with no movement — [Wowhead guide](https://cn.wowhead.com/guide=6145/the-basics-of-raidbots-and-simulation) (snippet). SimC also offers "Helter Skelter" and custom movement phases — [StartersGuide](https://raw.githubusercontent.com/wiki/simulationcraft/simc/StartersGuide.md)
- Raidbots tells users to check values in SimC's Full HTML Report and report wrong values on Discord or GitHub. It does not describe a formal in-game test — [Raidbots, tooltip article](https://support.raidbots.com/article/17-a-tooltip-is-wrong-is-the-sim-wrong)
- The WoWSims repo uses `make test` and `make update-tests` as expected-result regression tests, which guard against unintended changes and do not prove truth — [WoWSims WotLK](https://github.com/wowsims/wotlk)

### Inferences
- Validation should be split into layers:
  - Single-ability damage against in-game hits, which is precise and cheap.
  - Rotation or cast count against logs.
  - Full fight against logs, which is noisy because of player skill and fight mechanics.
- A low-data game can realistically do the first layer and part of the second.
- A figure like "about 12% absolute after tuning" should not be read as a failure, because the sim's use is comparative. It is one anecdote from another tool, so it should not be quoted as SimC's error.

### Gaps
- No formal SimC-versus-Warcraft Logs error figure was found. Searches returned only forum posts.
- The specifics of class-module in-game testing (Discord, per-spec spreadsheets) are not public on the pages I could read.

## What simpler alternatives exist, when are they enough, and what about games with little official data?

### Takeaway
Several major games rely on tools that are not full simulators. GW2's gear optimizer multiplies stats by coefficients calibrated from logs, and FFXIV's tools rest on a community-derived formula. Both show that a formula plus measured coefficients can rank gear usefully, as long as gear changes little about the rotation.

### Cited Findings
- **Guild Wars 2 (Discretize):** does not run a full combat simulation. It treats effective attributes as roughly constant and multiplies them by skill coefficients per damage type. Coefficients can be solved from an in-game log (Elite Insights) or taken from a spreadsheet — [Discretize, How It Works](https://raw.githubusercontent.com/discretize/discretize-gear-optimizer/staging/docs/How%20It%20Works.md)
- Its limits: flat and percentage bonuses are "generally very accurate". Uptime bonuses are averaged and can be off for burst builds. Rotation changes and per-cast effects are not simulated. Stale coefficients can give unrealistic DPS, though this "usually doesn't change the optimal gear" — [same page](https://raw.githubusercontent.com/discretize/discretize-gear-optimizer/staging/docs/How%20It%20Works.md)
- It brute-forces combinations: three affixes plus a full set of infusions is about 90 million, and it can estimate the relative difference between setups — [same page](https://raw.githubusercontent.com/discretize/discretize-gear-optimizer/staging/docs/How%20It%20Works.md), [repo](https://github.com/discretize/discretize-gear-optimizer). The repo has a `wasm_module` directory, which suggests a Rust WASM component.
- Community practice tunes the Power coefficient so that simulated DPS approximates realistic golem benchmarks, and that coefficient affects which sigils win — [Snow Crows advanced guide](https://snowcrows.com/guides/gear-optimizer/gear-optimizer-advanced-guide) (snippet). An older GW2 rotation calculator claimed "90-95+%" with correct settings, which is anecdotal and from 2016 — [Reddit mirror](https://teddit.bsalzberg.com/r/Guildwars2/comments/4ft01q/qt_dps_benchmarkstests_for_all_classes/d2bt338) (snippet)
- **FFXIV:** Allagan Studies documents its theorycrafting tests and equations — [Allagan Studies launch](https://www.akhmorning.com/news/allagan-studies-release/). Testing "seems accurate" at normal to high damage, with errors at extreme values such as almost no Attack Power, which the author says does not affect standard play — [How to be a Math Wizard, Damage & Healing](https://akhmorning.com/allagan-studies/how-to-be-a-math-wizard/shadowbringers/damage-and-healing) (snippet)
- XivGear offers multiple sims per job, brute-force materia and food solving with optional GCD constraints, and DPS simulation "done for most jobs" with a few still missing — [gear-planner repo](https://github.com/xiashtra/gear-planner). The separate ffxivcalc simulator reports about 430 tests — [PyPI](https://pypi.org/project/ffxivcalc/0.8.618/) (snippet)
- **Path of Building:** gives offence and defence calculations including DPS, can include auras, buffs and monster resistances to "estimate your effective DPS", shows a breakdown, and flags unsupported modifiers in red — [PoB repo](https://github.com/PathOfBuildingCommunity/PathOfBuilding)
- **Genshin Impact (gcsim):** a Monte Carlo combat simulator, mostly in Go, used mainly through a web app, volunteer-run — [gcsim repo](https://github.com/genshinsim/gcsim) (snippet). Its docs ask users to check their results and report problems — [gcsim docs](https://docs.gcsim.app/)
- **Formulation vs simulation per SimC:** formulation is deterministic and good at very small differences, but it hides simplifications (a 1600-stat proc at 25% uptime becomes a flat 400), and building one can take "hundreds to thousands of hours". Simulation is easier to write and verify and quicker to update — [FormulationVsSimulation](https://github.com/simulationcraft/simc/wiki/FormulationVsSimulation). That cost comparison is a SimC author's argument, and GW2's optimizer suggests a simple coefficient model can be cheap.
- **FFXI:** a forum post notes that rolling a random function 10,000,000 times against crit rate is functionally the same as taking an average — [FFXIAH](https://de.ffxiah.com/forum/topic/58692/muffinmetrics-a-new-era-of-ffxi-simulation-g/2) (snippet)
- **Lost Ark:** I found no reliable source on a community simulator. Results covered only unofficial meters (the official line was "no plans" for a meter, per [PCGamesN](https://www.pcgamesn.com/lost-ark-online/dps-meter)) and low-quality calculator pages.

### Inferences
When each approach is enough:

| Approach | Good when | Fails when |
|---|---|---|
| Stat-weight table | Stats scale near-linearly over the range | Diminishing returns, caps, large swaps (SimC notes weights are only locally exact) |
| Closed-form expected damage with coefficients | Rotation does not depend much on gear, and procs have stable uptime | Haste-like breakpoints, burst windows aligned with buffs, resource-driven rotations |
| Monte Carlo rotation sim | Timing interactions change the answer | Timing rules and data are unknown, since precision then has no accuracy behind it |

- A sim needs cooldowns, cast times, animation locks and buff timings. Without those measured, it adds noise and false precision on top of the same uncertain coefficients.
- A sensible order for a low-data game is a closed-form model first, then a rotation sim only for classes or stats where timing matters.

### Gaps
- I found no published accuracy measurement comparing PoB, xivgear or Ariyala to in-game results. PoB's use of deterministic averaged calculations is my background knowledge, and the README does not state it.
- gcsim's data sourcing and validation process could not be confirmed from pages I read.
- No Lost Ark example could be sourced, and Korean-language sources were not reached.

## How close do gear options get, what error can a tool tolerate, and can rankings stay right when absolute DPS is wrong?

### Takeaway
Yes, rankings can stay right with wrong absolute DPS, but only for certain kinds of error. A shared multiplier never changes the rank, and a plain upgrade survives almost any coefficient error. Comparisons that trade one stat for another depend on the ratio of stat values, and those are the ones a low-data tool will get wrong when the gap is small.

### Cited Findings
- Gems and enchants are "often in the 0.1–0.5% range", and gear and talent differences are usually larger. Lowering precision leaves many options "all falling with the margin of error", yielding no clear answer — [Raidbots, gem/enchant sims](https://support.raidbots.com/article/64-why-do-gem-enchant-sims-take-so-long)
- Options inside the margin are treated as equal, and the DPS result can swing by about twice the reported margin. A guide says you "cannot go wrong" within it and suggests other tie-breakers — [Icy Veins, Top Gear](https://www.icy-veins.com/wow/how-to-use-the-top-gear-feature-of-raidbots) (snippet)
- AskMrRobot forum moderators have called anything under 2% "small" and said sets within 2% of optimal perform equally in play. These are forum opinions, surfaced by search, and I did not confirm the specific threads — e.g. [AMR forum](https://forums.askmrrobot.com/t/best-in-bag-and-simulation/2094) (snippet, weak)
- An item shown as a 10% upgrade gave about 0.2% on the whole character, since the in-game figure rates the item in isolation — [Blizzard forum](https://eu.forums.blizzard.com/en/wow/t/raid-bots-says-10-up-sim-yields-0-1-dps/23703) (snippet)
- GW2's optimizer reports that wrong absolute DPS from stale coefficients "usually doesn't change the optimal gear" — [Discretize, How It Works](https://raw.githubusercontent.com/discretize/discretize-gear-optimizer/staging/docs/How%20It%20Works.md)
- Own test: a linear log-DPS model with 4 stats, where each stat's true effect is wrong by an independent random factor (lognormal, sigma ε), measuring how often the tool ranks two options correctly (100k trials per cell):

| Comparison | True gap | ε 5% | ε 10% | ε 20% | ε 30% |
|---|---|---|---|---|---|
| Plain upgrade (one option has only more) | any | 100% | 100% | 100% | 100% |
| Trade moving 2% DPS between two stats | 0.2% | 91.1% | 74.9% | 63.3% | 58.9% |
| | 0.5% | 99.9% | 94.3% | 78.3% | 70.1% |
| | 1% | 100% | 99.8% | 92.4% | 82.9% |
| | 2% | 100% | 100% | 99.3% | 94.8% |
| Trade moving 5% DPS between two stats | 0.2% | 71.1% | 60.8% | 55.8% | 53.7% |
| | 0.5% | 91.0% | 75.0% | 63.1% | 58.9% |
| | 1% | 99.5% | 90.3% | 74.0% | 66.7% |
| | 2% | 100% | 99.1% | 88.3% | 78.4% |

### Inferences
- Rule of thumb from the table: P(correct) ≈ Φ(g / (√2·ε·s)), where g is the true gap, ε the per-stat coefficient error, and s the DPS moved between stats. To be right about 95% of the time, g must be at least about 2.3·ε·s.
- Example: with 20% coefficient error and a trade moving 5% of DPS, a tool needs a gap of about 2.3% to be trustworthy. With 5% error it needs about 0.6%.
- Three error types behave differently:
  - **Common scale errors** (overall skill multipliers, enemy mitigation applied equally to all options) change absolute DPS only and never the rank.
  - **Per-stat errors** (crit damage value, a stat conversion rate) change the rank in trades, as the table shows.
  - **Structure errors** (additive versus multiplicative buckets, caps, whether a stat also speeds up the rotation) change the marginal values themselves, often more than coefficient noise, and independent-error models like the one above understate them. Testing should target these first.
- Measurement error and Monte Carlo noise add. Reducing sampling error far below model error wastes compute. If the model is only good to about 1%, target about 0.2–0.5%, not 0.05%.
- For a low-data game, a tool should show ties instead of a strict order: options within a tolerance derived from coefficient uncertainty get labeled "about equal". It can also run sensitivity checks by re-ranking with coefficients perturbed and reporting how often an option wins.
- WoW's distribution of gaps (0.1–0.5% for small choices) would not necessarily transfer. AION 2 needs its own measure of how much DPS typical gear swaps move.

### Gaps
- I found no published study of the distribution of gaps between gear options, or of WoW ranking stability under model error. The 0.1–0.5% figure is Raidbots' informal statement, and the 2% figure is forum opinion.
- The own test assumes linearity and independent errors. It shows the shape of the risk and is not calibrated to any game.

## What is feasible in a browser?

### Takeaway
A browser-only Monte Carlo sim is proven feasible: SimC itself has been compiled to WASM, and WoWSims ships a WASM simulator. For a simpler game model, plain JS or TS in Web Workers should be fast enough for staged Top Gear style runs, and a closed-form model can search far larger spaces.

### Cited Findings
- WoWSims is written in Go and TypeScript with Protocol Buffers between them. The UI loads a `.wasm` build of the simulator (`sim/wasm/main.go`), and `sim.go` runs the event loop in `Simulation.RunOnce`. A native binary can also run sims — [WoWSims WotLK](https://github.com/wowsims/wotlk), [README](https://raw.githubusercontent.com/wowsims/wotlk/master/README.md)
- A third-party site "runs the full SimulationCraft engine in your browser via WebAssembly", locally, with a default of 0.2% target error and a "Raidbots like" Smart Sim added in April 2026. It notes the HTML report may crash and blocks unsupported specs — [simc.wow.fipso.dev](https://simc.wow.fipso.dev/). Its claim of matching Raidbots is unverified.
- gcsim's primary use is through a web app — [gcsim repo](https://github.com/genshinsim/gcsim) (snippet). Whether its web app computes locally was not confirmed.
- XivGear (web app, likely TypeScript per repo config) does brute-force materia solving and DPS sims — [gear-planner](https://github.com/xiashtra/gear-planner)
- WASM versus native: one physics simulator's authors measured a 2–3× single-thread gap on desktop — [TU Wien](https://www.iue.tuwien.ac.at/jb2019/screen/content/ManstettenPaul.html) (snippet)
- Hazards: a WebKit bug report shows one Worker plus WASM workload roughly 10× slower in Safari than Chrome — [WebKit Bugzilla](https://bugs.webkit.org/show_bug.cgi?id=237789) (snippet). Browser power saving throttles the CPU heavily — [Babylon.js forum](https://forum.babylonjs.com/t/improved-rvo2-wasm-port-performance-3200-agents-demo/62025) (snippet)
- A WASM poker simulator's author estimated about 20M hands per second with workers, a self-reported 2017 figure on a much smaller problem — [holdem](https://www.github.com/ChrisZieba/holdem) (snippet)
- Own test: toy event sim in single-threaded JS on V8 (Node 24), which shares its JS engine with Chrome: 90,000 fights/s at 180 s and 12 skills, 26,000 fights/s at 600 s and 30 skills, about 26M events/s in both.

### Inferences
- The toy is optimistic. A real class model with buffs, conditions and proc tracking might be 10–100× slower per event (my estimate, not measured), so about 1,000–9,000 fights/s per thread. WASM may raise that somewhat, but the toy result suggests JS alone is adequate and a Go or Rust toolchain is not needed at first.
- Worked budget at an assumed 4,500 fights/s per worker with 4 workers (18,000 fights/s), for 1,000 gear candidates:

| Stage | Candidates | Iterations each | Total | Time |
|---|---|---|---|---|
| Rough (about 1%) | 1,000 | 200 | 200,000 | about 11 s |
| Medium (about 0.2%) | 50 | 3,000 | 150,000 | about 8 s |
| Fine (about 0.05%) | 5 | 30,000 | 150,000 | about 8 s |

  That totals about 30 s, acceptable with a progress bar. Without culling, the same 1,000 candidates at 30,000 iterations would take about 28 minutes.
- Closed-form evaluation is far cheaper: at a likely tens of millions of evaluations per second across workers (extrapolated, unmeasured), it could handle spaces like GW2's 90M combinations in seconds to minutes with pruning. It also has zero noise, so it can pre-rank candidates before a sim stage.
- This project's stack already fits: the planner runs optimizers in Web Workers, so a sim would reuse that pattern. Browser-only means no server cost and no queue, unlike Raidbots.
- Risks: slow phones, thermal throttling, hidden-tab throttling, and Safari. Sims should be cancellable and chunked, and the tool should default to a precision that fits the device.

### Gaps
- I found no published iterations-per-second figure for WoWSims, gcsim or SimC WASM. Searches returned nothing, and the site gives no speed comparison.
- WoWSims' Web Worker use is not stated on the pages read.
- No measurement of the real speed of a complete class model in JS. The way to settle it is to prototype one class and benchmark it in Chrome, Safari and on a phone.
