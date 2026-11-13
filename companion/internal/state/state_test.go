package state

import (
	"encoding/binary"
	"testing"
	"time"

	"daevanion-companion/internal/game"
	"daevanion-companion/internal/wire"
)

var now = time.UnixMilli(1_794_440_000_000)

func u32(v uint32) []byte { return binary.LittleEndian.AppendUint32(nil, v) }
func u64(v uint64) []byte { return binary.LittleEndian.AppendUint64(nil, v) }
func join(p ...[]byte) []byte {
	var out []byte
	for _, b := range p {
		out = append(out, b...)
	}
	return out
}

func msg(kind string, body []byte) wire.Message {
	var op [2]byte
	for i := 0; i < 2; i++ {
		var b byte
		for _, c := range kind[i*2 : i*2+2] {
			b <<= 4
			if c >= 'a' {
				b |= byte(c-'a') + 10
			} else {
				b |= byte(c - '0')
			}
		}
		op[i] = b
	}
	return wire.Message{Op: op, Body: body}
}

func character(name string, class uint32) wire.Message {
	body := join([]byte{0xa4, 0x54, 0x37}, []byte{byte(len(name))}, []byte(name), []byte{0x15, 0x05}, u32(class), make([]byte, 8))
	return msg(game.TypeCharacter, body)
}

func pets(level, souls uint32) wire.Message {
	return msg(game.TypePets, join(u32(0), []byte{1}, u32(1192), u32(1192), u32(level), []byte{1}, u32(1192), u32(souls)))
}

func stack(id uint32, item uint32, count uint64, storage byte) []byte {
	return join([]byte{0}, u32(id), []byte{0, 0x13, 0, 0}, u32(item), u64(count), []byte{storage, 0, 0, 0})
}

func counters(entries ...[]byte) wire.Message {
	return msg(game.TypeCounters, join([]byte{byte(len(entries))}, join(entries...)))
}

func counter(id uint32, value, bonus byte) []byte {
	return join([]byte{0x0c}, u32(id), []byte{value, bonus})
}

func TestDataWaitsForTheCharacter(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", msg(game.TypeSwitch, nil), now)
	tr.Handle("a", counters(counter(60000001, 100, 50)), now)
	if got := tr.TakeChanged(); len(got) != 0 {
		t.Fatalf("snapshots before the name: %+v", got)
	}
	tr.Handle("a", character("Testchar", 30), now)
	got := tr.TakeChanged()
	if len(got) != 1 || got[0].Character.Name != "Testchar" || got[0].Counters["60000001"] != [2]uint64{100, 50} {
		t.Fatalf("got %+v", got)
	}
}

func TestSwitchStartsANewCharacter(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("First", 6), now)
	tr.Handle("a", counters(counter(60000001, 1, 1)), now)
	tr.Handle("a", msg(game.TypeSwitch, nil), now)
	tr.Handle("a", counters(counter(60000001, 2, 2)), now)
	tr.Handle("a", character("Second", 34), now)
	all := tr.All()
	if len(all) != 2 || all[0].Counters["60000001"] != [2]uint64{1, 1} || all[1].Counters["60000001"] != [2]uint64{2, 2} {
		t.Fatalf("got %+v", all)
	}
}

func TestZoneChangeKeepsTheCharacter(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.TakeChanged()
	tr.Handle("a", pets(2, 48), now)
	got := tr.TakeChanged()
	if len(got) != 1 || got[0].Pets["1192"] != [2]int{2, 48} {
		t.Fatalf("got %+v", got)
	}
}

func TestSoulGain(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.Handle("a", pets(2, 74), now)
	tr.Handle("a", msg(game.TypePetSouls, join([]byte{1}, u32(1192), u32(1))), now.Add(time.Second))
	got := tr.All()[0]
	if got.Pets["1192"] != [2]int{3, 0} || got.PetsAt != now.Add(time.Second).UnixMilli() {
		t.Fatalf("got %+v", got)
	}
}

func TestInventoryByStorage(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.Handle("a", msg(game.TypeInventory, join([]byte{0x10, 0x02, 3},
		stack(1, 610530001, 229, 1),
		stack(2, 610530001, 4, 1),
		stack(3, 610530001, 1313, 2))), now)
	got := tr.All()[0]
	if got.Items["1"]["610530001"] != 233 || got.Items["2"]["610530001"] != 1313 {
		t.Fatalf("got %+v", got.Items)
	}

	// A craft empties one stack and makes a new item.
	tr.Handle("a", msg(game.TypeInventoryChange, join([]byte{2, 1},
		stack(2, 610530001, 0, 1),
		stack(9, 110760023, 1, 1))), now)
	got = tr.All()[0]
	if got.Items["1"]["610530001"] != 229 || got.Items["1"]["110760023"] != 1 {
		t.Fatalf("got %+v", got.Items)
	}
}

func TestSoulboundItemsAreKeptApart(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	ring := join(stack(4, 310330015, 1, 1), []byte{0x05, 0x9e, 0x04, 0x00, 0x00, 0x00, 0x15, 0x05, 0x01})
	tr.Handle("a", msg(game.TypeInventory, join([]byte{0x10, 0x02, 2},
		ring,
		stack(5, 610530001, 3, 15))), now)
	got := tr.All()[0]
	if got.Bound["1"]["310330015"] != 1 || got.Items["1"]["310330015"] != 0 || got.Items["15"]["610530001"] != 3 {
		t.Fatalf("items %+v bound %+v", got.Items, got.Bound)
	}
}

func TestCurrentIsTheCharacterNamedLast(t *testing.T) {
	tr := NewTracker()
	if tr.Current() != nil {
		t.Fatal("a character before any was named")
	}
	tr.Handle("a", character("First", 6), now)
	tr.Handle("b", character("Second", 34), now)
	if got := tr.Current(); got == nil || got.Name != "Second" || got.Class != 34 {
		t.Fatalf("got %+v", got)
	}
	// A switch keeps the last one until the next is named.
	tr.Handle("b", msg(game.TypeSwitch, nil), now)
	if got := tr.Current(); got == nil || got.Name != "Second" {
		t.Fatalf("got %+v", got)
	}
}

func TestNewStatus(t *testing.T) {
	status := NewStatus(true, "1.0.0", &game.Character{Name: "Testchar", Server: 1301, Class: 30}, now)
	if !status.Running || status.At != now.UnixMilli() || status.Character == nil || status.Character.Name != "Testchar" || status.Version != 1 {
		t.Fatalf("got %+v", status)
	}
	if NewStatus(false, "1.0.0", nil, now).Character != nil {
		t.Fatal("character without one")
	}
}

func TestCounterChange(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.Handle("a", counters(join([]byte{0x08}, u32(80000001), []byte{16})), now)
	tr.Handle("a", msg(game.TypeCounterChange, join([]byte{0, 0x08}, u32(80000001), []byte{15, 3})), now)
	if got := tr.All()[0].Counters["80000001"]; got != [2]uint64{0, 15} {
		t.Fatalf("got %v", got)
	}
}

func TestChangesBeforeTheFullListAreIgnored(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.Handle("a", msg(game.TypeCounterChange, join([]byte{0, 0x08}, u32(80000001), []byte{15, 3})), now)
	tr.Handle("a", msg(game.TypePetSouls, join([]byte{1}, u32(1192), u32(1))), now)
	got := tr.All()[0]
	if got.Counters != nil || got.Pets != nil {
		t.Fatalf("got %+v", got)
	}
}

func supply(kind byte, progress uint32) []byte {
	start := uint64(1_794_380_401_000)
	return join(u32(7), []byte{kind}, u64(start), u64(start+86_399_999), []byte{2},
		u32(7), u32(1), u32(progress),
		u32(7), u32(2), u32(0))
}

func TestSupplyDelivery(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.Handle("a", msg(game.TypeSupply, join([]byte{1}, supply(1, 0))), now)
	if got := tr.All()[0].Supply; len(got) != 1 || got[0].Delivered != 0 || got[0].Cards != 2 {
		t.Fatalf("got %+v", got)
	}
	tr.Handle("a", msg(game.TypeSupplyDelivery, join([]byte{0, 0}, u32(7), u32(2), u32(1))), now)
	if got := tr.All()[0].Supply; got[0].Delivered != 1 || got[0].Kind != 1 {
		t.Fatalf("got %+v", got)
	}
}

func TestConnectionsAreSeparate(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	// A new connection (the Abyss server) knows no character yet.
	tr.Handle("b", counters(counter(60000001, 5, 5)), now)
	if got := tr.All()[0]; got.Counters != nil {
		t.Fatalf("applied to the wrong connection: %+v", got)
	}
	tr.Handle("b", character("Testchar", 30), now)
	if got := tr.All()[0]; got.Counters["60000001"] != [2]uint64{5, 5} {
		t.Fatalf("got %+v", got)
	}
}

func craftDone(recipe, server, character uint32) wire.Message {
	body := join([]byte{0, 0, 1}, u32(recipe), []byte{0x50, 0x05}, u32(recipe), u32(1), u32(1), make([]byte, 12), u32(server), u32(character))
	return msg(game.TypeCraftDone, body)
}

func TestCraftLimits(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	limits := join(u32(0), []byte{1}, u32(31070001), u32(7), []byte{1}, u32(31070002), u32(0))
	tr.Handle("a", msg(game.TypeCraftLimits, limits), now)
	later := now.Add(time.Minute)
	tr.Handle("a", craftDone(31070002, 0, 1), later)

	got := tr.All()[0]
	if got.Crafts["31070001"] != [3]int64{7, 0, now.UnixMilli()} ||
		got.Crafts["31070002"] != [3]int64{0, 1, later.UnixMilli()} ||
		got.CraftsAt != later.UnixMilli() {
		t.Fatalf("got %+v", got.Crafts)
	}
}

func TestEmptyCraftLimitsChangeNothing(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.TakeChanged()
	tr.Handle("a", msg(game.TypeCraftLimits, []byte{0, 0, 1, 0, 0, 0}), now)
	if got := tr.TakeChanged(); len(got) != 0 || tr.All()[0].Crafts != nil {
		t.Fatalf("got %+v", got)
	}
}

func TestKeepFillsSectionsNotReadThisRun(t *testing.T) {
	previous := Snapshot{
		Version:    SnapshotVersion,
		Items:      map[string]map[string]uint64{"1": {"630900003": 31}},
		ItemsAt:    5,
		Counters:   map[string][2]uint64{"4": {5, 2}},
		CountersAt: 5,
		Crafts:     map[string][3]int64{"31070001": {7, 0, 5}, "31070002": {0, 1, 5}},
		CraftsAt:   5,
	}
	fresh := Snapshot{
		Version:  SnapshotVersion,
		Counters: map[string][2]uint64{"4": {4, 2}},
		Crafts:   map[string][3]int64{"31070001": {8, 0, 9}},
		CraftsAt: 9,
	}
	got := fresh.Keep(previous)
	if got.Items["1"]["630900003"] != 31 || got.ItemsAt != 5 {
		t.Fatalf("items %+v", got)
	}
	if got.Counters["4"] != [2]uint64{4, 2} {
		t.Fatalf("counters %+v", got.Counters)
	}
	if got.Crafts["31070001"] != [3]int64{8, 0, 9} || got.Crafts["31070002"] != [3]int64{0, 1, 5} || got.CraftsAt != 9 {
		t.Fatalf("crafts %+v", got.Crafts)
	}
	if fresh.Keep(Snapshot{Version: 99, ItemsAt: 5}).ItemsAt != 0 {
		t.Fatal("kept a section from another snapshot version")
	}
}

// A character message carrying Kryx's real proficiency list.
func characterWithProfessions(name string) wire.Message {
	body := join([]byte{0xa4, 0x54, 0x37}, []byte{byte(len(name))}, []byte(name), []byte{0x15, 0x05}, u32(30), make([]byte, 8),
		[]byte{5},
		[]byte{1, 61, 0}, u64(668), []byte{0, 0},
		[]byte{2, 1, 0}, u64(0), []byte{0, 0},
		[]byte{3, 94, 0}, u64(3097), []byte{0, 0},
		[]byte{4, 2, 0}, u64(14), []byte{0, 0},
		[]byte{5, 1, 0}, u64(0), []byte{0, 0})
	return msg(game.TypeCharacter, body)
}

func TestProfessions(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", characterWithProfessions("Testchar"), now)
	later := now.Add(time.Minute)
	// Blacksmithing to Professional 12.
	tr.Handle("a", msg(game.TypeProfessionLevel, join([]byte{1, 62, 0}, u64(93), []byte{1, 0})), later)

	got := tr.All()[0]
	want := map[string]int{"1": 62, "2": 1, "3": 94, "4": 2, "5": 1}
	if len(got.Professions) != len(want) || got.ProfessionsAt != later.UnixMilli() {
		t.Fatalf("got %+v at %d", got.Professions, got.ProfessionsAt)
	}
	for id, level := range want {
		if got.Professions[id] != level {
			t.Fatalf("got %+v", got.Professions)
		}
	}
}

func TestKeepMergesProfessions(t *testing.T) {
	previous := Snapshot{Version: SnapshotVersion, Professions: map[string]int{"1": 61, "3": 94}, ProfessionsAt: 5}
	// A level up seen by a companion started mid-session.
	fresh := Snapshot{Version: SnapshotVersion, Professions: map[string]int{"1": 62}, ProfessionsAt: 9}
	got := fresh.Keep(previous)
	if got.Professions["1"] != 62 || got.Professions["3"] != 94 || got.ProfessionsAt != 9 {
		t.Fatalf("got %+v", got)
	}
}

func TestBoards(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", msg(game.TypeLogin, nil), now)
	// Before the character message, like the game sends it.
	tr.Handle("a", msg(game.TypeBoards, join([]byte{1}, u32(71), []byte{2}, u32(710033), u32(710034))), now)
	tr.Handle("a", character("Testchar", 30), now)

	got := tr.All()[0]
	if len(got.Boards) != 1 || len(got.Boards["1"]) != 2 || got.Boards["1"][1] != 34 || got.BoardsAt != now.UnixMilli() {
		t.Fatalf("got %+v at %d", got.Boards, got.BoardsAt)
	}
}

func TestKeepKeepsBoards(t *testing.T) {
	previous := Snapshot{Version: SnapshotVersion, Boards: map[string][]int{"1": {33}}, BoardsAt: 5}
	if got := (Snapshot{Version: SnapshotVersion}).Keep(previous); got.Boards["1"][0] != 33 || got.BoardsAt != 5 {
		t.Fatalf("got %+v", got)
	}
	fresh := Snapshot{Version: SnapshotVersion, Boards: map[string][]int{"1": {33, 34}}, BoardsAt: 9}
	if got := fresh.Keep(previous); len(got.Boards["1"]) != 2 || got.BoardsAt != 9 {
		t.Fatalf("got %+v", got)
	}
}

func TestBoardNodeChanges(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", msg(game.TypeBoards, join([]byte{1}, u32(73), []byte{2}, u32(730033), u32(730192))), now)
	tr.Handle("a", character("Testchar", 30), now)
	later := now.Add(time.Minute)
	tr.Handle("a", msg(game.TypeBoardNodeRemoved, join([]byte{0, 0}, u32(730192))), later)
	if got := tr.All()[0]; len(got.Boards["3"]) != 1 || got.BoardsAt != later.UnixMilli() {
		t.Fatalf("after removing: %+v", got.Boards)
	}
	tr.Handle("a", msg(game.TypeBoardNodeAdded, join([]byte{0, 0}, u32(730192))), later)
	tr.Handle("a", msg(game.TypeBoardNodeAdded, join([]byte{0, 0}, u32(730192))), later)
	if got := tr.All()[0].Boards["3"]; len(got) != 2 || got[1] != 192 {
		t.Fatalf("after adding: %+v", got)
	}
}

func TestBoardNodeChangesNeedTheFullList(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.Handle("a", msg(game.TypeBoardNodeAdded, join([]byte{0, 0}, u32(750008))), now)
	if got := tr.All()[0]; got.Boards != nil {
		t.Fatalf("got %+v", got.Boards)
	}
}

func TestDuty(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	body := join(u32(0), u32(1), []byte{0}, u64(1794553200000), []byte{0}, u64(1794553200000))
	tr.Handle("a", msg(game.TypeDuty, body), now)
	got := tr.All()[0]
	if got.Duty == nil || *got.Duty != [2]int64{1, 1794553200000} || got.DutyAt != now.UnixMilli() {
		t.Fatalf("got %+v", got.Duty)
	}
	if kept := (Snapshot{Version: SnapshotVersion}).Keep(got); kept.Duty == nil || kept.DutyAt != got.DutyAt {
		t.Fatalf("Keep dropped the duty board: %+v", kept)
	}
}

func TestProgressKeepsOnlyRecentCounters(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	entry := func(id, count uint32, at time.Time) []byte {
		ms := uint64(0)
		if !at.IsZero() {
			ms = uint64(at.UnixMilli())
		}
		return join(u32(id), u32(count), u64(ms), []byte{0})
	}
	body := join([]byte{3},
		entry(231210800, 2, now.Add(-time.Hour)),
		entry(120010004, 9, now.Add(-30*24*time.Hour)),
		entry(231210900, 0, time.Time{}))
	tr.Handle("a", msg(game.TypeProgress, body), now)

	got := tr.All()[0]
	want := [2]int64{2, now.Add(-time.Hour).UnixMilli()}
	if len(got.Progress) != 1 || got.Progress["231210800"] != want || got.ProgressAt != now.UnixMilli() {
		t.Fatalf("got %+v", got.Progress)
	}
}

func TestArena(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.Handle("a", msg(game.TypeArena, join([]byte{1, 2}, u32(1468), u32(0), []byte{18, 21, 0, 0, 1})), now)
	got := tr.All()[0]
	if got.Arena["2"] != [2]uint64{18, 21} || got.ArenaAt != now.UnixMilli() {
		t.Fatalf("got %+v", got.Arena)
	}
	if kept := (Snapshot{Version: SnapshotVersion}).Keep(got); kept.Arena["2"] != [2]uint64{18, 21} {
		t.Fatalf("Keep dropped the arena stats: %+v", kept)
	}
}

// Pets are account-wide: the newest collection read, whoever's it was.
func TestPetsIsTheNewestCollection(t *testing.T) {
	tr := NewTracker()
	if tr.Pets() != nil {
		t.Fatal("pets before any were read")
	}
	tr.Handle("a", character("First", 6), now)
	tr.Handle("a", pets(1, 3), now)
	tr.Handle("a", msg(game.TypeSwitch, nil), now)
	tr.Handle("a", character("Second", 30), now.Add(time.Minute))
	if got := tr.Pets()[1192]; got != (game.Pet{Level: 1, Souls: 3}) {
		t.Fatalf("got %+v", got)
	}
	tr.Handle("a", pets(2, 7), now.Add(2*time.Minute))
	if got := tr.Pets()[1192]; got != (game.Pet{Level: 2, Souls: 7}) {
		t.Fatalf("got %+v", got)
	}
}

// Started mid-session: souls bought before the game resends the collection
// wait in LateGains; the collection replaces them.
func TestLateGains(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Kryx", 30), now)
	gain := msg(game.TypePetSouls, join([]byte{1}, u32(1163), u32(5)))
	tr.Handle("a", gain, now)
	tr.Handle("a", gain, now)
	if tr.Pets() != nil || tr.LateGains()[1163] != 10 {
		t.Fatalf("got %v %v", tr.Pets(), tr.LateGains())
	}
	tr.Handle("a", pets(1, 3), now)
	if tr.LateGains() != nil {
		t.Fatalf("kept %v after the collection", tr.LateGains())
	}
}

// Corridor entrances, as in Kryx's recording (2026-11-13 13:42-13:51).
func corridor(id uint32, open bool) []byte {
	if !open {
		return join([]byte{0}, u32(id))
	}
	return join([]byte{1}, u32(id), u64(130000))
}

func zone(id uint32) wire.Message {
	return msg(game.TypeZone, join(u32(5), u32(id), make([]byte, 20)))
}

func TestCorridors(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.Handle("a", counters(corridor(10000001, true), corridor(10000002, true), corridor(10000003, false)), now)
	if got := tr.All()[0]; len(got.Corridors) != 2 || got.Corridors[0] != "10000001" || got.CorridorsAt == 0 {
		t.Fatalf("at login %+v", got.Corridors)
	}
	// Lower Reshanta sends nothing; entering Reshanta's Root sends its
	// entrance again: used from then on.
	tr.Handle("a", zone(20), now)
	tr.Handle("a", msg(game.TypeCounterChange, join([]byte{0}, corridor(10000002, true))), now)
	if got := tr.All()[0].Corridors; len(got) != 2 {
		t.Fatalf("used outside a corridor: %v", got)
	}
	tr.Handle("a", zone(503003), now)
	tr.Handle("a", msg(game.TypeCounterChange, join([]byte{0}, corridor(10000001, true))), now)
	if got := tr.All()[0].Corridors; len(got) != 1 || got[0] != "10000002" {
		t.Fatalf("after entering %v", got)
	}
	// 130 s later the game clears it.
	tr.Handle("a", msg(game.TypeCounterChange, join([]byte{0}, corridor(10000001, false))), now)
	got := tr.All()[0]
	if len(got.Corridors) != 1 || got.Corridors[0] != "10000002" || got.Counters["10000001"] != [2]uint64{} {
		t.Fatalf("after clearing %+v", got)
	}
}

// Login's counter list has every entrance closed, used or not (Krathus's
// recording, 2026-11-13 16:54): unknown until the Abyss opens them.
func TestCorridorsUnknownAtLogin(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	tr.Handle("a", counters(corridor(10000001, false), corridor(10000002, false)), now)
	if got := tr.All()[0]; got.Corridors != nil || got.CorridorsAt != 0 {
		t.Fatalf("at login %+v at %d", got.Corridors, got.CorridorsAt)
	}
	// Entering the Abyss opens the held ones.
	tr.Handle("a", msg(game.TypeCounterChange, join([]byte{0}, corridor(10000001, true))), now)
	tr.Handle("a", msg(game.TypeCounterChange, join([]byte{0}, corridor(10000002, true))), now)
	tr.Handle("a", msg(game.TypeCounterChange, join([]byte{0}, corridor(10000003, false))), now)
	if got := tr.All()[0]; len(got.Corridors) != 2 || got.CorridorsAt == 0 {
		t.Fatalf("in the Abyss %+v", got.Corridors)
	}
	// Logging in again sends them all closed: what the Abyss said stays.
	later := now.Add(time.Minute)
	tr.Handle("a", counters(corridor(10000001, false), corridor(10000002, false)), later)
	if got := tr.All()[0]; len(got.Corridors) != 2 || got.CorridorsAt != now.UnixMilli() {
		t.Fatalf("after logging in again %+v at %d", got.Corridors, got.CorridorsAt)
	}
}

func TestKeepCorridors(t *testing.T) {
	previous := Snapshot{Version: SnapshotVersion, Corridors: []string{"10000001"}, CorridorsAt: 5}
	got := Snapshot{Version: SnapshotVersion, Counters: map[string][2]uint64{}, CountersAt: 9}.Keep(previous)
	if len(got.Corridors) != 1 || got.CorridorsAt != 5 {
		t.Fatalf("kept %+v at %d", got.Corridors, got.CorridorsAt)
	}
}

func TestArtifacts(t *testing.T) {
	tr := NewTracker()
	tr.Handle("a", character("Testchar", 30), now)
	body := join([]byte{1}, u32(1001), []byte{3, 1}, u64(1794514404000), u64(1794686400000), []byte{3},
		u32(1001), u32(1), []byte{1}, make([]byte, 8),
		u32(1002), u32(2), []byte{1}, make([]byte, 8),
		u32(1003), u32(3), []byte{2}, make([]byte, 8))
	tr.Handle("a", msg(game.TypeArtifacts, body), now)
	got := tr.All()[0]
	if got.Artifacts["1001"] != 1 || got.Artifacts["1003"] != 2 || got.SiegeEnd != 1794514404000 || got.ArtifactsAt == 0 {
		t.Fatalf("got %+v", got)
	}
	// Kept when a later snapshot lacks them.
	if kept := (Snapshot{Version: SnapshotVersion}).Keep(got); kept.Artifacts["1002"] != 1 || kept.SiegeEnd == 0 {
		t.Fatalf("kept %+v", kept)
	}
	// The same owners again aren't news.
	tr.TakeChanged()
	tr.Handle("a", msg(game.TypeArtifacts, body), now.Add(10*time.Second))
	if tr.All()[0].ArtifactsAt != got.ArtifactsAt {
		t.Fatal("restamped unchanged owners")
	}
}
