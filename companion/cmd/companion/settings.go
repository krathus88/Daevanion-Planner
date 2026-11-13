package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"time"

	"daevanion-companion/internal/desktop"
	"daevanion-companion/internal/shop"
)

// settings are what the settings window changes, saved as settings.json in
// the data folder.
type settings struct {
	// How long the shop panel stays after the last shop message.
	ShopHideSeconds int `json:"shopHideSeconds"`
	// The overlays' background opacity, in percent.
	OverlayOpacity int `json:"overlayOpacity"`
	// The shop panel's filters (shop.Filter).
	ShopTypes        []string `json:"shopTypes"`
	ShopHiddenLevels []int    `json:"shopHiddenLevels"`
	ShopSources      []string `json:"shopSources"`
}

const settingsFile = "settings.json"

func defaultSettings() settings {
	filter := shop.DefaultFilter()
	return settings{
		ShopHideSeconds:  int(shop.DefaultHideAfter / time.Second),
		OverlayOpacity:   desktop.DefaultOverlayOpacity,
		ShopTypes:        filter.Types,
		ShopHiddenLevels: filter.HiddenLevels,
		ShopSources:      filter.Sources,
	}
}

// clean puts values out of range (an edited file) back to their default and
// drops unknown filter values.
func (s settings) clean() settings {
	defaults := defaultSettings()
	if s.ShopHideSeconds < desktop.MinShopHideSeconds || s.ShopHideSeconds > desktop.MaxShopHideSeconds {
		s.ShopHideSeconds = defaults.ShopHideSeconds
	}
	if s.OverlayOpacity < 0 || s.OverlayOpacity > 100 {
		s.OverlayOpacity = defaults.OverlayOpacity
	}
	s.ShopTypes = slices.DeleteFunc(slices.Clone(s.ShopTypes), func(id string) bool {
		return !slices.Contains(shop.Types, id)
	})
	// Every type picked is all of them: All lights up instead.
	if len(s.ShopTypes) == len(shop.Types) {
		s.ShopTypes = nil
	}
	s.ShopHiddenLevels = slices.DeleteFunc(slices.Clone(s.ShopHiddenLevels), func(level int) bool {
		return level < 1 || level > 3
	})
	s.ShopSources = slices.DeleteFunc(slices.Clone(s.ShopSources), func(source string) bool {
		return !slices.Contains(shop.Sources, source)
	})
	return s
}

func (s settings) shopHideAfter() time.Duration {
	return time.Duration(s.ShopHideSeconds) * time.Second
}

func (s settings) shopFilter() shop.Filter {
	return shop.Filter{Types: s.ShopTypes, HiddenLevels: s.ShopHiddenLevels, Sources: s.ShopSources}
}

// toggled is list with value added, or taken out when it was in, kept in
// the order of all.
func toggled[T comparable](list []T, value T, all []T) []T {
	on := !slices.Contains(list, value)
	var out []T
	for _, v := range all {
		if v == value && on || v != value && slices.Contains(list, v) {
			out = append(out, v)
		}
	}
	return out
}

// loadSettings reads the saved settings; missing or broken, the defaults.
func loadSettings() settings {
	dir, err := desktop.DataDir()
	if err != nil {
		return defaultSettings()
	}
	return readSettings(filepath.Join(dir, settingsFile))
}

func readSettings(path string) settings {
	s := defaultSettings()
	data, err := os.ReadFile(path)
	if err != nil {
		return s
	}
	if err := json.Unmarshal(data, &s); err != nil {
		return defaultSettings()
	}
	return s.clean()
}

func saveSettings(s settings) error {
	dir, err := desktop.DataDir()
	if err != nil {
		return err
	}
	return writeSettings(filepath.Join(dir, settingsFile), s)
}

func writeSettings(path string, s settings) error {
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o600)
}

// changeSetting applies a settings window choice.
func changeSetting(s *settings, choice desktop.Choice) {
	switch choice.Command {
	case desktop.CommandShopHide:
		s.ShopHideSeconds = choice.Value
	case desktop.CommandOverlayOpacity:
		s.OverlayOpacity = choice.Value
	case desktop.CommandShopType:
		// 0 is All, which clears the others; a type adds to them or comes off.
		switch {
		case choice.Value == 0:
			s.ShopTypes = nil
		case choice.Value <= len(shop.Types):
			s.ShopTypes = toggled(s.ShopTypes, shop.Types[choice.Value-1], shop.Types)
		}
	case desktop.CommandShopLevel:
		s.ShopHiddenLevels = toggled(s.ShopHiddenLevels, choice.Value, []int{1, 2, 3})
	case desktop.CommandShopSource:
		if choice.Value >= 0 && choice.Value < len(shop.Sources) {
			s.ShopSources = toggled(s.ShopSources, shop.Sources[choice.Value], shop.Sources)
		}
	}
	*s = s.clean()
}
