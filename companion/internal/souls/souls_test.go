package souls

import (
	"testing"
	"time"

	"daevanion-companion/internal/game"
)

func TestFeedAddsAndLevelsUp(t *testing.T) {
	var f Feed
	now := time.Unix(1000, 0)
	pets := map[int]game.Pet{1163: {Level: 1, Souls: 23}}
	f.Add(game.SoulGain{Pet: 1163, Amount: 1}, pets, now)
	rows := f.Rows(now)
	if len(rows) != 1 || rows[0].Gained != 1 || rows[0].Level != 1 || rows[0].Souls != 24 || rows[0].LevelUp {
		t.Fatalf("first gain: %+v", rows)
	}
	// The tracker has added the first gain by the second.
	pets[1163] = game.Pet{Level: 1, Souls: 24}
	f.Add(game.SoulGain{Pet: 1163, Amount: 2}, pets, now.Add(time.Second))
	rows = f.Rows(now.Add(time.Second))
	if len(rows) != 1 || rows[0].Gained != 3 || rows[0].Level != 2 || rows[0].Souls != 1 || !rows[0].LevelUp {
		t.Fatalf("second gain: %+v", rows)
	}
}

func TestFeedUnknownCollection(t *testing.T) {
	var f Feed
	now := time.Unix(1000, 0)
	f.Add(game.SoulGain{Pet: 1163, Amount: 1}, nil, now)
	if rows := f.Rows(now); len(rows) != 1 || rows[0].Level != -1 || rows[0].LevelUp {
		t.Fatalf("got %+v", rows)
	}
	// A pet missing from a known collection is locked with no souls.
	f.Add(game.SoulGain{Pet: 1089, Amount: 5}, map[int]game.Pet{}, now)
	if rows := f.Rows(now); rows[1].Level != 1 || rows[1].Souls != 0 || !rows[1].LevelUp {
		t.Fatalf("got %+v", rows)
	}
}

func TestFeedExpiresAndKeepsNewest(t *testing.T) {
	var f Feed
	now := time.Unix(1000, 0)
	for pet := 1; pet <= MaxRows+1; pet++ {
		f.Add(game.SoulGain{Pet: pet, Amount: 1}, nil, now.Add(time.Duration(pet)*time.Millisecond))
	}
	rows := f.Rows(now)
	if len(rows) != MaxRows || rows[0].Pet != 2 || rows[MaxRows-1].Pet != MaxRows+1 {
		t.Fatalf("got %+v", rows)
	}
	// A pet again moves last and stays longer.
	f.Add(game.SoulGain{Pet: 2, Amount: 1}, nil, now.Add(time.Second))
	rows = f.Rows(now.Add(Hold + 10*time.Millisecond))
	if len(rows) != 1 || rows[0].Pet != 2 || rows[0].Gained != 2 {
		t.Fatalf("after hold: %+v", rows)
	}
	if rows := f.Rows(now.Add(time.Second + Hold)); rows != nil {
		t.Fatalf("all expired: %+v", rows)
	}
	f.Add(game.SoulGain{Pet: 3, Amount: 1}, nil, now)
	f.Clear()
	if rows := f.Rows(now); rows != nil {
		t.Fatalf("cleared: %+v", rows)
	}
}
