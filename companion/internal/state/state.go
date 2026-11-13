// Package state follows each character's data through the game's messages
// and turns it into the snapshots the site reads.
package state

import (
	"fmt"
	"reflect"
	"sort"
	"strconv"
	"time"

	"daevanion-companion/internal/game"
	"daevanion-companion/internal/wire"
)

// Character is what the companion knows about one character.
type Character struct {
	game.Character

	Pets     map[int]game.Pet
	PetsAt   time.Time
	Stacks   map[uint32]game.Stack
	ItemsAt  time.Time
	Counters map[uint32]game.Counter
	// When the counters were last read in full or changed.
	CountersAt time.Time
	Supply     map[uint32]*game.SupplyGroup
	SupplyAt   time.Time
	// Weekly crafting limits by recipe id, each with when it was read.
	Crafts   map[uint32]Craft
	CraftsAt time.Time
	// Crafting proficiency level by profession number (game.Profession).
	Professions   map[int]int
	ProfessionsAt time.Time
	// Acquired Daevanion nodes by board number (game.ParseBoards).
	Boards   map[int][]int
	BoardsAt time.Time
	// The daily duty board, once seen.
	Duty   *game.Duty
	DutyAt time.Time
	// Progress counters changed lately, by id (see progressWindow).
	Progress   map[uint32]game.Progress
	ProgressAt time.Time
	// Lifetime arena record by mode.
	Arena   map[int]game.ArenaMode
	ArenaAt time.Time
	// Who holds the Abyss artifacts, as last sent.
	Artifacts   *game.Artifacts
	ArtifactsAt time.Time
	// The map the character is on (game.ParseZone), and the corridor
	// entrances it used by entering (the game clears them 130 s later).
	Zone    int
	Entered map[uint32]bool
	// Corridor entrances open, by counter id, once known (CorridorsAt): the
	// game opens them on entering the Abyss. Login's counter list has them
	// all closed, used or not, so a list with none open says nothing.
	Corridors   map[uint32]bool
	CorridorsAt time.Time
}

// Progress counters that changed this long before they were read are left
// out: daily and weekly tasks need only the last week, and the full list is
// thousands long.
const progressWindow = 8 * 24 * time.Hour

// Craft is a limited recipe's counts this week (see game.CraftCount).
type Craft struct {
	Server    uint32
	Character uint32
	At        time.Time
}

// Key names the character the way the site stores it.
func (c *Character) Key() string {
	return fmt.Sprintf("%d:%s", c.Server, c.Name)
}

// connection is one game server connection. Its character is unknown from
// a login or switch until the character message names it; data in between
// waits for it.
type connection struct {
	character *Character
	pending   []func(*Character, time.Time)
}

// Tracker routes messages to characters.
type Tracker struct {
	characters  map[string]*Character
	connections map[string]*connection
	changed     map[string]bool
	// The character named last: the one being played.
	current *Character
	// Souls gained (pet id → souls) while no character had the collection
	// (a companion started mid-session): added to the account's copy until
	// the game sends the collection again.
	lateGains map[int]int
	// Called for things worth a status line.
	Log func(format string, args ...any)
}

// NewTracker starts empty.
func NewTracker() *Tracker {
	return &Tracker{
		characters:  make(map[string]*Character),
		connections: make(map[string]*connection),
		changed:     make(map[string]bool),
		Log:         func(string, ...any) {},
	}
}

// Closed forgets a connection.
func (t *Tracker) Closed(conn string) {
	delete(t.connections, conn)
}

// Handle takes one message from the server side of a connection.
func (t *Tracker) Handle(conn string, m wire.Message, now time.Time) {
	c := t.connections[conn]
	if c == nil {
		c = &connection{}
		t.connections[conn] = c
	}

	switch m.Type() {
	case game.TypeLogin, game.TypeSwitch:
		c.character = nil
		c.pending = nil
	case game.TypeCharacter:
		info, ok := game.ParseCharacter(m.Body)
		if !ok {
			t.Log("Couldn't read the character message (%d bytes)", len(m.Body))
			return
		}
		character := t.character(info)
		if c.character != character {
			t.Log("Playing %s (server %d)", info.Name, info.Server)
		}
		if professions, ok := game.ParseProfessions(m.Body); ok {
			levels := make(map[int]int, len(professions))
			for _, p := range professions {
				levels[p.ID] = p.Level
			}
			character.Professions = levels
			character.ProfessionsAt = now
		}
		c.character = character
		t.current = character
		for _, apply := range c.pending {
			apply(character, now)
		}
		c.pending = nil
		t.changed[character.Key()] = true
	default:
		apply := t.reader(m)
		if apply == nil {
			return
		}
		if c.character == nil {
			c.pending = append(c.pending, apply)
			return
		}
		apply(c.character, now)
		t.changed[c.character.Key()] = true
	}
}

func (t *Tracker) character(info game.Character) *Character {
	key := fmt.Sprintf("%d:%s", info.Server, info.Name)
	character := t.characters[key]
	if character == nil {
		character = &Character{Character: info}
		t.characters[key] = character
	}
	// The class can only be learnt, never lost.
	if info.Class != 0 {
		character.Class = info.Class
	}
	return character
}

// reader returns how a message changes a character, or nil to ignore it.
func (t *Tracker) reader(m wire.Message) func(*Character, time.Time) {
	switch m.Type() {
	case game.TypePets:
		pets, ok := game.ParsePets(m.Body)
		if !ok {
			t.Log("Couldn't read the pet collection")
			return nil
		}
		return func(c *Character, now time.Time) {
			c.Pets = pets
			c.PetsAt = now
			t.lateGains = nil
		}
	case game.TypePetSouls:
		gains, ok := game.ParsePetSouls(m.Body)
		if !ok {
			return nil
		}
		return func(c *Character, now time.Time) {
			// Without the collection there is nothing to add to; the next
			// zone change sends it. Kept meanwhile for LateGains.
			if c.Pets == nil {
				if t.lateGains == nil {
					t.lateGains = map[int]int{}
				}
				for _, gain := range gains {
					t.lateGains[gain.Pet] += gain.Amount
				}
				return
			}
			pets := copyMap(c.Pets)
			for _, gain := range gains {
				pets[gain.Pet] = pets[gain.Pet].AddSouls(gain.Amount)
			}
			c.Pets = pets
			c.PetsAt = now
		}
	case game.TypeInventory:
		stacks := game.ParseStacks(m.Body)
		return func(c *Character, now time.Time) {
			c.Stacks = make(map[uint32]game.Stack)
			for _, s := range stacks {
				if s.Count > 0 {
					c.Stacks[s.ID] = s
				}
			}
			c.ItemsAt = now
		}
	case game.TypeInventoryChange:
		stacks := game.ParseStacks(m.Body)
		if len(stacks) == 0 {
			return nil
		}
		return func(c *Character, now time.Time) {
			if c.Stacks == nil {
				return
			}
			next := copyMap(c.Stacks)
			for _, s := range stacks {
				if s.Count == 0 {
					delete(next, s.ID)
				} else {
					next[s.ID] = s
				}
			}
			c.Stacks = next
			c.ItemsAt = now
		}
	case game.TypeZone:
		zone, ok := game.ParseZone(m.Body)
		if !ok {
			return nil
		}
		return func(c *Character, now time.Time) {
			c.Zone = zone
		}
	case game.TypeArtifacts, game.TypeArtifactsWorld:
		artifacts, ok := game.ParseArtifacts(m.Body)
		if !ok {
			t.Log("Couldn't read the artifact owners (%d bytes)", len(m.Body))
			return nil
		}
		return func(c *Character, now time.Time) {
			// 07e3 comes every ~10 s: only a change is news.
			if c.Artifacts != nil && reflect.DeepEqual(*c.Artifacts, artifacts) {
				return
			}
			c.Artifacts = &artifacts
			c.ArtifactsAt = now
		}
	case game.TypeCounters:
		counters, ok := game.ParseCounters(m.Body)
		if !ok {
			t.Log("Couldn't read the entry counters")
			return nil
		}
		return func(c *Character, now time.Time) {
			c.Counters = counters
			c.CountersAt = now
			open := make(map[uint32]bool)
			for id, counter := range counters {
				if game.IsCorridorCounter(id) && counter.Open {
					open[id] = true
				}
			}
			if len(open) > 0 {
				c.Corridors = open
				c.CorridorsAt = now
			}
		}
	case game.TypeCounterChange:
		counter, ok := game.ParseCounterChange(m.Body)
		if !ok {
			return nil
		}
		return func(c *Character, now time.Time) {
			// Entering a corridor sends its entrance again: the ticket is
			// gone from then on (user-told), though the game clears it only
			// 130 s later.
			if game.IsCorridorCounter(counter.ID) {
				switch {
				case counter.Open && game.IsCorridorMap(c.Zone):
					c.Entered = copyMap(c.Entered)
					c.Entered[counter.ID] = true
				case !counter.Open && c.Entered[counter.ID]:
					c.Entered = copyMap(c.Entered)
					delete(c.Entered, counter.ID)
				}
				c.Corridors = copyMap(c.Corridors)
				if counter.Open {
					c.Corridors[counter.ID] = true
				} else {
					delete(c.Corridors, counter.ID)
				}
				c.CorridorsAt = now
			}
			if c.Counters == nil {
				return
			}
			next := copyMap(c.Counters)
			next[counter.ID] = counter
			c.Counters = next
			c.CountersAt = now
		}
	case game.TypeSupply:
		groups, ok := game.ParseSupply(m.Body)
		if !ok {
			t.Log("Couldn't read the supply requests")
			return nil
		}
		return func(c *Character, now time.Time) {
			c.Supply = make(map[uint32]*game.SupplyGroup)
			for i := range groups {
				group := groups[i]
				c.Supply[group.ID] = &group
			}
			c.SupplyAt = now
		}
	case game.TypeSupplyDelivery:
		delivery, ok := game.ParseDelivery(m.Body)
		if !ok {
			return nil
		}
		return func(c *Character, now time.Time) {
			group := c.Supply[delivery.Group]
			if group == nil {
				return
			}
			next := *group
			next.Cards = append([]game.SupplyCard(nil), group.Cards...)
			for i := range next.Cards {
				if next.Cards[i].ID == delivery.Card && next.Cards[i].Progress == 0 {
					next.Cards[i].Progress = 1
				}
			}
			c.Supply[delivery.Group] = &next
			c.SupplyAt = now
		}
	case game.TypeCraftLimits:
		counts, ok := game.ParseCraftLimits(m.Body)
		if !ok {
			t.Log("Couldn't read the crafting limits")
			return nil
		}
		if len(counts) == 0 {
			return nil
		}
		return func(c *Character, now time.Time) {
			c.addCrafts(counts, now)
		}
	case game.TypeCraftDone:
		count, ok := game.ParseCraftDone(m.Body)
		if !ok {
			return nil
		}
		return func(c *Character, now time.Time) {
			c.addCrafts([]game.CraftCount{count}, now)
		}
	case game.TypeBoards:
		boards, ok := game.ParseBoards(m.Body)
		if !ok {
			t.Log("Couldn't read the Daevanion boards")
			return nil
		}
		return func(c *Character, now time.Time) {
			c.Boards = boards
			c.BoardsAt = now
		}
	case game.TypeProgress:
		list, ok := game.ParseProgress(m.Body)
		if !ok {
			t.Log("Couldn't read the progress counters")
			return nil
		}
		return func(c *Character, now time.Time) {
			since := now.Add(-progressWindow).UnixMilli()
			recent := make(map[uint32]game.Progress)
			for id, progress := range list {
				if progress.At >= since {
					recent[id] = progress
				}
			}
			c.Progress = recent
			c.ProgressAt = now
		}
	case game.TypeArena:
		modes, ok := game.ParseArena(m.Body)
		if !ok {
			t.Log("Couldn't read the arena stats")
			return nil
		}
		return func(c *Character, now time.Time) {
			c.Arena = modes
			c.ArenaAt = now
		}
	case game.TypeDuty:
		duty, ok := game.ParseDuty(m.Body)
		if !ok {
			t.Log("Couldn't read the duty board")
			return nil
		}
		return func(c *Character, now time.Time) {
			c.Duty = &duty
			c.DutyAt = now
		}
	case game.TypeBoardNodeRemoved, game.TypeBoardNodeAdded:
		board, cell, ok := game.ParseBoardNode(m.Body)
		if !ok {
			t.Log("Couldn't read a Daevanion node change")
			return nil
		}
		added := m.Type() == game.TypeBoardNodeAdded
		return func(c *Character, now time.Time) {
			// Without the full list (a companion started mid-session) one
			// node would stand for the whole board: wait for the next login.
			if c.Boards == nil {
				return
			}
			next := make(map[int][]int, len(c.Boards))
			for number, cells := range c.Boards {
				next[number] = cells
			}
			cells := make([]int, 0, len(c.Boards[board])+1)
			for _, taken := range c.Boards[board] {
				if taken != cell {
					cells = append(cells, taken)
				}
			}
			if added {
				cells = append(cells, cell)
			}
			next[board] = cells
			c.Boards = next
			c.BoardsAt = now
		}
	case game.TypeProfessionLevel:
		level, ok := game.ParseProfessionLevel(m.Body)
		if !ok {
			t.Log("Couldn't read a proficiency level up")
			return nil
		}
		return func(c *Character, now time.Time) {
			next := copyMap(c.Professions)
			next[level.ID] = level.Level
			c.Professions = next
			c.ProfessionsAt = now
		}
	}

	return nil
}

// addCrafts updates the recipes named; the others keep their counts.
func (c *Character) addCrafts(counts []game.CraftCount, now time.Time) {
	next := copyMap(c.Crafts)
	for _, count := range counts {
		next[count.Recipe] = Craft{Server: count.Server, Character: count.Character, At: now}
	}
	c.Crafts = next
	c.CraftsAt = now
}

func copyMap[K comparable, V any](m map[K]V) map[K]V {
	out := make(map[K]V, len(m))
	for k, v := range m {
		out[k] = v
	}
	return out
}

// Current is the character being played, or nil before one is named.
func (t *Tracker) Current() *game.Character {
	if t.current == nil {
		return nil
	}
	info := t.current.Character
	return &info
}

// Pets is the newest pet collection read this run (pets are account-wide,
// so any character's), or nil before the game has sent one. Read only.
func (t *Tracker) Pets() map[int]game.Pet {
	var newest *Character
	for _, c := range t.characters {
		if c.Pets != nil && (newest == nil || c.PetsAt.After(newest.PetsAt)) {
			newest = c
		}
	}
	if newest == nil {
		return nil
	}
	return newest.Pets
}

// LateGains is the souls gained since the companion started, by pet, while
// it had no collection to add them to (Pets is nil then). Read only.
func (t *Tracker) LateGains() map[int]int {
	return t.lateGains
}

// TakeChanged returns snapshots of the characters changed since the last call.
func (t *Tracker) TakeChanged() []Snapshot {
	var out []Snapshot
	keys := make([]string, 0, len(t.changed))
	for key := range t.changed {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	for _, key := range keys {
		out = append(out, t.characters[key].Snapshot())
	}
	t.changed = make(map[string]bool)
	return out
}

// All returns snapshots of every character seen.
func (t *Tracker) All() []Snapshot {
	keys := make([]string, 0, len(t.characters))
	for key := range t.characters {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	var out []Snapshot
	for _, key := range keys {
		out = append(out, t.characters[key].Snapshot())
	}
	return out
}

// Snapshot is what the site reads for one character. Sections are missing
// until the game has sent them.
type Snapshot struct {
	Version   int               `json:"v"`
	Character SnapshotCharacter `json:"character"`
	// Pet id → [Insight level, souls towards the next level].
	Pets   map[string][2]int `json:"pets,omitempty"`
	PetsAt int64             `json:"petsAt,omitempty"`
	// Storage code → item id → count across stacks. 1 is the character's
	// bag, 2 Server Storage (the same on every character), 15 Character
	// Storage. Items bound to the character are in Bound instead.
	Items map[string]map[string]uint64 `json:"items,omitempty"`
	// The same for soulbound items, which can't go to Server Storage.
	Bound   map[string]map[string]uint64 `json:"bound,omitempty"`
	ItemsAt int64                        `json:"itemsAt,omitempty"`
	// Counter id → [recharged, bonus].
	Counters   map[string][2]uint64 `json:"counters,omitempty"`
	CountersAt int64                `json:"countersAt,omitempty"`
	Supply     []SnapshotSupply     `json:"supply,omitempty"`
	SupplyAt   int64                `json:"supplyAt,omitempty"`
	// Recipe id → [server-wide count, character count, read at (ms)] for
	// recipes with a weekly limit, counted this week as of that time.
	Crafts   map[string][3]int64 `json:"crafts,omitempty"`
	CraftsAt int64               `json:"craftsAt,omitempty"`
	// Profession number (1 Blacksmithing … 5 Cooking) → proficiency level,
	// counted across ranks (Professional 1 is 51).
	Professions   map[string]int `json:"professions,omitempty"`
	ProfessionsAt int64          `json:"professionsAt,omitempty"`
	// Board number (1 Nezekan … 5 Ariel, 6 Azphel) → acquired cells, numbered
	// 1-225 row by row in a 15 x 15 grid the board sits centered in.
	Boards   map[string][]int `json:"boards,omitempty"`
	BoardsAt int64            `json:"boardsAt,omitempty"`
	// The daily duty board: [quests turned in, expires at (ms)].
	Duty   *[2]int64 `json:"duty,omitempty"`
	DutyAt int64     `json:"dutyAt,omitempty"`
	// Progress counters changed in the 8 days before progressAt: id →
	// [count, last change (ms)]. One missing there wasn't counted lately.
	Progress   map[string][2]int64 `json:"progress,omitempty"`
	ProgressAt int64               `json:"progressAt,omitempty"`
	// Arena mode (1 1v1, 2 5v5) → lifetime [wins, losses].
	Arena   map[string][2]uint64 `json:"arena,omitempty"`
	ArenaAt int64                `json:"arenaAt,omitempty"`
	// Abyss corridor entrances the character may still use (counter ids),
	// as known at corridorsAt (missing until the character entered the
	// Abyss this run): none left is an empty list.
	Corridors   []string `json:"corridors,omitempty"`
	CorridorsAt int64    `json:"corridorsAt,omitempty"`
	// Artifact id → faction holding it (0 none, 1 Elyos, 2 Asmodians), and
	// when the last Artifact Siege ended (ms).
	Artifacts   map[string]int `json:"artifacts,omitempty"`
	SiegeEnd    int64          `json:"siegeEnd,omitempty"`
	ArtifactsAt int64          `json:"artifactsAt,omitempty"`
}

// SnapshotCharacter names the character.
type SnapshotCharacter struct {
	Name   string `json:"name"`
	Server int    `json:"server"`
	Class  int    `json:"class"`
}

// SnapshotSupply is one supply request tab.
type SnapshotSupply struct {
	Kind  int   `json:"kind"`
	Start int64 `json:"start"`
	End   int64 `json:"end"`
	Cards int   `json:"cards"`
	// Cards with something delivered.
	Delivered int `json:"delivered"`
}

// SnapshotVersion changes when the snapshot's shape does.
const SnapshotVersion = 1

// Keep fills the sections this snapshot lacks from an earlier one of the same
// character (the account's copy from before the companion started): a
// companion started after login never gets the inventory or counters, and
// must not wipe them. Crafting counts merge by recipe, proficiency by
// profession.
func (s Snapshot) Keep(previous Snapshot) Snapshot {
	if previous.Version != s.Version {
		return s
	}
	if s.Pets == nil {
		s.Pets, s.PetsAt = previous.Pets, previous.PetsAt
	}
	if s.Items == nil {
		s.Items, s.Bound, s.ItemsAt = previous.Items, previous.Bound, previous.ItemsAt
	}
	if s.Counters == nil {
		s.Counters, s.CountersAt = previous.Counters, previous.CountersAt
	}
	if s.CorridorsAt == 0 {
		s.Corridors, s.CorridorsAt = previous.Corridors, previous.CorridorsAt
	}
	if s.Artifacts == nil {
		s.Artifacts, s.SiegeEnd, s.ArtifactsAt = previous.Artifacts, previous.SiegeEnd, previous.ArtifactsAt
	}
	if s.Supply == nil {
		s.Supply, s.SupplyAt = previous.Supply, previous.SupplyAt
	}
	if s.Boards == nil {
		s.Boards, s.BoardsAt = previous.Boards, previous.BoardsAt
	}
	if s.Duty == nil {
		s.Duty, s.DutyAt = previous.Duty, previous.DutyAt
	}
	if s.Progress == nil {
		s.Progress, s.ProgressAt = previous.Progress, previous.ProgressAt
	}
	if s.Arena == nil {
		s.Arena, s.ArenaAt = previous.Arena, previous.ArenaAt
	}
	// A level up seen mid-session names one profession: merge by number.
	if previous.Professions != nil {
		professions := copyMap(previous.Professions)
		for id, level := range s.Professions {
			professions[id] = level
		}
		s.Professions = professions
		s.ProfessionsAt = max(s.ProfessionsAt, previous.ProfessionsAt)
	}
	if previous.Crafts != nil {
		crafts := copyMap(previous.Crafts)
		for id, craft := range s.Crafts {
			crafts[id] = craft
		}
		s.Crafts = crafts
		s.CraftsAt = max(s.CraftsAt, previous.CraftsAt)
	}
	return s
}

func millis(t time.Time) int64 {
	if t.IsZero() {
		return 0
	}
	return t.UnixMilli()
}

// Snapshot captures the character as the site needs it.
func (c *Character) Snapshot() Snapshot {
	s := Snapshot{
		Version:   SnapshotVersion,
		Character: SnapshotCharacter{Name: c.Name, Server: c.Server, Class: c.Class},
	}

	if c.Pets != nil {
		s.Pets = make(map[string][2]int, len(c.Pets))
		for id, pet := range c.Pets {
			s.Pets[strconv.Itoa(id)] = [2]int{pet.Level, pet.Souls}
		}
		s.PetsAt = millis(c.PetsAt)
	}

	if c.Stacks != nil {
		s.Items = make(map[string]map[string]uint64)
		s.Bound = make(map[string]map[string]uint64)
		for _, stack := range c.Stacks {
			target := s.Items
			if stack.Bound {
				target = s.Bound
			}
			storage := strconv.Itoa(stack.Storage)
			if target[storage] == nil {
				target[storage] = make(map[string]uint64)
			}
			target[storage][strconv.Itoa(stack.Item)] += stack.Count
		}
		s.ItemsAt = millis(c.ItemsAt)
	}

	if c.Counters != nil {
		s.Counters = make(map[string][2]uint64, len(c.Counters))
		for id, counter := range c.Counters {
			if counter.Value != 0 || counter.Bonus != 0 {
				s.Counters[strconv.FormatUint(uint64(id), 10)] = [2]uint64{counter.Value, counter.Bonus}
			}
		}
		s.CountersAt = millis(c.CountersAt)
	}

	if !c.CorridorsAt.IsZero() {
		for id := range c.Corridors {
			if !c.Entered[id] {
				s.Corridors = append(s.Corridors, strconv.FormatUint(uint64(id), 10))
			}
		}
		sort.Strings(s.Corridors)
		s.CorridorsAt = millis(c.CorridorsAt)
	}

	if c.Artifacts != nil {
		s.Artifacts = make(map[string]int, len(c.Artifacts.Owners))
		for id, faction := range c.Artifacts.Owners {
			s.Artifacts[strconv.Itoa(id)] = faction
		}
		s.SiegeEnd = c.Artifacts.SiegeEnd
		s.ArtifactsAt = millis(c.ArtifactsAt)
	}

	if c.Supply != nil {
		ids := make([]uint32, 0, len(c.Supply))
		for id := range c.Supply {
			ids = append(ids, id)
		}
		sort.Slice(ids, func(a, b int) bool { return ids[a] < ids[b] })
		s.Supply = []SnapshotSupply{}
		for _, id := range ids {
			group := c.Supply[id]
			delivered := 0
			for _, card := range group.Cards {
				if card.Progress > 0 {
					delivered++
				}
			}
			s.Supply = append(s.Supply, SnapshotSupply{
				Kind:      group.Kind,
				Start:     group.Start,
				End:       group.End,
				Cards:     len(group.Cards),
				Delivered: delivered,
			})
		}
		s.SupplyAt = millis(c.SupplyAt)
	}

	if c.Crafts != nil {
		s.Crafts = make(map[string][3]int64, len(c.Crafts))
		for id, craft := range c.Crafts {
			s.Crafts[strconv.FormatUint(uint64(id), 10)] = [3]int64{int64(craft.Server), int64(craft.Character), millis(craft.At)}
		}
		s.CraftsAt = millis(c.CraftsAt)
	}

	if c.Professions != nil {
		s.Professions = make(map[string]int, len(c.Professions))
		for id, level := range c.Professions {
			s.Professions[strconv.Itoa(id)] = level
		}
		s.ProfessionsAt = millis(c.ProfessionsAt)
	}

	if c.Boards != nil {
		s.Boards = make(map[string][]int, len(c.Boards))
		for board, cells := range c.Boards {
			s.Boards[strconv.Itoa(board)] = cells
		}
		s.BoardsAt = millis(c.BoardsAt)
	}

	if c.Duty != nil {
		s.Duty = &[2]int64{int64(c.Duty.Done), c.Duty.Ends}
		s.DutyAt = millis(c.DutyAt)
	}

	if c.Progress != nil {
		s.Progress = make(map[string][2]int64, len(c.Progress))
		for id, progress := range c.Progress {
			s.Progress[strconv.FormatUint(uint64(id), 10)] = [2]int64{int64(progress.Count), progress.At}
		}
		s.ProgressAt = millis(c.ProgressAt)
	}

	if c.Arena != nil {
		s.Arena = make(map[string][2]uint64, len(c.Arena))
		for mode, record := range c.Arena {
			s.Arena[strconv.Itoa(mode)] = [2]uint64{record.Wins, record.Losses}
		}
		s.ArenaAt = millis(c.ArenaAt)
	}

	return s
}
