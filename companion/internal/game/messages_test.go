package game

import (
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"strings"
	"testing"
)

func h(s string) []byte {
	b, err := hex.DecodeString(strings.ReplaceAll(s, " ", ""))
	if err != nil {
		panic(err)
	}
	return b
}

func u32(v uint32) []byte { return binary.LittleEndian.AppendUint32(nil, v) }
func u64(v uint64) []byte { return binary.LittleEndian.AppendUint64(nil, v) }
func join(p ...[]byte) []byte {
	var out []byte
	for _, b := range p {
		out = append(out, b...)
	}
	return out
}

func TestParseCharacter(t *testing.T) {
	// Shape of a real 3336: ids, name, server 1301 (15 05), class, then more.
	body := join(h("c6 52 5f 81 c1 28 37"), []byte{8}, []byte("Testchar"), h("15 05 22 00 00 00 01 2d 00 00 00 42 08 00 00"))
	c, ok := ParseCharacter(body)
	if !ok || c.Name != "Testchar" || c.Server != 1301 || c.Class != 34 {
		t.Fatalf("got %+v %v", c, ok)
	}
}

func TestParseCharacterRejectsNoise(t *testing.T) {
	if _, ok := ParseCharacter(h("01 02 03 04 05 06 07 08 09 0a 0b 0c")); ok {
		t.Fatal("parsed noise")
	}
}

func TestParsePets(t *testing.T) {
	body := join(u32(0x443), []byte{2},
		u32(1005), u32(1005), u32(3),
		u32(1192), u32(1192), u32(2),
		[]byte{2},
		u32(1005), u32(0),
		u32(1192), u32(49))
	pets, ok := ParsePets(body)
	if !ok || pets[1192] != (Pet{Level: 2, Souls: 49}) || pets[1005] != (Pet{Level: 3}) {
		t.Fatalf("got %+v %v", pets, ok)
	}
}

func TestParsePetsTruncated(t *testing.T) {
	if _, ok := ParsePets(join(u32(1), []byte{5}, u32(1005))); ok {
		t.Fatal("accepted a cut message")
	}
}

func TestParsePetSouls(t *testing.T) {
	// The real message for one soul to pet 1192.
	gains, ok := ParsePetSouls(h("01 a8 04 00 00 01 00 00 00"))
	if !ok || len(gains) != 1 || gains[0] != (SoulGain{Pet: 1192, Amount: 1}) {
		t.Fatalf("got %+v %v", gains, ok)
	}
}

func TestAddSoulsLevelsUp(t *testing.T) {
	if got := (Pet{Level: 2, Souls: 48}).AddSouls(1); got != (Pet{Level: 2, Souls: 49}) {
		t.Fatalf("got %+v", got)
	}
	if got := (Pet{Level: 1, Souls: 24}).AddSouls(2); got != (Pet{Level: 2, Souls: 1}) {
		t.Fatalf("got %+v", got)
	}
	if got := (Pet{Level: 3}).AddSouls(5); got != (Pet{Level: 3, Souls: 5}) {
		t.Fatalf("got %+v", got)
	}
}

func TestParseStacks(t *testing.T) {
	// From a real craft: an ingot stack at 229, an emptied one, a new mace.
	body := join(h("05 01"),
		h("00 a7 1e 0f 00 00 13 00 00"), u32(610530001), u64(229), h("00 00 00 00 00 00 00 02 26 00 00"),
		h("00 d4 e5 0e 00 00 08 00 00"), u32(610530001), u64(0), h("01 31 00 00"),
		h("01 03 71 0e 00 00 49 00 00"), u32(110760023), u64(1), h("01 31 00 00 00 00 04"), []byte("Name"))
	stacks := ParseStacks(body)
	want := []Stack{
		{ID: 0x000f1ea7, Item: 610530001, Count: 229},
		{ID: 0x000ee5d4, Item: 610530001, Count: 0, Storage: StorageBag},
		{ID: 0x000e7103, Item: 110760023, Count: 1, Storage: StorageBag},
	}
	if len(stacks) != len(want) {
		t.Fatalf("got %+v", stacks)
	}
	for i := range want {
		if stacks[i] != want[i] {
			t.Fatalf("stack %d: got %+v want %+v", i, stacks[i], want[i])
		}
	}
}

func TestParseStacksFindsSoulbound(t *testing.T) {
	// A ring before and after soulbinding: the owner and server 1301 appear.
	before := join(h("01 00 8c 15 00 00 1e 00 00"), u32(310330015), u64(1),
		h("01 24 00 00 00 04"), []byte("Name"), make([]byte, 30))
	after := join(h("01 46 80 0c 00 00 31 00 00"), u32(310330015), u64(1),
		h("01 24 00 00 00 04"), []byte("Name"), make([]byte, 22), h("05 9e 04 00 00 00 15 05 01 03"))
	next := join(h("00 4a c7 0d 00 00 32 00 00"), u32(532760001), u64(168), h("01 17 00 00"))

	stacks := ParseStacks(join(before, after, next))
	if len(stacks) != 3 {
		t.Fatalf("got %+v", stacks)
	}
	if stacks[0].Bound || !stacks[1].Bound || stacks[2].Bound {
		t.Fatalf("bound flags %v %v %v", stacks[0].Bound, stacks[1].Bound, stacks[2].Bound)
	}
}

func TestParseCounters(t *testing.T) {
	// Real shapes: id 1 with only a bonus, id 3 with two times, energy with
	// both values, Ascension Trial with a bonus, one at zero.
	body := join([]byte{5},
		h("08 01 00 00 00 06"),
		h("03 03 00 00 00"), u64(25200000), u64(3600000),
		h("0c"), u32(60000001), h("87 01 89 02"),
		h("08"), u32(80000001), h("10"),
		h("00"), u32(90000001))
	counters, ok := ParseCounters(body)
	if !ok || len(counters) != 5 {
		t.Fatalf("got %+v %v", counters, ok)
	}
	if counters[60000001] != (Counter{ID: 60000001, Value: 135, Bonus: 265}) {
		t.Fatalf("energy %+v", counters[60000001])
	}
	if counters[80000001] != (Counter{ID: 80000001, Bonus: 16}) {
		t.Fatalf("ascension %+v", counters[80000001])
	}
}

func TestParseCounterChange(t *testing.T) {
	// The real update when entering Ascension Trial: bonus down to 15.
	c, ok := ParseCounterChange(h("00 08 01 b4 c4 04 0f 03"))
	if !ok || c != (Counter{ID: 80000001, Bonus: 15}) {
		t.Fatalf("got %+v %v", c, ok)
	}
}

func TestParseCountersRejectsUnknownFlags(t *testing.T) {
	if _, ok := ParseCounters(join([]byte{1}, h("40 01 00 00 00"))); ok {
		t.Fatal("accepted unknown flags")
	}
}

func supplyGroup(id uint32, kind byte, start int64, cards [][2]uint32, stray map[int]bool) []byte {
	out := join(u32(id), []byte{kind}, u64(uint64(start)), u64(uint64(start+86_400_000-1)), []byte{byte(len(cards))})
	for i, c := range cards {
		if stray[i] {
			out = append(out, 0x70)
		}
		out = join(out, u32(id), u32(c[0]), u32(c[1]))
	}
	return out
}

func TestParseSupply(t *testing.T) {
	start := int64(1_794_380_401_000)
	daily := supplyGroup(0x526cd3, 1, start, [][2]uint32{{1, 0}, {2, 300}, {3, 5}}, map[int]bool{1: true})
	weekly := supplyGroup(0x526cdd, 2, start, [][2]uint32{{4, 0}}, nil)
	body := join([]byte{2}, daily, []byte{0}, weekly)
	groups, ok := ParseSupply(body)
	if !ok || len(groups) != 2 {
		t.Fatalf("got %+v %v", groups, ok)
	}
	if groups[0].Kind != 1 || len(groups[0].Cards) != 3 || groups[0].Cards[1].Progress != 300 || groups[0].Start != start {
		t.Fatalf("daily %+v", groups[0])
	}
	if groups[1].Kind != 2 || groups[1].Cards[0].ID != 4 {
		t.Fatalf("weekly %+v", groups[1])
	}
}

func TestParseDelivery(t *testing.T) {
	d, ok := ParseDelivery(h("00 00 dd 6c 52 00 05 72 0f 00 02 00 00 00"))
	if !ok || d != (Delivery{Group: 0x526cdd, Card: 0x0f7205}) {
		t.Fatalf("got %+v %v", d, ok)
	}
}

// From a real session: Odyle Energy crafted once, server limit 7 → 8.
func TestParseCraftDoneServerLimit(t *testing.T) {
	c, ok := ParseCraftDone(h("0000013117da0150053117da0101000000010000000000000000000000000000000800000000000000"))
	if !ok || c != (CraftCount{Recipe: 31070001, Server: 8}) {
		t.Fatalf("got %+v %v", c, ok)
	}
}

// The character-limited Odyle Energy recipe, 0 → 1.
func TestParseCraftDoneCharacterLimit(t *testing.T) {
	c, ok := ParseCraftDone(h("0000013217da0150053217da0101000000010000000000000000000000000000000000000001000000"))
	if !ok || c != (CraftCount{Recipe: 31070002, Character: 1}) {
		t.Fatalf("got %+v %v", c, ok)
	}
}

func TestParseCraftDoneRejectsOtherShapes(t *testing.T) {
	if _, ok := ParseCraftDone(h("000001000000")); ok {
		t.Fatal("read a short message")
	}
	if _, ok := ParseCraftDone(h("0000013117da0150053217da0101000000010000000000000000000000000000000800000000000000")); ok {
		t.Fatal("read a message whose two recipe ids differ")
	}
}

func TestParseCraftLimits(t *testing.T) {
	body := join(u32(0), []byte{2}, u32(31070001), u32(7), u32(41013001), u32(0),
		[]byte{1}, u32(31070002), u32(1))
	counts, ok := ParseCraftLimits(body)
	want := []CraftCount{{Recipe: 31070001, Server: 7}, {Recipe: 41013001}, {Recipe: 31070002, Character: 1}}
	if !ok || len(counts) != 3 || counts[0] != want[0] || counts[1] != want[1] || counts[2] != want[2] {
		t.Fatalf("got %+v %v", counts, ok)
	}
}

func TestParseCraftLimitsShortForm(t *testing.T) {
	counts, ok := ParseCraftLimits(h("000001000000"))
	if !ok || len(counts) != 0 {
		t.Fatalf("got %+v %v", counts, ok)
	}
}

// Kryx's proficiency in a real character message (2026-11-12): Blacksmithing
// Professional 11 (61, 668 xp), Armorsmithing 1, Handicrafting Professional
// 44 (94, 3097 xp), Alchemy 2 (14 xp), Cooking 1. The 02 01 64… before it is
// another, shorter list of the same shape that must not match.
func TestParseProfessions(t *testing.T) {
	body := h("00000000000000000201640000000000000000000000000005013d009c02000000000000000002010000000000000000000000035e00190c00000000000000000402000e000000000000000000050100000000000000000000000000000000000000")
	got, ok := ParseProfessions(body)
	want := []Profession{{1, 61, 668}, {2, 1, 0}, {3, 94, 3097}, {4, 2, 14}, {5, 1, 0}}
	if !ok || len(got) != len(want) {
		t.Fatalf("got %+v %v", got, ok)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("got %+v", got)
		}
	}
}

func TestParseProfessionsNeedsTheWholeList(t *testing.T) {
	// Cut after the third profession.
	if _, ok := ParseProfessions(h("05013d009c02000000000000000002010000000000000000000000035e00190c0000000000000000")); ok {
		t.Fatal("read a cut list")
	}
	if _, ok := ParseProfessions(h("0201640000000000000000000000000000")); ok {
		t.Fatal("read the other list")
	}
}

// Real level ups from the same session: Blacksmithing to Professional 12
// (62, 93 xp over), Handicrafting to Professional 45 (95, 224 xp).
func TestParseProfessionLevel(t *testing.T) {
	for body, want := range map[string]Profession{
		"013e005d000000000000000100": {1, 62, 93},
		"035f00e0000000000000000100": {3, 95, 224},
	} {
		got, ok := ParseProfessionLevel(h(body))
		if !ok || got != want {
			t.Fatalf("%s: got %+v %v", body, got, ok)
		}
	}
	if _, ok := ParseProfessionLevel(h("09010000")); ok {
		t.Fatal("read a short message")
	}
}

// Built like Kryx's (a Cleric, class index 7): Nezekan with three nodes, Ariel
// with one.
func TestParseBoards(t *testing.T) {
	body := h("02" + "47000000" + "03" + "91d50a00" + "92d50a00" + "ced50a00" + "4b000000" + "01" + "b1710b00")
	got, ok := ParseBoards(body)
	if !ok || len(got) != 2 {
		t.Fatalf("got %v %v", got, ok)
	}
	if fmt.Sprint(got[1]) != "[33 34 94]" || fmt.Sprint(got[5]) != "[1]" {
		t.Fatalf("got %v", got)
	}
}

func TestParseBoardsRefusesOtherShapes(t *testing.T) {
	for _, body := range []string{
		"",
		// A node of another board.
		"01" + "47000000" + "01" + "b1710b00",
		// Cut short.
		"01" + "47000000" + "02" + "91d50a00",
		// Bytes left over.
		"01" + "47000000" + "01" + "91d50a00" + "00",
	} {
		if _, ok := ParseBoards(h(body)); ok {
			t.Fatalf("read %s", body)
		}
	}
}

// Real ones from the user's recording (Kryx, 2026-11-12): Vaizel's cell 192
// and Ariel's cell 8.
func TestParseBoardNode(t *testing.T) {
	for body, want := range map[string][2]int{
		"000050240b00": {3, 192},
		"0000b8710b00": {5, 8},
	} {
		board, cell, ok := ParseBoardNode(h(body))
		if !ok || board != want[0] || cell != want[1] {
			t.Fatalf("%s: got %d %d %v", body, board, cell, ok)
		}
	}
	for _, body := range []string{"0100b8710b00", "0000b8710b", "0000b8710b0000"} {
		if _, _, ok := ParseBoardNode(h(body)); ok {
			t.Fatalf("read %s", body)
		}
	}
}

// The start and end of Kryx's real boards (2026-11-12): yesterday's, finished
// (5), and today's after one turn-in. The entries between are cut short.
func TestParseDuty(t *testing.T) {
	for body, want := range map[string]Duty{
		"0500000005000000137006" + "0000809698000000000080618ecea10100000080618ecea1010000": {5, 1794466800000},
		"00000000010000000fa006" + "0000809698000000000080bdb4d3a10100000080bdb4d3a1010000": {1, 1794553200000},
	} {
		got, ok := ParseDuty(h(body))
		if !ok || got != want {
			t.Fatalf("%s: got %+v %v", body, got, ok)
		}
	}
	// The two expiry times disagree.
	if _, ok := ParseDuty(h("00000000010000000fa006" + "0000809698000000000080bdb4d3a10100000080618ecea1010000")); ok {
		t.Fatal("read a board with two expiry times")
	}
}

// Two real entries (Kryx, 2026-11-12 22:57: Arena 5v5 participation 2, wins
// 1), one never counted, then the short list that follows.
func TestParseProgress(t *testing.T) {
	body := h("03" +
		"30ffc70d" + "02000000" + "7faffad1a1010000" + "00" +
		"94ffc70d" + "01000000" + "7faffad1a1010000" + "00" +
		"a4a0d50d" + "00000000" + "0000000000000000" + "00" +
		"0117")
	got, ok := ParseProgress(body)
	if !ok || len(got) != 3 {
		t.Fatalf("got %v %v", got, ok)
	}
	if got[231210800] != (Progress{2, 1794524229503}) || got[231210900].Count != 1 || got[232104100] != (Progress{}) {
		t.Fatalf("got %+v", got)
	}
	// Cut short.
	if _, ok := ParseProgress(h("03" + "30ffc70d" + "02000000")); ok {
		t.Fatal("read a cut list")
	}
}

// Kryx's real stats after the first 1v1 win (2026-11-12 23:07): 1v1 1-0,
// 5v5 18-21, mode 3 unplayed.
func TestParseArena(t *testing.T) {
	got, ok := ParseArena(h("0301fa05000000000000010000000102bc05000000000000121500000103dc050000000000000000000000"))
	if !ok || len(got) != 3 {
		t.Fatalf("got %v %v", got, ok)
	}
	if got[1] != (ArenaMode{1, 0}) || got[2] != (ArenaMode{18, 21}) || got[3] != (ArenaMode{}) {
		t.Fatalf("got %+v", got)
	}
	// Wins past 127 take two bytes.
	big, ok := ParseArena(h("0102bc05000000000000" + "9001" + "15" + "000001"))
	if !ok || big[2] != (ArenaMode{144, 21}) {
		t.Fatalf("got %+v %v", big, ok)
	}
	if _, ok := ParseArena(h("0301fa0500000000000001000000")); ok {
		t.Fatal("read a cut message")
	}
}

// Kryx's Black Cloud Merchant Pets tab (2026-11-13 13:15:41).
const shopPetsTab = "680a54d50100c6cadf1f0100000000000000005da086010000000000905f0100000000005511d5010098cadf1f0100000000000000015da08601000000000080380100000000007cd501000fcbdf1f0100000000000000025da08601000000000070110100000000006fd50100cfcadf1f0100000000000000025da0860100000000007011010000000000e3d4010067cadf1f0100000000000000035da08601000000000050c30000000000005518d501009fcadf1f0100000000000000005da086010000000000905f0100000000001ad50100a1cadf1f0100000000000000025da086010000000000701101000000000029d5010057cadf1f0100000000000000015da086010000000000803801000000000008d501008ecadf1f0100000000000000035da08601000000000050c30000000000000533d50100ddcadf1f0100000000000000035da08601000000000050c3000000000000004335d5a101000000000000"

func TestParseShopTab(t *testing.T) {
	tab, ok := ParseShopTab(h(shopPetsTab))
	if !ok || tab.ID != 104 || len(tab.Items) != 10 {
		t.Fatalf("got %+v %v", tab, ok)
	}
	if tab.Items[0] != (ShopItem{Entry: 120148, Item: 534760134, Discount: 0}) {
		t.Fatalf("first %+v", tab.Items[0])
	}
	if tab.Items[4] != (ShopItem{Entry: 120035, Item: 534760039, Discount: 3}) || tab.Items[9].Item != 534760157 {
		t.Fatalf("got %+v", tab.Items)
	}
	for _, item := range tab.Items {
		if item.SoldOut {
			t.Fatalf("sold out: %+v", item)
		}
	}
	// The same tab after buying Basilisk (13:57:28): its flags 55 → 57.
	bought, ok := ParseShopTab(h(strings.Replace(shopPetsTab, "905f0100000000005511d501", "905f0100000000005711d501", 1)))
	if !ok || !bought.Items[0].SoldOut || bought.Items[1].SoldOut || bought.Items[4].SoldOut {
		t.Fatalf("after buying %+v", bought.Items)
	}
	if _, ok := ParseShopTab(h(shopPetsTab[:200])); ok {
		t.Fatal("read a cut tab")
	}
}

// Buying Basilisk from that tab.
func TestParseShopBuy(t *testing.T) {
	tab, entry, ok := ParseShopBuy(h("00006854d50100"))
	if !ok || tab != 104 || entry != 120148 {
		t.Fatalf("got %d %d %v", tab, entry, ok)
	}
}

// Kryx in Lower Reshanta (05e3) and on the world server (07e3), 2026-11-13:
// Elyos hold 1001 and 1002, Asmodians 1003; the last siege ended
// 2026-11-12 20:13:24 UTC.
func TestParseArtifacts(t *testing.T) {
	for _, body := range []string{
		"01e90300000301a0c264d1a10100000036a5dba101000003e9030000f1c81000010000000000000000ea030000f3c81000010000000000000000eb030000f5c81000020000000000000000",
		"00000200d10700000300000000000000000001e90300000300a0c264d1a10100000036a5dba101000006d1070000b0ca100000b0ca100000000000d2070000b1ca100000b1ca100000000000d3070000b2ca100000b2ca100000000000e9030000f1c8100001f1c8100000000000ea030000f3c8100001f3c8100000000000eb030000f5c8100002f5c8100000000000",
	} {
		got, ok := ParseArtifacts(h(body))
		if !ok || got.Owners[1001] != 1 || got.Owners[1002] != 1 || got.Owners[1003] != 2 || got.SiegeEnd != 1794514404000 {
			t.Fatalf("got %+v %v", got, ok)
		}
	}
	if _, ok := ParseArtifacts(h("0102")); ok {
		t.Fatal("read nothing as owners")
	}
}

func TestParseZone(t *testing.T) {
	if id, ok := ParseZone(h("05000000dbac0700397c2900000000009b68cd41")); !ok || id != 503003 {
		t.Fatalf("got %d %v", id, ok)
	}
}

func TestParseCorridorCounter(t *testing.T) {
	c, ok := ParseCounterChange(h("000181969800d0fb01000000000003"))
	if !ok || c.ID != 10000001 || !c.Open || !IsCorridorCounter(c.ID) {
		t.Fatalf("got %+v", c)
	}
	if c, _ := ParseCounterChange(h("00008196980003")); c.Open {
		t.Fatal("cleared entrance still open")
	}
}
