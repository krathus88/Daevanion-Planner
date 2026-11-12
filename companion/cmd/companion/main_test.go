package main

import (
	"testing"

	"daevanion-companion/internal/desktop"
	"daevanion-companion/internal/game"
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
