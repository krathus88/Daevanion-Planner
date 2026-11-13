package main

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"time"

	"daevanion-companion/internal/desktop"
	"daevanion-companion/internal/shop"
)

func TestSettingsRoundTrip(t *testing.T) {
	path := filepath.Join(t.TempDir(), settingsFile)
	if got := readSettings(path); got.ShopHideSeconds != 30 {
		t.Fatalf("default: %+v", got)
	}
	if err := writeSettings(path, settings{ShopHideSeconds: 90}); err != nil {
		t.Fatal(err)
	}
	got := readSettings(path)
	if got.ShopHideSeconds != 90 || got.shopHideAfter() != 90*time.Second {
		t.Fatalf("got %+v", got)
	}
}

func TestSettingsFallBackToDefaults(t *testing.T) {
	dir := t.TempDir()
	for name, body := range map[string]string{
		"broken.json": "{",
		"range.json":  `{"shopHideSeconds": 1}`,
		"empty.json":  `{}`,
	} {
		path := filepath.Join(dir, name)
		os.WriteFile(path, []byte(body), 0o600)
		if got := readSettings(path); got.ShopHideSeconds != 30 {
			t.Errorf("%s: got %+v", name, got)
		}
	}
}

func TestChangeSetting(t *testing.T) {
	s := defaultSettings()
	if !reflect.DeepEqual(s.shopFilter(), shop.DefaultFilter()) || s.OverlayOpacity != 0 {
		t.Fatalf("defaults %+v", s)
	}
	changeSetting(&s, desktop.Choice{Command: desktop.CommandOverlayOpacity, Value: 40})
	changeSetting(&s, desktop.Choice{Command: desktop.CommandShopType, Value: 2})
	changeSetting(&s, desktop.Choice{Command: desktop.CommandShopType, Value: 1})
	changeSetting(&s, desktop.Choice{Command: desktop.CommandShopLevel, Value: 1})
	changeSetting(&s, desktop.Choice{Command: desktop.CommandShopLevel, Value: 3})
	changeSetting(&s, desktop.Choice{Command: desktop.CommandShopSource, Value: 3})
	changeSetting(&s, desktop.Choice{Command: desktop.CommandShopSource, Value: 0})
	want := shop.Filter{Types: []string{"cogni", "fera"}, HiddenLevels: []int{1}, Sources: []string{"notWild", "altgard"}}
	if s.OverlayOpacity != 40 || !reflect.DeepEqual(s.shopFilter(), want) {
		t.Fatalf("got %+v", s)
	}
	// A type picked again comes off.
	changeSetting(&s, desktop.Choice{Command: desktop.CommandShopType, Value: 1})
	if !reflect.DeepEqual(s.ShopTypes, []string{"fera"}) {
		t.Fatalf("got %v", s.ShopTypes)
	}
	changeSetting(&s, desktop.Choice{Command: desktop.CommandShopType, Value: 0})
	if s.ShopTypes != nil {
		t.Fatal("All didn't clear the types")
	}
	// Every type picked is All.
	for k := range shop.Types {
		changeSetting(&s, desktop.Choice{Command: desktop.CommandShopType, Value: k + 1})
	}
	if s.ShopTypes != nil {
		t.Fatalf("every type: %v", s.ShopTypes)
	}
}

// Showing every level is saved as such, not read back as the default.
func TestSettingsKeepEmptyFilters(t *testing.T) {
	path := filepath.Join(t.TempDir(), settingsFile)
	s := defaultSettings()
	changeSetting(&s, desktop.Choice{Command: desktop.CommandShopLevel, Value: 3})
	if err := writeSettings(path, s); err != nil {
		t.Fatal(err)
	}
	if got := readSettings(path); len(got.ShopHiddenLevels) != 0 {
		t.Fatalf("got %+v", got)
	}
	os.WriteFile(path, []byte(`{"overlayOpacity": 140, "shopTypes": ["dragon", "natura"], "shopHiddenLevels": [3, 9], "shopSources": ["moon", "several"]}`), 0o600)
	got := readSettings(path)
	if got.OverlayOpacity != 0 || !reflect.DeepEqual(got.ShopTypes, []string{"natura"}) || !reflect.DeepEqual(got.ShopHiddenLevels, []int{3}) || !reflect.DeepEqual(got.ShopSources, []string{"several"}) {
		t.Fatalf("got %+v", got)
	}
}
