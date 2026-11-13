package desktop

import "testing"

func TestLevelText(t *testing.T) {
	for _, c := range []struct {
		level, souls    int
		label, progress string
	}{
		{-1, 0, "?", ""},
		{0, 0, "Locked", ""},
		{0, 3, "Locked", "3/5"},
		{1, 12, "Lv1", "12/25"},
		{2, 49, "Lv2", "49/75"},
		{3, 0, "Lv3", ""},
	} {
		label, color, progress := levelText(c.level, c.souls)
		if label != c.label || progress != c.progress || color == 0 {
			t.Errorf("%d %d: got %q %q %x", c.level, c.souls, label, progress, color)
		}
	}
}
