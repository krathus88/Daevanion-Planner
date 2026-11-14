// Package souls keeps the pet soul popup's rows: the pets that gained souls
// lately, with their level and souls after the gain.
package souls

import (
	"slices"
	"time"

	"daevanion-companion/internal/game"
)

const (
	// Hold is how long a pet's row stays after its last gain.
	Hold = 4 * time.Second
	// MaxRows is how many pets show at once; a newer gain pushes the oldest
	// out.
	MaxRows = 4
)

// Row is one pet in the popup.
type Row struct {
	Pet int
	// Souls gained while the row has been up.
	Gained int
	// Its Insight level after the gains (0 locked), -1 when the collection
	// isn't known, and its souls toward the next level.
	Level int
	Souls int
	// The gains reached a new Insight level.
	LevelUp bool
	until   time.Time
}

// Feed is the popup's rows, oldest first.
type Feed struct {
	rows []Row
}

// Add is a soul gain. pets is the collection before it (nil when unknown:
// the row's level is then unknown too). The same pet again adds to its row,
// moves it last and keeps it up longer.
func (f *Feed) Add(gain game.SoulGain, pets map[int]game.Pet, now time.Time) {
	row := Row{Pet: gain.Pet, Level: -1}
	if k := slices.IndexFunc(f.rows, func(r Row) bool { return r.Pet == gain.Pet }); k >= 0 {
		row = f.rows[k]
		f.rows = slices.Delete(f.rows, k, k+1)
	}
	row.Gained += gain.Amount
	row.until = now.Add(Hold)
	if pets != nil {
		before := pets[gain.Pet]
		after := before.AddSouls(gain.Amount)
		row.Level, row.Souls = after.Level, after.Souls
		row.LevelUp = row.LevelUp || after.Level > before.Level
	}
	f.rows = append(f.rows, row)
	if len(f.rows) > MaxRows {
		f.rows = slices.Delete(f.rows, 0, len(f.rows)-MaxRows)
	}
}

// Rows is the rows still up at now, oldest first; nil when none is.
func (f *Feed) Rows(now time.Time) []Row {
	f.rows = slices.DeleteFunc(f.rows, func(r Row) bool { return !now.Before(r.until) })
	if len(f.rows) == 0 {
		f.rows = nil
	}
	return slices.Clone(f.rows)
}

// Clear takes every row down.
func (f *Feed) Clear() {
	f.rows = nil
}
