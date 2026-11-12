package main

import (
	"context"
	"os"
	"os/exec"
	"strings"
	"time"

	"daevanion-companion/internal/desktop"
	"daevanion-companion/internal/update"
)

// How often a running companion looks for a new version. At launch it
// looks at once and updates without asking.
const updateInterval = 6 * time.Hour

// A newer release, found at launch (installed without asking) or later
// (asked first).
type foundUpdate struct {
	release  update.Release
	atLaunch bool
}

// The answer to "update now?".
type updateAnswer struct {
	release update.Release
	yes     bool
}

// A downloaded (and checked) release, ready to swap in.
type readyUpdate struct {
	release update.Release
	path    string
	err     error
}

// watchForUpdates looks once at launch (again after a while if offline then:
// Windows starts it before the network is up), then every updateInterval.
func watchForUpdates(found chan<- foundUpdate) {
	if !update.IsRelease(version) {
		return
	}
	check := func(atLaunch bool) bool {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		release, ok, err := update.Latest(ctx, update.ReleasesURL)
		if err != nil {
			logf("Couldn't check for updates: %v", err)
			return false
		}
		if ok && update.Newer(version, release.Version) {
			found <- foundUpdate{release: release, atLaunch: atLaunch}
		}
		return true
	}
	go func() {
		if !check(true) {
			time.Sleep(2 * time.Minute)
			check(true)
		}
		for range time.Tick(updateInterval) {
			check(false)
		}
	}()
}

// askToUpdate asks on its own goroutine: the box waits for the user.
func askToUpdate(release update.Release, answers chan<- updateAnswer) {
	go func() {
		yes := desktop.Ask("Daevanion Companion update",
			"Daevanion Companion "+release.Version+" is out (you have "+version+").\n\nUpdate now? It restarts in a few seconds. Otherwise it updates the next time it starts.")
		answers <- updateAnswer{release: release, yes: yes}
	}()
}

// downloadUpdate fetches the release next to the running .exe (the swap is
// a rename, so it must be on the same drive).
func downloadUpdate(release update.Release, ready chan<- readyUpdate) {
	go func() {
		exe, err := os.Executable()
		if err != nil {
			ready <- readyUpdate{release: release, err: err}
			return
		}
		path := exe + ".new"
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		err = update.Download(ctx, release, path)
		ready <- readyUpdate{release: release, path: path, err: err}
	}()
}

// restartArgs are this run's arguments for the updated companion, plus
// which version it replaced (for its "Updated to" note).
func restartArgs(args []string, from string) []string {
	out := []string{}
	for i := 0; i < len(args); i++ {
		if args[i] == "-"+updatedFlag {
			i++
			continue
		}
		if strings.HasPrefix(args[i], "-"+updatedFlag+"=") {
			continue
		}
		out = append(out, args[i])
	}
	return append(out, "-"+updatedFlag, from)
}

const updatedFlag = "updated"

// restart starts the updated .exe; the caller exits right after.
func restart(exe string) error {
	desktop.ReleaseInstance()
	return exec.Command(exe, restartArgs(os.Args[1:], version)...).Start()
}
