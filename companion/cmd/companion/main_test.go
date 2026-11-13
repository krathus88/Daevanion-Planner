package main

import (
	"reflect"
	"testing"

	"daevanion-companion/internal/desktop"
	"daevanion-companion/internal/game"
	"daevanion-companion/internal/shop"
	"daevanion-companion/internal/state"
)

func TestConnectionText(t *testing.T) {
	kryx := &game.Character{Name: "Kryx", Server: 1301, Class: 30}
	for _, c := range []struct {
		connected bool
		playing   *game.Character
		state     desktop.WidgetState
		want      string
	}{
		// No game, no widget, even with a character known from before.
		{false, nil, desktop.WidgetHidden, ""},
		{false, kryx, desktop.WidgetHidden, ""},
		// Started mid-session: stays up until a character comes.
		{true, nil, desktop.WidgetWaiting, "Connected to AION 2 · waiting for your character"},
		{true, kryx, desktop.WidgetDone, "Connected · playing Kryx"},
	} {
		state, got := connectionText(c.connected, c.playing)
		if state != c.state || got != c.want {
			t.Errorf("connectionText(%v, %v) = %v %q, want %v %q", c.connected, c.playing, state, got, c.state, c.want)
		}
	}
}

func TestShopPets(t *testing.T) {
	items := func(ids ...int) []game.ShopItem {
		var out []game.ShopItem
		for _, id := range ids {
			out = append(out, game.ShopItem{Item: id})
		}
		return out
	}
	filter := shop.DefaultFilter()
	// No tab, or a tab of skins only: hidden.
	if shopPets(nil, nil, filter) != nil || shopPets(items(535810015), nil, filter) != nil {
		t.Fatal("shown without pets on sale")
	}
	// Basilisk (pet 1163) at Lv1 12/25.
	got := shopPets(items(535810015, 534760134), map[int]game.Pet{1163: {Level: 1, Souls: 12}}, filter)
	want := []desktop.ShopPet{{Name: "Basilisk", Level: 1, Souls: 12, Maps: []string{"altgard"}}}
	if got == nil || len(got.Pets) != 1 || got.Pets[0].Icon == nil {
		t.Fatalf("no portrait: %+v", got)
	}
	got.Pets[0].Icon = nil
	if !reflect.DeepEqual(got.Pets, want) || got.Empty != "" {
		t.Fatalf("got %+v", got)
	}
	// Every pet at Lv3: shown, saying so; with Lv3 not hidden, listed.
	lv3 := map[int]game.Pet{1163: {Level: 3}}
	all := shopPets(items(534760134), lv3, filter)
	if all == nil || len(all.Pets) != 0 || all.Empty != "Every pet here is Lv3" {
		t.Fatalf("got %#v", all)
	}
	if shown := shopPets(items(534760134), lv3, shop.Filter{}); len(shown.Pets) != 1 || shown.Pets[0].Level != 3 {
		t.Fatalf("got %#v", shown)
	}
	// A bought entry says so.
	sold := items(534760134)
	sold[0].SoldOut = true
	if shown := shopPets(sold, lv3, filter); len(shown.Pets) != 1 || !shown.Pets[0].Bought {
		t.Fatalf("bought %#v", shown)
	}
	// The preview's sample has every pet.
	if sample := shopSample(); len(sample.Pets) != 4 {
		t.Fatalf("sample %+v", sample)
	}
}

func TestNewestPets(t *testing.T) {
	if newestPets(map[string]state.Snapshot{"a": {}}) != nil {
		t.Fatal("pets from rows without any")
	}
	got := newestPets(map[string]state.Snapshot{
		"old": {Pets: map[string][2]int{"1163": {1, 2}}, PetsAt: 1},
		"new": {Pets: map[string][2]int{"1163": {2, 5}}, PetsAt: 2},
	})
	if got[1163] != (game.Pet{Level: 2, Souls: 5}) {
		t.Fatalf("got %+v", got)
	}
}

// The settings window's Updates card: a test build can't check.
func TestStateVersion(t *testing.T) {
	a := &app{checkingUpdates: true}
	got := a.state()
	if got.Version != version || got.CanUpdate || !got.CheckingUpdates {
		t.Fatalf("got %+v", got)
	}
}
