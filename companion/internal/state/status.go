package state

import (
	"time"

	"daevanion-companion/internal/game"
)

// StatusKey is the synced row that tells the site the companion is running.
const StatusKey = "daevanion:companion:v1:status"

// StatusInterval is how often a running companion refreshes its status; the
// site counts it as running for a few intervals after the last one.
const StatusInterval = time.Minute

// Status is what the site reads to show the companion is running.
type Status struct {
	Version int  `json:"v"`
	Running bool `json:"running"`
	// When it was sent (ms).
	At int64 `json:"at"`
	// The companion's version.
	App string `json:"app"`
	// The character being played, once the game has named one.
	Character *SnapshotCharacter `json:"character"`
}

// NewStatus describes the companion now.
func NewStatus(running bool, app string, current *game.Character, now time.Time) Status {
	status := Status{Version: 1, Running: running, At: now.UnixMilli(), App: app}
	if current != nil {
		status.Character = &SnapshotCharacter{Name: current.Name, Server: current.Server, Class: current.Class}
	}
	return status
}
