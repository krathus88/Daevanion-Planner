// Command companion runs beside AION 2, reads what the game server sends
// (read-only, through Npcap) and uploads each character's pets, items,
// entries and supply requests to the user's Daevanion Planner account.
//
// It lives in the notification area (tray): right-click the icon to log in
// or out, choose whether it starts with Windows, open its log or exit.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"sync"
	"syscall"
	"time"

	"daevanion-companion/internal/account"
	"daevanion-companion/internal/capture"
	"daevanion-companion/internal/desktop"
	"daevanion-companion/internal/game"
	"daevanion-companion/internal/netio"
	"daevanion-companion/internal/pipeline"
	"daevanion-companion/internal/record"
	"daevanion-companion/internal/shop"
	"daevanion-companion/internal/state"
	"daevanion-companion/internal/update"
	"daevanion-companion/internal/wire"
)

// version is set at build time.
var version = "dev"

const (
	// Snapshots wait for the game to settle (a login sends everything in a
	// few seconds), but never longer than maxWait.
	quietTime = 3 * time.Second
	maxWait   = 15 * time.Second
	// KeyPrefix names the synced rows the site reads.
	KeyPrefix = "daevanion:game:v1:"
	// Set once the companion has added itself to Windows startup, so turning
	// that off in its menu sticks.
	startupMarker = "startup-set"
)

// The console (when run from a terminal) and the log file. A build without a
// console (-H windowsgui) writes only the file.
var logOut io.Writer = os.Stdout

func logf(format string, args ...any) {
	fmt.Fprintf(logOut, "%s  %s\n", time.Now().Format("15:04:05"), fmt.Sprintf(format, args...))
}

func fail(format string, args ...any) {
	text := fmt.Sprintf(format, args...)
	logf("%s", text)
	desktop.ShowError(text)
	os.Exit(1)
}

func openBrowser(link string) error {
	return exec.Command("rundll32", "url.dll,FileProtocolHandler", link).Start()
}

// app is what the tray menu shows, shared between its thread and the main
// loop.
type app struct {
	mu        sync.Mutex
	offline   bool
	account   string
	loggedIn  bool
	loggingIn bool
	playing   string
	recording bool
	// A check for updates the user asked for is under way.
	checkingUpdates bool
	// The settings saved in the data folder (settings.go).
	settings settings
}

func (a *app) status() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	switch {
	case a.offline:
		return "Offline test: nothing is sent"
	case a.loggingIn:
		return "Logging in: finish in your browser"
	case !a.loggedIn:
		return "Not logged in: nothing is sent"
	case a.recording && a.playing != "":
		return "Playing " + a.playing + " · recording"
	case a.recording:
		return "Waiting for AION 2 · recording"
	case a.playing != "":
		return "Playing " + a.playing
	default:
		return "Waiting for AION 2"
	}
}

func (a *app) state() desktop.State {
	status := a.status()
	a.mu.Lock()
	defer a.mu.Unlock()
	return desktop.State{
		Status:           status,
		Playing:          a.playing != "",
		LoggedIn:         a.loggedIn,
		LoggingIn:        a.loggingIn,
		CanLogIn:         !a.offline,
		Account:          a.account,
		ShopHideSeconds:  a.settings.ShopHideSeconds,
		OverlayOpacity:   a.settings.OverlayOpacity,
		ShopTypes:        a.settings.ShopTypes,
		ShopHiddenLevels: a.settings.ShopHiddenLevels,
		ShopSources:      a.settings.ShopSources,
		Startup:          desktop.StartsWithWindows(),
		StartupAvailable: desktop.CanStartWithWindows(),
		Recording:        a.recording,
		Version:          version,
		CanUpdate:        update.IsRelease(version),
		CheckingUpdates:  a.checkingUpdates,
	}
}

type loginResult struct {
	session account.Session
	err     error
}

func main() {
	logout := flag.Bool("logout", false, "forget the saved login and exit")
	offline := flag.Bool("offline", false, "read the game but upload nothing")
	recordTo := flag.String("record", "", "also write the game's messages to this log file (or a new file in this folder)")
	// Windows passes it (the Run entry); nothing differs since the hello
	// notification went.
	flag.Bool(strings.TrimPrefix(desktop.StartupFlag, "-"), false, "started with Windows")
	updatedFrom := flag.String(updatedFlag, "", "set by an update: the version it replaced")
	flag.Parse()

	if *logout {
		if err := account.ForgetSession(); err != nil {
			fail("Couldn't log out: %v", err)
		}
		fmt.Println("Logged out on this PC.")
		return
	}

	if !desktop.FirstInstance() {
		desktop.ShowInfo("Daevanion Companion is already running: its icon is in the notification area, by the clock.")
		return
	}

	logPath := openLog()
	logf("Daevanion Companion %s", version)
	if *updatedFrom != "" {
		logf("Updated from %s.", *updatedFrom)
	}
	if exe, err := os.Executable(); err == nil {
		go update.CleanUp(exe)
	}
	setUpStartup()

	devices, err := capture.Devices()
	if errors.Is(err, capture.ErrNoNpcap) {
		fail("Npcap isn't installed. Install it from https://npcap.com (the same one NotMeter uses), then start Daevanion Companion again.")
	}
	if err != nil {
		fail("Couldn't list network adapters: %v", err)
	}

	state0 := &app{offline: *offline, settings: loadSettings()}
	var up *uploader
	if !*offline {
		up = newUploader()
		go up.run()
		if session, ok := savedLogin(); ok {
			up.login(session)
			state0.loggedIn = true
			state0.account = nameOf(session)
		}
	}

	commands := make(chan desktop.Choice, 8)
	tray, err := desktop.NewTray("Daevanion Companion", state0.state, func(c desktop.Choice) {
		select {
		case commands <- c:
		default:
		}
	})
	if err != nil {
		fail("Couldn't add the notification area icon: %v", err)
	}
	defer tray.Close()
	if desktop.WidgetError != nil {
		logf("Couldn't make the connection widget: %v", desktop.WidgetError)
	}
	tray.SetOverlayOpacity(state0.settings.OverlayOpacity)
	tray.SetShopPreview(shopSample())
	// The tray tip and the settings window, after the state changed.
	updateTip := func() {
		tray.SetTip("Daevanion Companion: " + state0.status())
		tray.Refresh()
	}
	updateTip()
	if up != nil && !state0.loggedIn {
		go askToLogIn(commands)
	}

	packets := make(chan netio.Packet, 8192)
	opened := 0
	for _, device := range devices {
		handle, err := capture.Open(device, pipeline.CaptureFilter)
		if err != nil {
			continue
		}
		opened++
		go read(handle, packets)
	}
	if opened == 0 {
		fail("Couldn't open any network adapter. If Npcap was installed with \"Restrict Npcap driver's access to Administrators only\", reinstall it without that option.")
	}
	logf("Watching %d network adapter(s). Items and entries load when you log in or switch character.", opened)

	tracker := state.NewTracker()
	tracker.Log = logf
	p := pipeline.New(tracker)

	// Recording: from -record, or the menu's "Record game data" (into
	// recordings/ in the data folder, for players to send).
	var recorder *record.Recorder
	recordingPath := ""
	tracker.Log = func(format string, args ...any) {
		logf(format, args...)
		if recorder != nil {
			recorder.Note(time.Now(), fmt.Sprintf(format, args...))
		}
	}
	startRecording := func(to string) error {
		r, path, err := record.Create(to, time.Now())
		if err != nil {
			return err
		}
		recorder, recordingPath = r, path
		state0.mu.Lock()
		state0.recording = true
		state0.mu.Unlock()
		logf("Recording the game's messages to %s", path)
		return nil
	}
	stopRecording := func() {
		if recorder == nil {
			return
		}
		recorder.Close()
		logf("Recorded %d messages to %s", recorder.Count, recordingPath)
		recorder = nil
		state0.mu.Lock()
		state0.recording = false
		state0.mu.Unlock()
	}
	if *recordTo != "" {
		if err := startRecording(*recordTo); err != nil {
			fail("Couldn't start the recording: %v", err)
		}
	}

	// The shop panel: pets on sale in the open shop tab that still need
	// souls. It follows the shop's messages, and the souls right after each
	// batch of packets that changed them (shopSouls), so a pet bought in one
	// tab shows its new souls in the next.
	shopWatch := shop.Watch{HideAfter: state0.settings.shopHideAfter()}
	var shownShop *desktop.ShopView
	shopSouls := false
	updateShop := func(now time.Time) {
		items := shopWatch.Items(now)
		var pets map[int]game.Pet
		if items != nil {
			pets = tracker.Pets()
			// Started mid-session: the account's copy, plus what was
			// bought since.
			if pets == nil && up != nil {
				pets = shop.WithGains(up.accountPets(), tracker.LateGains())
			}
		}
		next := shopPets(items, pets, state0.settings.shopFilter())
		if !reflect.DeepEqual(next, shownShop) {
			tray.ShowShopPets(next)
			shownShop = next
		}
	}
	p.OnMessage = func(conn string, m wire.Message, at time.Time) {
		if recorder != nil {
			recorder.Message(conn, m, at)
		}
		switch m.Type() {
		case game.TypeShopTab:
			tab, ok := game.ParseShopTab(m.Body)
			if !ok {
				logf("Couldn't read a shop tab (%d bytes)", len(m.Body))
				return
			}
			shopWatch.Tab(tab, time.Now())
			updateShop(time.Now())
		case game.TypeShopBuy:
			if tab, entry, ok := game.ParseShopBuy(m.Body); ok {
				shopWatch.Bought(tab, entry, time.Now())
				// Shown with the souls it gave, after this batch.
				shopSouls = true
			}
		case game.TypePets, game.TypePetSouls:
			shopSouls = true
		case game.TypeCharacter, game.TypeLogin, game.TypeSwitch:
			// A zone change, login or switch: no shop stays open through it.
			shopWatch.Close()
			updateShop(time.Now())
		}
	}

	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	waiting := map[string]state.Snapshot{}
	var firstChange, lastChange time.Time
	status := time.Now()
	logins := make(chan loginResult, 1)

	// Ctrl+C in a terminal, or Windows ending the session.
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	var statusAt time.Time
	statusOf := ""
	// The widget: game traffic seen lately, and what it says. An update's
	// notes take it over for a while (holdUntil), or all along (updating).
	var lastPacket, holdUntil time.Time
	updating := false
	shownConnection := ""
	showConnection := func(now time.Time) {
		if updating || now.Before(holdUntil) {
			return
		}
		connected := !lastPacket.IsZero() && now.Sub(lastPacket) < gameQuietTime
		widgetState, text := connectionText(connected, tracker.Current())
		if text != shownConnection {
			tray.ShowWidget(widgetState, text)
			shownConnection = text
		}
	}
	// Shows text in the widget for a while, then the connection again.
	showNote := func(widgetState desktop.WidgetState, text string, now time.Time) {
		tray.ShowWidget(widgetState, text)
		holdUntil = now.Add(5 * time.Second)
		// Matches no connection text (not even the hidden one, ""), so the
		// connection replaces the note once it's held long enough.
		shownConnection = "\x00"
	}
	if *updatedFrom != "" {
		showNote(desktop.WidgetDone, "Updated to "+version, time.Now())
	}

	updatesFound := make(chan foundUpdate, 1)
	answers := make(chan updateAnswer, 1)
	ready := make(chan readyUpdate, 1)
	asking := false
	declined := ""
	beginUpdate := func(release update.Release) {
		updating = true
		logf("Updating to %s...", release.Version)
		tray.ShowWidget(desktop.WidgetBusy, "Updating to "+release.Version+"…")
		downloadUpdate(release, ready)
	}
	checked := make(chan checkResult, 1)
	watchForUpdates(updatesFound)
	// No call yet: the first tick, a second in, knows whether the game is
	// already running, so "Not connected" doesn't flash before "Connected".

	quit := func() {
		if up != nil {
			up.finish(waiting, state.NewStatus(false, version, tracker.Current(), time.Now()))
		}
		stopRecording()
		logf("Closed.")
	}

	for {
		select {
		case <-stop:
			quit()
			return

		case choice := <-commands:
			switch choice.Command {
			case desktop.CommandExit:
				quit()
				return
			case desktop.CommandOpenLog:
				desktop.Open(logPath)
			case desktop.CommandRecord:
				if recorder != nil {
					stopRecording()
					showNote(desktop.WidgetDone, "Recording saved", time.Now())
					desktop.Open(filepath.Dir(recordingPath))
				} else if dir, err := recordingsDir(); err != nil {
					logf("Couldn't make the recordings folder: %v", err)
				} else if err := startRecording(dir); err != nil {
					logf("Couldn't start the recording: %v", err)
				} else {
					showNote(desktop.WidgetBusy, "Recording game data", time.Now())
				}
				updateTip()
			case desktop.CommandCheckUpdates:
				// Test builds never update: the button is off there.
				state0.mu.Lock()
				start := !state0.checkingUpdates && update.IsRelease(version)
				if start {
					state0.checkingUpdates = true
				}
				state0.mu.Unlock()
				if start {
					updateTip()
					checkForUpdate(checked)
				}
			case desktop.CommandOpenRecordings:
				if dir, err := recordingsDir(); err == nil {
					desktop.Open(dir)
				}
			case desktop.CommandShopHide, desktop.CommandOverlayOpacity, desktop.CommandShopType, desktop.CommandShopLevel, desktop.CommandShopSource:
				state0.mu.Lock()
				changeSetting(&state0.settings, choice)
				saved := state0.settings
				state0.mu.Unlock()
				shopWatch.HideAfter = saved.shopHideAfter()
				tray.SetOverlayOpacity(saved.OverlayOpacity)
				if err := saveSettings(saved); err != nil {
					logf("Couldn't save the settings: %v", err)
				}
				updateTip()
				updateShop(time.Now())
			case desktop.CommandStartup:
				on := !desktop.StartsWithWindows()
				if err := desktop.SetStartWithWindows(on); err != nil {
					logf("Couldn't change starting with Windows: %v", err)
				} else {
					logf("Start with Windows: %v", on)
				}
				updateTip()
			case desktop.CommandLogIn:
				state0.mu.Lock()
				busy := up == nil || state0.loggedIn || state0.loggingIn
				if !busy {
					state0.loggingIn = true
				}
				state0.mu.Unlock()
				if busy {
					break
				}
				updateTip()
				logf("Opening Discord login in your browser...")
				go func() {
					ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
					defer cancel()
					session, err := account.Login(ctx, openBrowser)
					logins <- loginResult{session: session, err: err}
				}()
			case desktop.CommandLogOut:
				if up == nil {
					break
				}
				up.finish(waiting, state.NewStatus(false, version, tracker.Current(), time.Now()))
				waiting = map[string]state.Snapshot{}
				up.logout()
				if err := account.ForgetSession(); err != nil {
					logf("Couldn't forget the login: %v", err)
				}
				state0.mu.Lock()
				state0.loggedIn = false
				state0.account = ""
				state0.mu.Unlock()
				statusOf = ""
				logf("Logged out.")
				updateTip()
			}

		case found := <-updatesFound:
			switch {
			case updating || asking || found.release.Version == declined:
			case found.atLaunch:
				beginUpdate(found.release)
			default:
				asking = true
				askToUpdate(found.release, answers)
			}

		case result := <-checked:
			state0.mu.Lock()
			state0.checkingUpdates = false
			state0.mu.Unlock()
			updateTip()
			switch {
			case result.err != nil:
				logf("Couldn't check for updates: %v", result.err)
				showNote(desktop.WidgetWaiting, "Couldn't check for updates", time.Now())
			case !result.newer:
				showNote(desktop.WidgetDone, "Up to date ("+version+")", time.Now())
			case !updating && !asking:
				// Asked for: asks again even after a No.
				asking = true
				askToUpdate(result.release, answers)
			}

		case answer := <-answers:
			asking = false
			if !answer.yes {
				declined = answer.release.Version
				logf("Update to %s put off until the next start.", answer.release.Version)
				break
			}
			if !updating {
				beginUpdate(answer.release)
			}

		case done := <-ready:
			exe, err := os.Executable()
			if err == nil {
				err = done.err
			}
			if err == nil {
				err = update.Install(done.path, exe)
			}
			if err != nil {
				os.Remove(done.path)
				logf("Couldn't update to %s: %v", done.release.Version, err)
				updating = false
				showNote(desktop.WidgetWaiting, "Couldn't update: see the log", time.Now())
				break
			}
			logf("Updated to %s: restarting.", done.release.Version)
			quit()
			if err := restart(exe); err != nil {
				desktop.ShowError("Daevanion Companion was updated but couldn't restart: start it again.")
			}
			return

		case result := <-logins:
			state0.mu.Lock()
			state0.loggingIn = false
			state0.mu.Unlock()
			if result.err != nil {
				text := fmt.Sprintf("Login failed: %v", result.err)
				if errors.Is(result.err, account.ErrNotMember) {
					text = "This Discord account isn't on the Daevanion Planner members list, so the companion can't send data for it."
				}
				logf("%s", text)
				note := "Login failed: see the log"
				if errors.Is(result.err, account.ErrNotMember) {
					note = "Not logged in: not on the members list"
				}
				showNote(desktop.WidgetWaiting, note, time.Now())
				updateTip()
				break
			}
			if err := account.SaveSession(result.session); err != nil {
				logf("Couldn't save the login (you'll log in again next time): %v", err)
			}
			up.login(result.session)
			state0.mu.Lock()
			state0.loggedIn = true
			state0.account = nameOf(result.session)
			state0.mu.Unlock()
			logf("Logged in as %s.", nameOf(result.session))
			showNote(desktop.WidgetDone, "Logged in as "+nameOf(result.session), time.Now())
			// Everything read so far, and the status at once.
			all := map[string]state.Snapshot{}
			for _, snapshot := range tracker.All() {
				all[snapshotKey(snapshot)] = snapshot
			}
			up.send(all)
			statusOf = "-"
			updateTip()

		case packet := <-packets:
			p.Packet(packet)
			if shopSouls {
				shopSouls = false
				updateShop(time.Now())
			}
			// The next tick shows it.
			lastPacket = time.Now()

		case now := <-ticker.C:
			if recorder != nil {
				recorder.Flush()
			}
			showConnection(now)
			updateShop(now)
			current := tracker.Current()
			name := ""
			if current != nil {
				name = fmt.Sprintf("%d:%s", current.Server, current.Name)
			}
			if name != statusOf || now.Sub(statusAt) >= state.StatusInterval {
				if current != nil {
					state0.mu.Lock()
					state0.playing = current.Name
					state0.mu.Unlock()
					updateTip()
				}
				if up != nil {
					up.sendStatus(state.NewStatus(true, version, current, now))
				}
				statusOf = name
				statusAt = now
			}
			for _, snapshot := range tracker.TakeChanged() {
				if len(waiting) == 0 {
					firstChange = now
				}
				waiting[snapshotKey(snapshot)] = snapshot
				lastChange = now
			}
			if len(waiting) > 0 && (now.Sub(lastChange) >= quietTime || now.Sub(firstChange) >= maxWait) {
				describe(waiting)
				if up != nil {
					up.send(waiting)
				}
				waiting = map[string]state.Snapshot{}
			}
			if now.Sub(status) >= 10*time.Minute {
				logf("Still watching (%d game messages so far).", p.Messages)
				status = now
			}
		}
	}
}

// While playing, the game server sends something every 50 ms: this long
// without anything means the game is closed (or the connection lost).
const gameQuietTime = 15 * time.Second

// connectionText is what the connection widget says: nothing without the
// game; while the game runs but no character is known (nothing can be read
// yet) it stays up; a known character shows for a moment and fades.
func connectionText(connected bool, playing *game.Character) (desktop.WidgetState, string) {
	switch {
	case !connected:
		return desktop.WidgetHidden, ""
	case playing != nil:
		return desktop.WidgetDone, "Connected · playing " + playing.Name
	default:
		// Started mid-session: characters come at login, a character switch
		// or a zone change.
		return desktop.WidgetWaiting, "Connected to AION 2 · waiting for your character"
	}
}

// shopPets is what the shop panel shows for the open tab's items: nil
// (hidden) when no tab selling pets is open, else the pets the filter lets
// through, or why none.
func shopPets(items []game.ShopItem, pets map[int]game.Pet, filter shop.Filter) *desktop.ShopView {
	if !shop.HasPets(items) {
		return nil
	}
	view := &desktop.ShopView{Pets: []desktop.ShopPet{}}
	for _, line := range shop.Lines(items, pets, filter) {
		view.Pets = append(view.Pets, desktop.ShopPet{Name: line.Name, Icon: line.Icon, Level: line.Level, Souls: line.Souls, Maps: line.Maps, Bought: line.Bought})
	}
	if len(view.Pets) == 0 {
		view.Empty = shop.EmptyText(items, pets)
	}
	return view
}

// shopSample is what the opacity preview shows in the shop panel: four pets
// from a Pets tab, one each of most kinds of line.
func shopSample() *desktop.ShopView {
	items := []game.ShopItem{{Item: 534760134}, {Item: 534760088}, {Item: 534760078}, {Item: 534760143}}
	pets := map[int]game.Pet{1163: {Level: 1}, 1089: {Level: 1, Souls: 12}}
	return shopPets(items, pets, shop.Filter{})
}

func snapshotKey(s state.Snapshot) string {
	return fmt.Sprintf("%s%d:%s", KeyPrefix, s.Character.Server, s.Character.Name)
}

// recordingsDir is where the menu's recordings go, made when missing.
func recordingsDir() (string, error) {
	dir, err := desktop.DataDir()
	if err != nil {
		return "", err
	}
	dir = filepath.Join(dir, "recordings")
	return dir, os.MkdirAll(dir, 0o700)
}

// openLog starts this run's log file (the last run's is replaced) and
// returns its path.
func openLog() string {
	dir, err := desktop.DataDir()
	if err != nil {
		return ""
	}
	path := filepath.Join(dir, "companion.log")
	file, err := os.Create(path)
	if err != nil {
		return ""
	}
	// The file first: a windowless build has no console, and MultiWriter
	// stops at the first writer that fails.
	logOut = io.MultiWriter(file, os.Stdout)
	return path
}

// setUpStartup adds the companion to Windows startup the first time it runs
// as an .exe, and keeps the entry's path current. Turning it off in the menu
// or disabling it in Task Manager is left alone.
func setUpStartup() {
	if !desktop.CanStartWithWindows() {
		return
	}
	dir, err := desktop.DataDir()
	if err != nil {
		return
	}
	marker := filepath.Join(dir, startupMarker)
	if _, err := os.Stat(marker); err != nil {
		if err := desktop.SetStartWithWindows(true); err != nil {
			logf("Couldn't add the companion to Windows startup: %v", err)
			return
		}
		os.WriteFile(marker, nil, 0o600)
		logf("Added to Windows startup (Task Manager > Startup apps can turn it off).")
		return
	}
	if desktop.StartsWithWindows() {
		desktop.SetStartWithWindows(true)
	}
}

// askToLogIn offers the Discord login at launch when there's no saved one,
// so it needn't be found in the tray menu. Yes works like the menu's Log in.
func askToLogIn(commands chan<- desktop.Choice) {
	logIn := desktop.Ask("Daevanion Companion", "Log in with Discord so the companion can send your game data to Daevanion Planner?\n\nYou can also log in later from its icon in the notification area, by the clock.")
	if logIn {
		commands <- desktop.Choice{Command: desktop.CommandLogIn}
	}
}

// savedLogin returns the login kept from last time, refreshed.
func savedLogin() (account.Session, bool) {
	session, ok := account.LoadSession()
	if !ok {
		return account.Session{}, false
	}
	refreshed, err := account.Refresh(context.Background(), session)
	var offline *url.Error
	if errors.As(err, &offline) {
		// No network yet (just after Windows starts): keep the login, the
		// uploads refresh it later.
		logf("Couldn't reach the account yet; trying again when there is something to send.")
		return session, true
	}
	if err != nil {
		logf("The saved login expired; log in again from the tray icon.")
		return account.Session{}, false
	}
	account.SaveSession(refreshed)
	logf("Logged in as %s.", nameOf(refreshed))
	return refreshed, true
}

func read(handle *capture.Handle, packets chan<- netio.Packet) {
	defer handle.Close()
	for {
		packet, ok, err := handle.Next()
		if err != nil {
			// The adapter went away (VPN off, cable out): stop quietly.
			return
		}
		if ok {
			packets <- packet
		}
	}
}

func describe(snapshots map[string]state.Snapshot) {
	keys := make([]string, 0, len(snapshots))
	for key := range snapshots {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	for _, key := range keys {
		s := snapshots[key]
		var parts []string
		if s.Pets != nil {
			parts = append(parts, fmt.Sprintf("%d pets", len(s.Pets)))
		}
		if s.Items != nil {
			items := 0
			for _, storage := range s.Items {
				items += len(storage)
			}
			parts = append(parts, fmt.Sprintf("%d item kinds", items))
		}
		if s.Counters != nil {
			parts = append(parts, "entries")
		}
		if s.Supply != nil {
			parts = append(parts, "supply requests")
		}
		if s.Crafts != nil {
			parts = append(parts, "crafting limits")
		}
		if s.Boards != nil {
			parts = append(parts, "Daevanion boards")
		}
		if s.Duty != nil {
			parts = append(parts, "duty board")
		}
		if s.Progress != nil {
			parts = append(parts, "progress counters")
		}
		if s.Arena != nil {
			parts = append(parts, "arena stats")
		}
		if len(parts) == 0 {
			parts = append(parts, "character (items and entries load at login or a character switch)")
		}
		// Comes with the character message: after the hint above.
		if s.Professions != nil {
			parts = append(parts, "crafting levels")
		}
		logf("%s: read %s", s.Character.Name, strings.Join(parts, ", "))
	}
}

func nameOf(s account.Session) string {
	if s.Name != "" {
		return s.Name
	}
	return "your Discord account"
}
