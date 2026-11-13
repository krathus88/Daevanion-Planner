// Package record writes the game's messages to a text log, for working out
// new message types without Wireshark.
package record

import (
	"bufio"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"

	"daevanion-companion/internal/game"
	"daevanion-companion/internal/wire"
)

// Noise is the high-volume traffic left out: the tick, movement, combat and
// buff streams.
var Noise = map[string]bool{
	"0036": true, "1d37": true, "1c37": true, "1b37": true, "1a37": true,
	"2937": true, "2a37": true, "2837": true, "2f37": true, "008d": true,
	"0438": true, "0238": true, "0638": true, "0538": true, "0138": true,
	"0338": true, "2b38": true, "2a38": true, "2c38": true, "3538": true,
	"3b38": true, "3d38": true, "4a36": true, "4136": true, "4236": true,
	"3436": true, "8456": true, "218d": true, "338a": true,
}

// Private types are logged without their body: the login message carries
// account details, and recordings get shared.
var Private = map[string]bool{
	game.TypeLogin: true,
}

// Labels names the types the companion already reads.
var Labels = map[string]string{
	game.TypeCharacter:        "character",
	game.TypeLogin:            "login",
	game.TypeSwitch:           "character switch",
	game.TypePets:             "pets",
	game.TypePetSouls:         "pet souls",
	game.TypeInventory:        "inventory",
	game.TypeInventoryChange:  "inventory change",
	game.TypeCounters:         "counters",
	game.TypeCounterChange:    "counter change",
	game.TypeSupply:           "supply requests",
	game.TypeSupplyDelivery:   "supply delivery",
	game.TypeCraftLimits:      "crafting limits",
	game.TypeCraftDone:        "craft done",
	game.TypeProfessionXP:     "proficiency xp",
	game.TypeProfessionLevel:  "proficiency level",
	game.TypeBoards:           "daevanion boards",
	game.TypeBoardNodeRemoved: "daevanion node removed",
	game.TypeBoardNodeAdded:   "daevanion node added",
	game.TypeDuty:             "duty board",
	game.TypeProgress:         "progress counters",
	game.TypeArena:            "arena stats",
	game.TypeShopTab:          "shop tab",
	game.TypeShopBuy:          "shop purchase",
	game.TypeZone:             "zone",
	game.TypeArtifacts:        "artifact owners",
	game.TypeArtifactsWorld:   "artifact owners",
}

// Recorder writes one line per message: time, type, size, connection and
// label, then the body in hex on the next line.
type Recorder struct {
	mu     sync.Mutex
	out    *bufio.Writer
	closer io.Closer
	// Messages written, for the status line.
	Count int
}

// New writes to w.
func New(w io.Writer) *Recorder {
	r := &Recorder{out: bufio.NewWriter(w)}
	if c, ok := w.(io.Closer); ok {
		r.closer = c
	}
	return r
}

// Create opens a new log. Given a folder, it names the file after now.
func Create(path string, now time.Time) (*Recorder, string, error) {
	if info, err := os.Stat(path); err == nil && info.IsDir() {
		path = filepath.Join(path, "session-"+now.Format("2006-01-02-150405")+".log")
	}
	file, err := os.Create(path)
	if err != nil {
		return nil, "", err
	}
	r := New(file)
	fmt.Fprintf(r.out, "# Daevanion Companion session, %s. Noise left out: tick, movement, combat.\n", now.Format(time.RFC3339))
	return r, path, nil
}

// Message logs one message unless it's noise.
func (r *Recorder) Message(conn string, m wire.Message, at time.Time) {
	kind := m.Type()
	if Noise[kind] {
		return
	}
	body := hex.EncodeToString(m.Body)
	if Private[kind] {
		body = "(left out)"
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	fmt.Fprintf(r.out, "%s  %s  %6dB  %s  %s\n    %s\n",
		at.Format("15:04:05.000"), kind, len(m.Body)+2, conn, Labels[kind], body)
	r.Count++
}

// Note adds a free line, like the companion's own status messages.
func (r *Recorder) Note(at time.Time, text string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	fmt.Fprintf(r.out, "%s  # %s\n", at.Format("15:04:05.000"), text)
}

// Flush writes what's buffered, so the file is readable while recording.
func (r *Recorder) Flush() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.out.Flush()
}

// Close flushes and closes the file.
func (r *Recorder) Close() error {
	if err := r.Flush(); err != nil {
		return err
	}
	if r.closer != nil {
		return r.closer.Close()
	}
	return nil
}
