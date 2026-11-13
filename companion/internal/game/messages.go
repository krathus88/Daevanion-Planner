// Package game reads the AION 2 server messages the site cares about.
//
// Message types are the two type bytes in wire order. They come from our own
// captures of client revision 3535 (November 2026): patches can renumber them,
// so they all live here.
package game

import (
	"encoding/binary"
	"unicode"
	"unicode/utf8"
)

// Message types.
const (
	// The local player, at login, character switch and every zone change.
	TypeCharacter = "3336"
	// A session for a character starts: login, then character switch.
	TypeLogin  = "1536"
	TypeSwitch = "2636"
	// Pet collection: every pet's Insight level and soul counter.
	TypePets = "0090"
	// Souls gained for one pet.
	TypePetSouls = "0d90"
	// The whole inventory, then changes to it.
	TypeInventory       = "1156"
	TypeInventoryChange = "1b56"
	// Entry and Odyle Energy counters, then changes to one.
	TypeCounters      = "0b61"
	TypeCounterChange = "0c61"
	// Zone change: u32 sequence, u32 map (ParseZone).
	TypeZone = "2136"
	// Artifact owners (ParseArtifacts): at each Abyss load, and every ~10 s
	// on the world server with Outer Reshanta's group too.
	TypeArtifacts      = "05e3"
	TypeArtifactsWorld = "07e3"
	// Supply requests, then one card delivered.
	TypeSupply         = "56e2"
	TypeSupplyDelivery = "3ee2"
	// Weekly crafting limits: lists of counts, then one craft finished.
	TypeCraftLimits = "8f8d"
	TypeCraftDone   = "8b8d"
	// Crafting proficiency: xp gained in a profession (u8 profession, u64 xp
	// now, u64 gained; not read, the site needs only levels), then a level
	// gained. The levels themselves come in the character message
	// (ParseProfessions).
	TypeProfessionXP    = "7c8d"
	TypeProfessionLevel = "7d8d"
	// Daevanion boards: every board's acquired nodes (ParseBoards), at login
	// and character switch.
	TypeBoards = "26e2"
	// One Daevanion node taken back, then one taken (ParseBoardNode).
	TypeBoardNodeRemoved = "2be2"
	TypeBoardNodeAdded   = "28e2"
	// The daily duty board (ParseDuty): at login and after each duty quest
	// turned in.
	TypeDuty = "1c8d"
	// Progress counters (ParseProgress), at login: Arena rewards and more.
	// Entering or leaving an arena reloads the character, so it comes after
	// every match too.
	TypeProgress = "8356"
	// Arena stats per mode (ParseArena): lifetime wins and losses, at login
	// and after every match (which reloads the character).
	TypeArena = "2ae3"
	// Rotating shops (the Black Cloud Merchant: pets, skins, Theostones): a
	// tab's items when it's opened (ParseShopTab), then one bought
	// (ParseShopBuy). Opening the shop itself or closing it sends nothing: the
	// window is the client's own.
	TypeShopTab = "9156"
	TypeShopBuy = "9556"
)

// Profession numbers: 1 Blacksmithing, 2 Armorsmithing, 3 Handicrafting,
// 4 Alchemy, 5 Cooking (checked against the game's window, 2026-11-12).
const professionCount = 5

// Profession is one crafting profession's proficiency. Level counts on
// across ranks: Novice 1-50, then Professional 1 is 51.
type Profession struct {
	ID    int
	Level int
	XP    uint64
}

// Character is the local player.
type Character struct {
	Name string
	// The game's server number: 1301-1323 Elyos, 2301-2323 Asmodian.
	Server int
	// The game's class number.
	Class int
}

func isServer(n int) bool {
	return (n >= 1301 && n <= 1399) || (n >= 2301 && n <= 2399)
}

func isName(b []byte) bool {
	if !utf8.Valid(b) {
		return false
	}
	for _, r := range string(b) {
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

// ParseCharacter reads 3336: a few ids, then the name (u8 length + UTF-8),
// u16 server, u32 class.
func ParseCharacter(body []byte) (Character, bool) {
	for at := 0; at < 48 && at < len(body); at++ {
		length := int(body[at])
		if length < 2 || length > 32 {
			continue
		}
		nameEnd := at + 1 + length
		if nameEnd+6 > len(body) {
			continue
		}
		name := body[at+1 : nameEnd]
		server := int(binary.LittleEndian.Uint16(body[nameEnd:]))
		if !isName(name) || !isServer(server) {
			continue
		}
		return Character{
			Name:   string(name),
			Server: server,
			Class:  int(binary.LittleEndian.Uint32(body[nameEnd+2:])),
		}, true
	}

	return Character{}, false
}

// Pet is one pet's state as the game shows it.
type Pet struct {
	// Insight level: 0 locked, 1-3.
	Level int
	// Souls towards the next level (the game's "49/75").
	Souls int
}

// ParsePets reads 0090: u32, then varint n and n x (u32 pet id, u32 pet id,
// u32 level), then varint m and m x (u32 pet id, u32 souls).
func ParsePets(body []byte) (map[int]Pet, bool) {
	r := newReader(body)
	r.skip(4)

	pets := make(map[int]Pet)
	levels := r.varint()
	for k := uint64(0); k < levels && r.ok; k++ {
		id := int(r.u32())
		r.skip(4)
		level := int(r.u32())
		if level > 3 {
			return nil, false
		}
		pet := pets[id]
		pet.Level = level
		pets[id] = pet
	}

	souls := r.varint()
	for k := uint64(0); k < souls && r.ok; k++ {
		id := int(r.u32())
		pet := pets[id]
		pet.Souls = int(r.u32())
		pets[id] = pet
	}

	return pets, r.ok && len(pets) > 0
}

// SoulGain is souls added to one pet.
type SoulGain struct {
	Pet    int
	Amount int
}

// ParsePetSouls reads 0d90: u8 n, n x (u32 pet id, u32 souls gained).
func ParsePetSouls(body []byte) ([]SoulGain, bool) {
	r := newReader(body)
	count := int(r.u8())
	var gains []SoulGain
	for k := 0; k < count && r.ok; k++ {
		gains = append(gains, SoulGain{Pet: int(r.u32()), Amount: int(r.u32())})
	}
	return gains, r.ok
}

// SoulsToLevel is how many souls each level needs to reach the next.
var SoulsToLevel = [3]int{5, 25, 75}

// AddSouls applies a gain, levelling up as the game does.
func (p Pet) AddSouls(amount int) Pet {
	p.Souls += amount
	for p.Level < 3 && p.Souls >= SoulsToLevel[p.Level] {
		p.Souls -= SoulsToLevel[p.Level]
		p.Level++
	}
	return p
}

// Stack is one inventory slot's item.
type Stack struct {
	// The game's id for this stack; updates name it.
	ID    uint32
	Item  int
	Count uint64
	// Where it is kept; see the Storage constants.
	Storage int
	// Bound to one character (soulbound): it can't go to Server Storage.
	Bound bool
}

// Storage codes seen in real captures.
const (
	// The character's own bag.
	StorageBag = 1
	// Server Storage: shared by every character of the account.
	StorageShared = 2
	// Character Storage: a bank for this character only.
	StorageCharacter = 15
)

// ParseStacks finds the item stacks in 1156 or 1b56. Each stack is
// u8 flag (0/1), u32 stack id, u8 0, u8 slot, u16 0, u32 item id, u64 count,
// u8 storage, then extra data whose length depends on the item, so stacks
// are found by that shape rather than read one after another. Checked on
// real captures: every change matched the stack id it had at login.
func ParseStacks(body []byte) []Stack {
	var stacks []Stack
	var starts []int
	for p := 9; p+13 <= len(body); p++ {
		item := binary.LittleEndian.Uint32(body[p:])
		if item < 100_000_000 || item > 999_999_999 {
			continue
		}
		if body[p-9] > 1 || body[p-4] != 0 || body[p-2] != 0 || body[p-1] != 0 {
			continue
		}
		count := binary.LittleEndian.Uint64(body[p+4:])
		if count >= 1_000_000_000 {
			continue
		}
		stacks = append(stacks, Stack{
			ID:      binary.LittleEndian.Uint32(body[p-8:]),
			Item:    int(item),
			Count:   count,
			Storage: int(body[p+12]),
		})
		starts = append(starts, p)
		// The next stack can't start inside this one's item id and count.
		p += 11
	}

	for i, p := range starts {
		end := len(body)
		if i+1 < len(starts) {
			end = starts[i+1] - 9
		}
		stacks[i].Bound = hasOwner(body[p+13 : max(p+13, end)])
	}

	return stacks
}

// hasOwner reports whether a stack's extra data names an owner: u32
// character id, u16 0, u16 server. Soulbinding adds it (seen on a ring:
// zeros before, `05 9e 04 00 00 00 15 05` after).
func hasOwner(extra []byte) bool {
	for j := 0; j+8 <= len(extra); j++ {
		owner := binary.LittleEndian.Uint32(extra[j:])
		if owner == 0 || extra[j+4] != 0 || extra[j+5] != 0 {
			continue
		}
		if isServer(int(binary.LittleEndian.Uint16(extra[j+6:]))) {
			return true
		}
	}
	return false
}

// Counter is one entry or energy counter.
type Counter struct {
	ID uint32
	// Recharged amount and bonus (tickets, extra energy).
	Value uint64
	Bonus uint64
	// Its first field is set (flag 1). An Abyss corridor's entrance
	// (CorridorCounters) is open while it is (u64 130000 so far).
	Open bool
}

// CorridorCounters are the Abyss corridor entrances' counters, one per
// corridor (10000001 Reshanta's Root, 10000002 Sulfur Tree Island, checked
// 2026-11-13); open while the character may still enter it.
const (
	FirstCorridorCounter = 10000001
	LastCorridorCounter  = 10000012
)

// IsCorridorCounter says whether a counter is a corridor entrance.
func IsCorridorCounter(id uint32) bool {
	return id >= FirstCorridorCounter && id <= LastCorridorCounter
}

// IsCorridorMap says whether a map is an Abyss corridor's instance
// (503001 Sulfur Tree Island, 503003 Reshanta's Root).
func IsCorridorMap(id int) bool {
	return id >= 503000 && id < 504000
}

// ParseZone reads 2136, sent on each zone change: u32 sequence, u32 map
// (20 Lower Reshanta, 1010 Verteron, 503003 a corridor), then position.
func ParseZone(body []byte) (int, bool) {
	r := newReader(body)
	r.skip(4)
	id := int(r.u32())
	return id, r.ok && id > 0
}

// Artifacts is who holds the Abyss artifacts.
type Artifacts struct {
	// Artifact id (1001-1003 Lower Reshanta, 2001-2003 Outer) → faction
	// holding it: 0 none, 1 Elyos, 2 Asmodians.
	Owners map[int]int
	// When the last Artifact Siege ended (ms); 0 when not sent.
	SiegeEnd int64
}

// ParseArtifacts reads the artifact owners from 05e3 and 07e3, by shape: both
// end in u8 n, then n 17-byte entries (u32 artifact, u32 object, u8 faction,
// 8 bytes), and Lower Reshanta's group (1001) is followed by the last
// siege's end and the next siege's start (u64 ms each). 05e3 reads u8 groups,
// u32 group, u8 3, u8 1, the two times, then the entries; 07e3's header
// isn't decoded (2026-11-13, Kryx in and out of Lower Reshanta).
func ParseArtifacts(body []byte) (Artifacts, bool) {
	const entry = 17
	start := -1
	for n := 1; n <= 16; n++ {
		at := len(body) - 1 - n*entry
		if at >= 0 && int(body[at]) == n {
			start = at + 1
			break
		}
	}
	if start < 0 {
		return Artifacts{}, false
	}
	out := Artifacts{Owners: map[int]int{}}
	for at := start; at+entry <= len(body); at += entry {
		r := newReader(body[at : at+entry])
		id := int(r.u32())
		r.skip(4)
		faction := int(r.u8())
		if id < 1000 || id > 9999 || faction > 2 {
			return Artifacts{}, false
		}
		out.Owners[id] = faction
	}
	// Group 1001, then within a few bytes the siege end.
	for at := 0; at+4 <= start; at++ {
		if body[at] != 0xe9 || body[at+1] != 0x03 || body[at+2] != 0 || body[at+3] != 0 {
			continue
		}
		for skip := 4; skip <= 8 && at+skip+8 <= start; skip++ {
			r := newReader(body[at+skip : at+skip+8])
			if v := int64(r.u64()); v > 1_700_000_000_000 && v < 2_100_000_000_000 {
				out.SiegeEnd = v
				break
			}
		}
		break
	}
	return out, true
}

// ParseCounters reads 0b61: varint n, then n counters.
func ParseCounters(body []byte) (map[uint32]Counter, bool) {
	r := newReader(body)
	count := r.varint()
	counters := make(map[uint32]Counter)
	for k := uint64(0); k < count && r.ok; k++ {
		counter, ok := r.counter()
		if !ok {
			return nil, false
		}
		counters[counter.ID] = counter
	}
	return counters, r.ok
}

// ParseCounterChange reads 0c61: one byte, then one counter.
func ParseCounterChange(body []byte) (Counter, bool) {
	r := newReader(body)
	r.skip(1)
	return r.counter()
}

// SupplyGroup is one tab's set of supply request cards.
type SupplyGroup struct {
	ID uint32
	// 1 Emergency (daily), 2 Weekly, others one-off.
	Kind  int
	Start int64
	End   int64
	Cards []SupplyCard
}

// SupplyCard is one card and what was delivered to it.
type SupplyCard struct {
	ID       uint32
	Progress uint32
}

// ParseSupply reads 56e2: u8 n, n groups of u32 id, u8 kind, u64 start ms,
// u64 end ms, u8 cards, then cards of u32 group id, u32 card id, u32
// progress. A stray byte can sit between cards and groups.
func ParseSupply(body []byte) ([]SupplyGroup, bool) {
	if len(body) < 1 {
		return nil, false
	}
	count := int(body[0])
	at := 1
	var groups []SupplyGroup

	for k := 0; k < count; k++ {
		group, next, ok := readSupplyGroup(body, at)
		if !ok && k > 0 {
			// One stray byte before the group.
			group, next, ok = readSupplyGroup(body, at+1)
		}
		if !ok {
			return groups, len(groups) > 0
		}
		groups = append(groups, group)
		at = next
	}

	return groups, true
}

func readSupplyGroup(body []byte, at int) (SupplyGroup, int, bool) {
	if at+22 > len(body) {
		return SupplyGroup{}, 0, false
	}
	group := SupplyGroup{
		ID:    binary.LittleEndian.Uint32(body[at:]),
		Kind:  int(body[at+4]),
		Start: int64(binary.LittleEndian.Uint64(body[at+5:])),
		End:   int64(binary.LittleEndian.Uint64(body[at+13:])),
	}
	cards := int(body[at+21])
	// Times are ms since 1970 and a group lasts at most a year.
	if group.Kind < 1 || group.Start < 1_600_000_000_000 || group.End <= group.Start || group.End-group.Start > 400*24*3600*1000 {
		return SupplyGroup{}, 0, false
	}

	p := at + 22
	for c := 0; c < cards; c++ {
		skipped := 0
		for p+12 <= len(body) && binary.LittleEndian.Uint32(body[p:]) != group.ID && skipped < 2 {
			p++
			skipped++
		}
		if p+12 > len(body) || binary.LittleEndian.Uint32(body[p:]) != group.ID {
			return SupplyGroup{}, 0, false
		}
		group.Cards = append(group.Cards, SupplyCard{
			ID:       binary.LittleEndian.Uint32(body[p+4:]),
			Progress: binary.LittleEndian.Uint32(body[p+8:]),
		})
		p += 12
	}

	return group, p, true
}

// Delivery is one supply request card delivered to.
type Delivery struct {
	Group uint32
	Card  uint32
}

// ParseDelivery reads 3ee2: u16, u32 group id, u32 card id.
func ParseDelivery(body []byte) (Delivery, bool) {
	if len(body) < 10 {
		return Delivery{}, false
	}
	return Delivery{
		Group: binary.LittleEndian.Uint32(body[2:]),
		Card:  binary.LittleEndian.Uint32(body[6:]),
	}, true
}

// CraftCount is how often a limited recipe was crafted this week, server-wide
// (all characters on the server) and by this character. A recipe has one
// kind of limit; the other count stays 0.
type CraftCount struct {
	Recipe    uint32
	Server    uint32
	Character uint32
}

// ParseCraftLimits reads 8f8d: u32, then two lists of varint n and n pairs
// of u32 recipe id, u32 count: server-wide limits, then character limits.
// A short form with empty lists also comes; it changes nothing.
func ParseCraftLimits(body []byte) ([]CraftCount, bool) {
	r := newReader(body)
	r.skip(4)
	var counts []CraftCount
	for list := 0; list < 2; list++ {
		n := r.varint()
		if n > 10_000 {
			return nil, false
		}
		for k := uint64(0); k < n && r.ok; k++ {
			count := CraftCount{Recipe: r.u32()}
			value := r.u32()
			if list == 0 {
				count.Server = value
			} else {
				count.Character = value
			}
			counts = append(counts, count)
		}
	}
	return counts, r.ok
}

// ParseCraftDone reads 8b8d, sent when a craft finishes: u16, u8, u32 recipe
// id, u16, the recipe id again, then counts; at 33 the recipe's server-wide
// count this week, at 37 the character's (both after this craft). 878d, sent
// when it starts, has the same shape with the counts before it.
func ParseCraftDone(body []byte) (CraftCount, bool) {
	if len(body) < 41 {
		return CraftCount{}, false
	}
	recipe := binary.LittleEndian.Uint32(body[3:])
	if recipe == 0 || binary.LittleEndian.Uint32(body[9:]) != recipe {
		return CraftCount{}, false
	}
	return CraftCount{
		Recipe:    recipe,
		Server:    binary.LittleEndian.Uint32(body[33:]),
		Character: binary.LittleEndian.Uint32(body[37:]),
	}, true
}

// reader reads little-endian fields; once one is missing, ok stays false.
type reader struct {
	b  []byte
	at int
	ok bool
}

func newReader(b []byte) *reader {
	return &reader{b: b, ok: true}
}

func (r *reader) need(n int) bool {
	if !r.ok || r.at+n > len(r.b) {
		r.ok = false
		return false
	}
	return true
}

func (r *reader) skip(n int) {
	if r.need(n) {
		r.at += n
	}
}

func (r *reader) u8() uint8 {
	if !r.need(1) {
		return 0
	}
	v := r.b[r.at]
	r.at++
	return v
}

func (r *reader) u32() uint32 {
	if !r.need(4) {
		return 0
	}
	v := binary.LittleEndian.Uint32(r.b[r.at:])
	r.at += 4
	return v
}

func (r *reader) u64() uint64 {
	if !r.need(8) {
		return 0
	}
	v := binary.LittleEndian.Uint64(r.b[r.at:])
	r.at += 8
	return v
}

func (r *reader) varint() uint64 {
	var value uint64
	for k := 0; k < 10; k++ {
		c := r.u8()
		if !r.ok {
			return 0
		}
		value |= uint64(c&0x7f) << (7 * k)
		if c < 0x80 {
			return value
		}
	}
	r.ok = false
	return 0
}

// counter reads u8 flags, u32 id, then u64 if flag 1, u64 if flag 2, varint
// value if flag 4, varint bonus if flag 8. A missing value is 0.
func (r *reader) counter() (Counter, bool) {
	flags := r.u8()
	if flags&0xf0 != 0 {
		r.ok = false
		return Counter{}, false
	}
	counter := Counter{ID: r.u32(), Open: flags&1 != 0}
	if flags&1 != 0 {
		r.u64()
	}
	if flags&2 != 0 {
		r.u64()
	}
	if flags&4 != 0 {
		counter.Value = r.varint()
	}
	if flags&8 != 0 {
		counter.Bonus = r.varint()
	}
	return counter, r.ok
}

// ParseProfessions finds the proficiency list in the character message
// (3336), sent at login and every zone change: u8 count (5), then per
// profession u8 number (1-5, in order), u16 level, u64 xp towards the next
// level and two bytes (0 so far). Found by that shape: what comes before it
// isn't decoded.
func ParseProfessions(body []byte) ([]Profession, bool) {
	const entry = 13
	for at := 0; at+1+professionCount*entry <= len(body); at++ {
		if body[at] != professionCount {
			continue
		}
		list := make([]Profession, 0, professionCount)
		for i := 0; i < professionCount; i++ {
			p := at + 1 + i*entry
			level := int(binary.LittleEndian.Uint16(body[p+1:]))
			if int(body[p]) != i+1 || level < 1 || level > 200 {
				break
			}
			list = append(list, Profession{
				ID:    i + 1,
				Level: level,
				XP:    binary.LittleEndian.Uint64(body[p+3:]),
			})
		}
		if len(list) == professionCount {
			return list, true
		}
	}
	return nil, false
}

// ParseProfessionLevel reads 7d8d, sent on a level up: u8 profession, u16
// the new level, u64 xp towards the next one, then u16.
func ParseProfessionLevel(body []byte) (Profession, bool) {
	if len(body) < 11 {
		return Profession{}, false
	}
	id := int(body[0])
	level := int(binary.LittleEndian.Uint16(body[1:]))
	if id < 1 || id > professionCount || level < 1 || level > 200 {
		return Profession{}, false
	}
	return Profession{ID: id, Level: level, XP: binary.LittleEndian.Uint64(body[3:])}, true
}

// Daevanion boards are numbered 1 Nezekan, 2 Zikel, 3 Vaizel, 4 Triniel,
// 5 Ariel, 6 Azphel. Each sits in a 15 x 15 grid whose cells count from 1,
// row by row (smaller boards centered in it).
const (
	boardCount = 6
	boardCells = 15 * 15
)

// ParseBoards reads 26e2: u8 count, then per board u32 its id (class index
// x 10 + board number), varint n and n u32 acquired nodes (board id x 10000 +
// cell). Returns board number → acquired cells, in the message's order.
func ParseBoards(body []byte) (map[int][]int, bool) {
	r := newReader(body)
	count := int(r.u8())
	if !r.ok || count == 0 || count > boardCount {
		return nil, false
	}
	boards := make(map[int][]int, count)
	for i := 0; i < count; i++ {
		id := r.u32()
		n := r.varint()
		board := int(id % 10)
		if !r.ok || board < 1 || board > boardCount || n > boardCells {
			return nil, false
		}
		cells := make([]int, 0, n)
		for k := uint64(0); k < n; k++ {
			node := r.u32()
			cell := int(node % 10000)
			if !r.ok || node/10000 != id || cell < 1 || cell > boardCells {
				return nil, false
			}
			cells = append(cells, cell)
		}
		boards[board] = cells
	}
	if !r.ok || r.at != len(body) {
		return nil, false
	}
	return boards, true
}

// ParseBoardNode reads 2be2 and 28e2, sent when a node is taken back or
// taken: u16 0, then the node as in ParseBoards (board id x 10000 + cell).
// Returns the board number and cell.
func ParseBoardNode(body []byte) (board, cell int, ok bool) {
	r := newReader(body)
	result := r.u8() | r.u8()
	node := r.u32()
	if !r.ok || result != 0 || r.at != len(body) {
		return 0, 0, false
	}
	board = int(node / 10000 % 10)
	cell = int(node % 10000)
	if board < 1 || board > boardCount || cell < 1 || cell > boardCells {
		return 0, 0, false
	}
	return board, cell, true
}

// Duty is the daily duty board: quests turned in from it and when it expires
// (the next daily reset, ms). A board past its expiry is yesterday's: the
// game sends the new one later.
type Duty struct {
	Done int
	Ends int64
}

// ParseDuty reads 1c8d: u32 (unknown, 5 on a finished board), u32 quests
// turned in, u8 entries, the entries (not decoded), then the expiry twice
// (u64 ms, one byte between).
func ParseDuty(body []byte) (Duty, bool) {
	if len(body) < 25 {
		return Duty{}, false
	}
	done := binary.LittleEndian.Uint32(body[4:])
	ends := int64(binary.LittleEndian.Uint64(body[len(body)-8:]))
	again := int64(binary.LittleEndian.Uint64(body[len(body)-17:]))
	if done > 100 || ends != again || ends < 1_600_000_000_000 || ends > 4_000_000_000_000 {
		return Duty{}, false
	}
	return Duty{Done: int(done), Ends: ends}, true
}

// Progress is one progress counter: its count and when it last changed (ms,
// 0 if never).
type Progress struct {
	Count uint32
	At    int64
}

// ParseProgress reads 8356: varint n, then n entries of u32 id, u32 count,
// u64 last change (ms) and a byte (not decoded). A shorter list follows them,
// not read.
func ParseProgress(body []byte) (map[uint32]Progress, bool) {
	r := newReader(body)
	n := r.varint()
	if !r.ok || n > 100_000 || uint64(len(body)) < uint64(r.at)+n*17 {
		return nil, false
	}
	list := make(map[uint32]Progress, n)
	for k := uint64(0); k < n; k++ {
		id := r.u32()
		count := r.u32()
		at := int64(r.u64())
		r.skip(1)
		if !r.ok || at < 0 || (at != 0 && at < 1_600_000_000_000) || at > 4_000_000_000_000 {
			return nil, false
		}
		list[id] = Progress{Count: count, At: at}
	}
	return list, true
}

// ArenaMode is one arena mode's lifetime record (1 is Arena 1v1, 2 Arena
// 5v5, checked 2026-11-12; 3 not played yet).
type ArenaMode struct {
	Wins   uint64
	Losses uint64
}

// ParseArena reads 2ae3: u8 count, then per mode u8 mode, u32 rating, u32
// (0 so far), varint wins, varint losses, u16 (0 so far) and u8 (1 after a
// win, 0 after a loss).
func ParseArena(body []byte) (map[int]ArenaMode, bool) {
	r := newReader(body)
	count := int(r.u8())
	if !r.ok || count == 0 || count > 10 {
		return nil, false
	}
	modes := make(map[int]ArenaMode, count)
	for i := 0; i < count; i++ {
		mode := int(r.u8())
		r.skip(8)
		wins := r.varint()
		losses := r.varint()
		r.skip(3)
		if !r.ok || mode == 0 {
			return nil, false
		}
		modes[mode] = ArenaMode{Wins: wins, Losses: losses}
	}
	if r.at != len(body) {
		return nil, false
	}
	return modes, true
}

// ShopItem is one item on sale in a rotating shop's tab.
type ShopItem struct {
	// The tab's number for it; a purchase names it.
	Entry uint32
	Item  int
	// 0-3: 10, 20, 30 or 50% off.
	Discount int
	// Bought already (the game's Sold Out banner).
	SoldOut bool
}

// ShopTab is a rotating shop's open tab (101 Special, 104 Pets as seen at
// the Black Cloud Merchant).
type ShopTab struct {
	ID    int
	Items []ShopItem
}

// ParseShopTab reads 9156: u8 tab, u8 count, then per item u32 entry, u32
// item, u64 count, u8 discount, u8 (0x5d so far), u64 price, u64 price after
// the discount, and after items 1, 5, 9 … one more byte: 2 bits for each of
// that item and the next three, low bits first, 01 on sale, 11 sold out
// (Congealed Drana and Basilisk went 55 → 57 once bought, recordings
// 2026-11-13 13:14 and 13:57), then 12 bytes (a time) not read. Checked on
// Kryx's Special and Pets tabs, 2026-11-13.
func ParseShopTab(body []byte) (ShopTab, bool) {
	r := newReader(body)
	tab := ShopTab{ID: int(r.u8())}
	count := int(r.u8())
	if !r.ok || count == 0 || count > 64 {
		return ShopTab{}, false
	}
	var flags byte
	for k := 0; k < count; k++ {
		entry := r.u32()
		item := int(r.u32())
		r.skip(8)
		discount := int(r.u8())
		r.skip(17)
		if k%4 == 0 {
			flags = r.u8()
		}
		if !r.ok || item < 100000000 || discount > 3 {
			return ShopTab{}, false
		}
		soldOut := flags>>(2*(k%4))&2 != 0
		tab.Items = append(tab.Items, ShopItem{Entry: entry, Item: item, Discount: discount, SoldOut: soldOut})
	}
	return tab, true
}

// ParseShopBuy reads 9556: u16 (0 so far), u8 tab, u32 entry bought.
func ParseShopBuy(body []byte) (tab int, entry uint32, ok bool) {
	r := newReader(body)
	r.skip(2)
	tab = int(r.u8())
	entry = r.u32()
	return tab, entry, r.ok
}
