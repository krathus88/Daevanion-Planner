package shop

import (
	"reflect"
	"slices"
	"testing"
	"time"

	"daevanion-companion/internal/game"
)

func items(ids ...int) []game.ShopItem {
	var out []game.ShopItem
	for k, id := range ids {
		out = append(out, game.ShopItem{Entry: uint32(k + 1), Item: id})
	}
	return out
}

func TestPetItems(t *testing.T) {
	// Kryx's Pets tab (2026-11-13): Basilisk's item, bought, gave pet 1163
	// five souls.
	basilisk := PetItems[534760134]
	if basilisk.Pet != 1163 || basilisk.Name != "Basilisk" || !reflect.DeepEqual(basilisk.Maps, []string{"altgard"}) {
		t.Fatalf("got %+v", basilisk)
	}
	if PetItems[534760187].Pet != 1217 {
		t.Fatalf("Congealed Drana: %+v", PetItems[534760187])
	}
	for id, item := range PetItems {
		for _, m := range item.Maps {
			if m != "verteron" && m != "reshanta" && m != "altgard" {
				t.Fatalf("%d: map %q", id, m)
			}
		}
	}
}

func TestLines(t *testing.T) {
	pets := map[int]game.Pet{
		1163: {Level: 1, Souls: 12},
		1217: {Level: 3},
	}
	// Basilisk, a skin, Congealed Drana (Lv3), Ultimate Wind Spirit (once a
	// Pet Atlas placeholder, now 1079), Withered Branch Spider (never seen: locked).
	got := Lines(items(534760134, 535810015, 534760187, 534760078, 534760023), pets, DefaultFilter())
	want := []Line{
		{Name: "Basilisk", Level: 1, Souls: 12, Maps: []string{"altgard"}},
		{Name: "Ultimate Wind Spirit", Level: 0, Maps: []string{}},
		{Name: "Withered Branch Spider", Level: 0, Maps: []string{"altgard"}},
	}
	for k := range got {
		if got[k].Icon == nil {
			t.Fatalf("%s has no portrait", got[k].Name)
		}
		got[k].Icon = nil
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %+v", got)
	}
	unknown := Lines(items(534760134), nil, DefaultFilter())
	if len(unknown) != 1 || unknown[0].Level != -1 {
		t.Fatalf("without the collection: %+v", unknown)
	}
	// Young Tog's item gives pet 1122, as a game recording showed.
	if PetItems[534760153].Pet != 1122 {
		t.Fatalf("Young Tog: %+v", PetItems[534760153])
	}
	for id, item := range PetItems {
		if item.Pet <= 0 {
			t.Errorf("%d (%s): no game id", id, item.Name)
		}
	}
	if !HasPets(items(535810015, 534760187)) || HasPets(items(535810015)) {
		t.Fatal("HasPets")
	}
}

func TestWatch(t *testing.T) {
	now := time.Date(2026, 11, 13, 13, 15, 41, 0, time.UTC)
	var w Watch
	if w.Items(now) != nil {
		t.Fatal("open before a tab")
	}
	w.Tab(game.ShopTab{ID: 104, Items: items(534760134)}, now)
	if len(w.Items(now.Add(30*time.Second))) != 1 {
		t.Fatal("closed too soon")
	}
	w.Bought(104, 1, now.Add(30*time.Second))
	if w.Items(now.Add(30*time.Second+DefaultHideAfter)) == nil {
		t.Fatal("a purchase didn't keep it open")
	}
	if w.Items(now.Add(30*time.Second+DefaultHideAfter+time.Second)) != nil {
		t.Fatal("never timed out")
	}
	w.Tab(game.ShopTab{ID: 104, Items: items(534760134)}, now)
	w.Close()
	if w.Items(now) != nil {
		t.Fatal("still open after Close")
	}
}

// Two entries of one pet: each is marked on its own, as it's bought.
func TestWatchMarksTheEntryBought(t *testing.T) {
	now := time.Date(2026, 11, 13, 14, 51, 47, 0, time.UTC)
	var w Watch
	tab := game.ShopTab{ID: 104, Items: items(534760164, 534760164, 534760207)}
	w.Tab(tab, now)
	w.Bought(101, 2, now) // another tab's entry 2
	w.Bought(104, 2, now)
	got := w.Items(now)
	if got[0].SoldOut || !got[1].SoldOut || got[2].SoldOut {
		t.Fatalf("got %+v", got)
	}
	if tab.Items[1].SoldOut {
		t.Fatal("changed the tab it was given")
	}
	lines := Lines(got, map[int]game.Pet{1133: {Level: 1}}, DefaultFilter())
	if len(lines) != 3 || lines[0].Bought || !lines[1].Bought || lines[0].Name != lines[1].Name {
		t.Fatalf("lines %+v", lines)
	}
	// Bought up to Lv3, the entry stays, marked; one not bought is hidden.
	lines = Lines(got, map[int]game.Pet{1133: {Level: 3}}, DefaultFilter())
	if len(lines) != 2 || !lines[0].Bought || lines[1].Name != "Elite Guardite" {
		t.Fatalf("at Lv3 %+v", lines)
	}
}

func TestWatchSwitchesTabs(t *testing.T) {
	now := time.Date(2026, 11, 13, 13, 57, 10, 0, time.UTC)
	w := Watch{HideAfter: 10 * time.Second}
	w.Tab(game.ShopTab{ID: 101, Items: items(534760187)}, now)
	w.Tab(game.ShopTab{ID: 104, Items: items(534760134, 534760088)}, now.Add(5*time.Second))
	if got := w.Items(now.Add(5 * time.Second)); len(got) != 2 || got[0].Item != 534760134 {
		t.Fatalf("still the old tab: %+v", got)
	}
	if w.Items(now.Add(16*time.Second)) != nil {
		t.Fatal("ignored HideAfter")
	}
}

// Buying a pet in one tab shows in the next: 5 souls for a new pet is Lv1
// at 0/25, 100 left.
func TestWithGains(t *testing.T) {
	pets := map[int]game.Pet{1163: {Level: 0}}
	got := WithGains(pets, map[int]int{1163: 5, 1217: 3})
	if got[1163] != (game.Pet{Level: 1, Souls: 0}) || got[1217] != (game.Pet{Souls: 3}) {
		t.Fatalf("got %+v", got)
	}
	if pets[1163] != (game.Pet{}) {
		t.Fatal("changed the collection it was given")
	}
	if line := Lines(items(534760134), got, DefaultFilter())[0]; line.Level != 1 || line.Souls != 0 {
		t.Fatal("souls not counted")
	}
	if WithGains(nil, map[int]int{1163: 5}) != nil {
		t.Fatal("made a collection from nothing")
	}
}

// Every pet item's portrait is embedded and decodes at 64px.
func TestIcons(t *testing.T) {
	for id, item := range PetItems {
		if item.Icon == "" {
			continue
		}
		icon := Icon(item.Icon)
		if icon == nil || icon.Bounds().Dx() != 64 || icon.Bounds().Dy() != 64 {
			t.Fatalf("%d %s: %v", id, item.Icon, icon)
		}
	}
	if Icon("") != nil || Icon("no-such-pet") != nil {
		t.Fatal("made up a portrait")
	}
	if Icon("basilisk-01") != Icon("basilisk-01") {
		t.Fatal("decoded twice")
	}
}

func names(lines []Line) []string {
	var out []string
	for _, line := range lines {
		out = append(out, line.Name)
	}
	return out
}

// Basilisk (fera, Altgard only, Lv1), Aberrant Skama (Verteron and Lower
// Reshanta, Lv3), Ultimate Wind Spirit (not in the wild, level unknown),
// Kerubian (Verteron and Altgard, locked).
func TestFilters(t *testing.T) {
	tab := items(534760134, 534760088, 534760078, 534760143)
	pets := map[int]game.Pet{1163: {Level: 1}, 1089: {Level: 3}}
	for _, c := range []struct {
		name   string
		filter Filter
		want   []string
	}{
		{"default hides Lv3", DefaultFilter(), []string{"Basilisk", "Ultimate Wind Spirit", "Kerubian"}},
		{"nothing hidden", Filter{}, []string{"Basilisk", "Aberrant Skama", "Ultimate Wind Spirit", "Kerubian"}},
		{"hide Lv1", Filter{HiddenLevels: []int{1}}, []string{"Aberrant Skama", "Ultimate Wind Spirit", "Kerubian"}},
		{"one type", Filter{Types: []string{"fera"}}, []string{"Basilisk", "Aberrant Skama"}},
		{"two types", Filter{Types: []string{"fera", "cogni"}}, []string{"Basilisk", "Aberrant Skama", "Kerubian"}},
		{"only Altgard", Filter{Sources: []string{"altgard"}}, []string{"Basilisk"}},
		{"not in the wild or several", Filter{Sources: []string{"notWild", "several"}}, []string{"Aberrant Skama", "Ultimate Wind Spirit", "Kerubian"}},
	} {
		if got := names(Lines(tab, pets, c.filter)); !reflect.DeepEqual(got, c.want) {
			t.Errorf("%s: got %v", c.name, got)
		}
	}
	if Source(nil) != "notWild" || Source([]string{"reshanta"}) != "reshanta" || Source([]string{"verteron", "altgard"}) != "several" {
		t.Fatal("Source")
	}
	for id, item := range PetItems {
		if !slices.Contains(Types, item.Category) {
			t.Fatalf("%d: type %q", id, item.Category)
		}
	}
}

func TestEmptyText(t *testing.T) {
	tab := items(534760134, 534760187)
	if got := EmptyText(tab, map[int]game.Pet{1163: {Level: 3}, 1217: {Level: 3}}); got != "Every pet here is Lv3" {
		t.Fatal(got)
	}
	if got := EmptyText(tab, map[int]game.Pet{1163: {Level: 3}}); got != "No pet here matches your filters" {
		t.Fatal(got)
	}
}

// Kryx's Pets tab at 16:11:34 (2026-11-13), as sent: the screen shows it by
// entry number (screenshot): Varg Berserker, Mutated Aberrant Odyle Spider,
// Krao Test Subject, Pino, Mumu Overseer, Marsh Targon on top, then
// Intermediate and Superior Earth Spirit, Kerubian, Dratona Tinkerer.
func TestScreenOrder(t *testing.T) {
	sent := []game.ShopItem{
		{Entry: 120017, Item: 534760017}, {Entry: 120127, Item: 534760169},
		{Entry: 120150, Item: 534760124}, {Entry: 120151, Item: 534760125},
		{Entry: 120197, Item: 534760217}, {Entry: 120175, Item: 534760143},
		{Entry: 120020, Item: 534760020}, {Entry: 120130, Item: 534760172},
		{Entry: 120063, Item: 534760067}, {Entry: 120079, Item: 534760086},
	}
	want := []string{"Varg Berserker", "Mutated Aberrant Odyle Spider", "Krao Test Subject", "Pino", "Mumu Overseer",
		"Marsh Targon", "Intermediate Earth Spirit", "Superior Earth Spirit", "Kerubian", "Dratona Tinkerer"}
	if got := names(Lines(sent, nil, Filter{})); !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v", got)
	}
	if sent[1].Entry != 120127 {
		t.Fatal("sorted the tab it was given")
	}
}
