// Package shop turns a rotating shop's open tab into the pets panel: which
// pets on sale still need souls, and where else they can be had.
package shop

import (
	"bytes"
	"cmp"
	"embed"
	"encoding/json"
	"image"
	"image/png"
	"slices"
	"strconv"
	"sync"
	"time"

	"daevanion-companion/internal/game"
)

// Pet items ("Pet: Basilisk": the pet, or its souls once owned), made by
// the site repo's `npm run pets:shop` (scripts/buildShopPets.ts).
//
//go:embed petitems.json
var petItemsJSON []byte

// Pet portraits by portrait name, 64px, made by the same script.
//
//go:embed icons/*.png
var iconFiles embed.FS

// PetItem is the pet an item gives.
type PetItem struct {
	// The game's pet id; negative for a pet the companion can't look up (no
	// shop item gives one now).
	Pet  int    `json:"pet"`
	Name string `json:"name"`
	// Its type (Types).
	Category string `json:"category"`
	// Its portrait in icons/; empty without one.
	Icon string `json:"icon"`
	// Where its soul monsters spawn: verteron, reshanta (Lower Reshanta),
	// altgard. Empty: not in the wild.
	Maps []string `json:"maps"`
}

// PetItems is every pet item by item id.
var PetItems = loadPetItems()

func loadPetItems() map[int]PetItem {
	var raw map[string]PetItem
	if err := json.Unmarshal(petItemsJSON, &raw); err != nil {
		panic("shop: bad petitems.json: " + err.Error())
	}
	items := make(map[int]PetItem, len(raw))
	for id, item := range raw {
		n, err := strconv.Atoi(id)
		if err != nil {
			panic("shop: bad item id " + id)
		}
		items[n] = item
	}
	return items
}

var (
	iconsMu sync.Mutex
	icons   = map[string]image.Image{}
)

// Icon is a pet portrait, decoded once; nil without one.
func Icon(name string) image.Image {
	if name == "" {
		return nil
	}
	iconsMu.Lock()
	defer iconsMu.Unlock()
	if icon, ok := icons[name]; ok {
		return icon
	}
	var icon image.Image
	if data, err := iconFiles.ReadFile("icons/" + name + ".png"); err == nil {
		icon, _ = png.Decode(bytes.NewReader(data))
	}
	icons[name] = icon
	return icon
}

// Line is one pet in the panel.
type Line struct {
	Name string
	// Its portrait; nil without one.
	Icon image.Image
	// Its Insight level (0 locked), -1 when it isn't known, and its souls
	// toward the next level, like the site and the game's card show them.
	Level int
	Souls int
	Maps  []string
	// This entry was bought (sold out).
	Bought bool
}

// Pet types (the Pets page's), and where else a pet on sale can be had (its
// Shop check's "Only worth buying" choices), in display order.
var (
	Types   = []string{"cogni", "fera", "natura", "varian", "special"}
	Sources = []string{"notWild", "verteron", "reshanta", "altgard", "several"}
)

// Source is where else a pet with these spawn maps can be had: nowhere in
// the wild, only on one map, or on several.
func Source(maps []string) string {
	switch len(maps) {
	case 0:
		return "notWild"
	case 1:
		return maps[0]
	default:
		return "several"
	}
}

// Filter picks the pets the panel shows, like the site's Pets page.
type Filter struct {
	// The pet types shown (Types); empty shows all.
	Types []string
	// Insight levels left out (1-3). Locked pets and those whose level isn't
	// known always show.
	HiddenLevels []int
	// Where else the pet can be had (Sources); empty lets any through.
	Sources []string
}

// DefaultFilter hides pets already at Lv3.
func DefaultFilter() Filter {
	return Filter{HiddenLevels: []int{3}}
}

func (f Filter) shows(item PetItem, level int) bool {
	if len(f.Types) > 0 && !slices.Contains(f.Types, item.Category) {
		return false
	}
	if level > 0 && slices.Contains(f.HiddenLevels, level) {
		return false
	}
	return len(f.Sources) == 0 || slices.Contains(f.Sources, Source(item.Maps))
}

// ScreenOrder is the tab's items as the shop shows them, left to right, top
// row first: by entry number, not the order the tab list sends them in
// (checked on both Black Cloud Merchant tabs against screenshots,
// 2026-11-13 16:11).
func ScreenOrder(items []game.ShopItem) []game.ShopItem {
	sorted := slices.Clone(items)
	slices.SortStableFunc(sorted, func(a, b game.ShopItem) int {
		return cmp.Compare(a.Entry, b.Entry)
	})
	return sorted
}

// Lines lists the tab's pet entries the filter lets through, one per entry,
// in the shop's screen order (ScreenOrder). Without the collection (nil), souls and levels are
// unknown. A bought entry stays (marked) even once its pet reaches a hidden
// level.
func Lines(items []game.ShopItem, pets map[int]game.Pet, filter Filter) []Line {
	var lines []Line
	for _, item := range ScreenOrder(items) {
		pet, ok := PetItems[item.Item]
		if !ok {
			continue
		}
		line := Line{Name: pet.Name, Icon: Icon(pet.Icon), Level: -1, Maps: pet.Maps, Bought: item.SoldOut}
		if pets != nil && pet.Pet > 0 {
			line.Level, line.Souls = pets[pet.Pet].Level, pets[pet.Pet].Souls
		}
		level := line.Level
		if line.Bought {
			level = -1
		}
		if !filter.shows(pet, level) {
			continue
		}
		lines = append(lines, line)
	}
	return lines
}

// EmptyText says why a tab selling pets shows none: every one is Lv3, or
// the filters leave none.
func EmptyText(items []game.ShopItem, pets map[int]game.Pet) string {
	for _, item := range items {
		pet, ok := PetItems[item.Item]
		if ok && (pets == nil || pet.Pet <= 0 || pets[pet.Pet].Level < 3) {
			return "No pet here matches your filters"
		}
	}
	return "Every pet here is Lv3"
}

// HasPets says whether the tab sells any pet.
func HasPets(items []game.ShopItem) bool {
	for _, item := range items {
		if _, ok := PetItems[item.Item]; ok {
			return true
		}
	}
	return false
}

// WithGains is the collection with souls gained since it was read added,
// levelling up as the game does. Without gains it is the collection itself.
func WithGains(pets map[int]game.Pet, gains map[int]int) map[int]game.Pet {
	if pets == nil || len(gains) == 0 {
		return pets
	}
	out := make(map[int]game.Pet, len(pets))
	for id, pet := range pets {
		out[id] = pet
	}
	for id, amount := range gains {
		out[id] = out[id].AddSouls(amount)
	}
	return out
}

// DefaultHideAfter is how long the panel stays after the last shop message
// unless set otherwise: the shop window is the client's own, so closing it
// sends the server nothing (two recordings, 2026-11-13). A zone change,
// login or switch closes it sooner.
const DefaultHideAfter = 30 * time.Second

// Watch follows the open shop tab.
type Watch struct {
	// How long the panel stays after the last shop message; 0 is
	// DefaultHideAfter.
	HideAfter time.Duration
	tab       int
	items     []game.ShopItem
	until     time.Time
}

func (w *Watch) hideAfter() time.Duration {
	if w.HideAfter <= 0 {
		return DefaultHideAfter
	}
	return w.HideAfter
}

// Tab is a tab opened: it replaces the last one.
func (w *Watch) Tab(tab game.ShopTab, now time.Time) {
	w.tab = tab.ID
	w.items = tab.Items
	w.until = now.Add(w.hideAfter())
}

// Bought marks the open tab's entry sold out (a purchase from another tab
// changes nothing shown) and keeps the panel up a while longer.
func (w *Watch) Bought(tab int, entry uint32, now time.Time) {
	if w.items == nil {
		return
	}
	w.until = now.Add(w.hideAfter())
	if tab != w.tab {
		return
	}
	items := slices.Clone(w.items)
	for k := range items {
		if items[k].Entry == entry {
			items[k].SoldOut = true
		}
	}
	w.items = items
}

// Close hides the panel at once.
func (w *Watch) Close() {
	w.items = nil
}

// Items is the open tab's items, or nil when no tab is open (or it timed
// out).
func (w *Watch) Items(now time.Time) []game.ShopItem {
	if w.items != nil && now.After(w.until) {
		w.items = nil
	}
	return w.items
}
