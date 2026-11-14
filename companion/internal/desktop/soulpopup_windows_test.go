package desktop

import "testing"

func TestSoulLines(t *testing.T) {
	for _, c := range []struct {
		pet                              SoulPet
		level, progress, gained, reached string
	}{
		{SoulPet{Gained: 1, Level: 1, Souls: 12}, "Lv1", "12/25", "+1 soul", ""},
		{SoulPet{Gained: 3, Level: 2, Souls: 1, LevelUp: true}, "Lv2", "1/75", "+3 souls", "Lv2 reached"},
		{SoulPet{Gained: 2, Level: 3, LevelUp: true}, "Lv3", "", "+2 souls", "Lv3 reached"},
		{SoulPet{Gained: 1, Level: -1}, "", "", "+1 soul", ""},
	} {
		level, _, progress, gained, reached := soulLines(c.pet)
		if level != c.level || progress != c.progress || gained != c.gained || reached != c.reached {
			t.Errorf("%+v: got %q %q %q %q", c.pet, level, progress, gained, reached)
		}
	}
}
