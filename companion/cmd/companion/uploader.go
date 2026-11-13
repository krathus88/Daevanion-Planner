package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"sync"
	"time"

	"daevanion-companion/internal/account"
	"daevanion-companion/internal/game"
	"daevanion-companion/internal/state"
)

// accountPets is the pet collection in the account's rows (the newest, as
// pets are account-wide), or nil before they're read: a companion started
// mid-session gets the game's only at the next zone change.
func (u *uploader) accountPets() map[int]game.Pet {
	u.mu.Lock()
	defer u.mu.Unlock()
	return newestPets(u.sent)
}

// newestPets reads the newest pets section among the snapshots.
func newestPets(snapshots map[string]state.Snapshot) map[int]game.Pet {
	var newest *state.Snapshot
	for key := range snapshots {
		s := snapshots[key]
		if s.Pets != nil && (newest == nil || s.PetsAt > newest.PetsAt) {
			newest = &s
		}
	}
	if newest == nil {
		return nil
	}
	pets := make(map[int]game.Pet, len(newest.Pets))
	for id, value := range newest.Pets {
		n, err := strconv.Atoi(id)
		if err != nil {
			continue
		}
		pets[n] = game.Pet{Level: value[0], Souls: value[1]}
	}
	return pets
}

// uploader sends snapshots one batch at a time, keeping only the newest
// snapshot of each character while a batch is on its way. Logged out, it
// keeps them until a login.
type uploader struct {
	mu      sync.Mutex
	session *account.Session
	queued  map[string]state.Snapshot
	status  *state.Status
	// What each character's row holds now: sections this run hasn't read
	// are kept from it.
	sent map[string]state.Snapshot
	// Whether sent was read from the account since logging in: nothing is
	// uploaded before, or sections not read this run would be wiped.
	loaded bool
	wake   chan struct{}
}

func newUploader() *uploader {
	return &uploader{queued: map[string]state.Snapshot{}, sent: map[string]state.Snapshot{}, wake: make(chan struct{}, 1)}
}

func (u *uploader) poke() {
	select {
	case u.wake <- struct{}{}:
	default:
	}
}

// login starts uploading for s.
func (u *uploader) login(s account.Session) {
	u.mu.Lock()
	u.session = &s
	u.sent = map[string]state.Snapshot{}
	u.loaded = false
	u.mu.Unlock()
	u.poke()
}

// load reads the rows uploaded before, so a restart doesn't wipe sections
// the game only sends at login.
func (u *uploader) load(ctx context.Context, s account.Session) error {
	rows, err := account.Download(ctx, s, KeyPrefix)
	if err != nil {
		return fmt.Errorf("reading what your account has: %w", err)
	}
	sent := map[string]state.Snapshot{}
	for key, value := range rows {
		var snapshot state.Snapshot
		if json.Unmarshal(value, &snapshot) == nil {
			sent[key] = snapshot
		}
	}
	u.mu.Lock()
	u.sent = sent
	u.loaded = true
	u.mu.Unlock()
	return nil
}

// logout stops uploading and drops what was waiting.
func (u *uploader) logout() {
	u.mu.Lock()
	u.session = nil
	u.queued = map[string]state.Snapshot{}
	u.status = nil
	u.sent = map[string]state.Snapshot{}
	u.loaded = false
	u.mu.Unlock()
}

func (u *uploader) loggedIn() (account.Session, bool) {
	u.mu.Lock()
	defer u.mu.Unlock()
	if u.session == nil {
		return account.Session{}, false
	}
	return *u.session, true
}

func (u *uploader) send(snapshots map[string]state.Snapshot) {
	u.mu.Lock()
	for key, snapshot := range snapshots {
		u.queued[key] = snapshot
	}
	u.mu.Unlock()
	u.poke()
}

func (u *uploader) sendStatus(status state.Status) {
	u.mu.Lock()
	u.status = &status
	u.mu.Unlock()
	u.poke()
}

func (u *uploader) run() {
	for range u.wake {
		for {
			u.mu.Lock()
			if u.session == nil {
				u.mu.Unlock()
				break
			}
			batch := u.queued
			status := u.status
			u.queued = map[string]state.Snapshot{}
			u.status = nil
			u.mu.Unlock()
			if len(batch) == 0 && status == nil {
				break
			}

			if err := u.upload(batch, status); err != nil {
				logf("Upload failed, retrying in 30s: %v", err)
				// Put it back unless something newer came in meanwhile.
				u.mu.Lock()
				if u.session != nil {
					for key, snapshot := range batch {
						if _, newer := u.queued[key]; !newer {
							u.queued[key] = snapshot
						}
					}
					if u.status == nil {
						u.status = status
					}
				}
				u.mu.Unlock()
				time.Sleep(30 * time.Second)
				continue
			}
		}
	}
}

// finish sends what's left and a last status before the app closes or logs
// out.
func (u *uploader) finish(waiting map[string]state.Snapshot, status state.Status) {
	u.mu.Lock()
	for key, snapshot := range waiting {
		u.queued[key] = snapshot
	}
	batch := u.queued
	u.queued = map[string]state.Snapshot{}
	loggedIn := u.session != nil
	u.mu.Unlock()
	if !loggedIn {
		return
	}
	if err := u.upload(batch, &status); err != nil {
		logf("Couldn't send the last changes: %v", err)
	}
}

func (u *uploader) upload(batch map[string]state.Snapshot, status *state.Status) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	session, ok := u.loggedIn()
	if !ok {
		return errors.New("logged out")
	}
	if time.Until(session.ExpiresAt) < time.Minute {
		var err error
		if session, err = u.refresh(ctx, session); err != nil {
			return err
		}
	}

	u.mu.Lock()
	loaded := u.loaded
	u.mu.Unlock()
	if !loaded {
		err := u.load(ctx, session)
		if errors.Is(err, account.ErrExpired) {
			if session, err = u.refresh(ctx, session); err == nil {
				err = u.load(ctx, session)
			}
		}
		if err != nil {
			return err
		}
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)
	rows := make([]account.Row, 0, len(batch))
	kept := make(map[string]state.Snapshot, len(batch))
	u.mu.Lock()
	for key, snapshot := range batch {
		kept[key] = snapshot.Keep(u.sent[key])
		rows = append(rows, account.Row{Key: key, Value: kept[key], UpdatedAt: now})
	}
	u.mu.Unlock()
	if status != nil {
		rows = append(rows, account.Row{Key: state.StatusKey, Value: status, UpdatedAt: now})
	}

	err := account.Upload(ctx, session, rows)
	if errors.Is(err, account.ErrExpired) {
		if session, err = u.refresh(ctx, session); err != nil {
			return err
		}
		err = account.Upload(ctx, session, rows)
	}
	if err == nil {
		u.mu.Lock()
		for key, snapshot := range kept {
			u.sent[key] = snapshot
		}
		u.mu.Unlock()
	}
	if err == nil && len(batch) > 0 {
		logf("Sent to your account: %d character(s).", len(batch))
	}
	return err
}

func (u *uploader) refresh(ctx context.Context, old account.Session) (account.Session, error) {
	session, err := account.Refresh(ctx, old)
	if err != nil {
		return old, fmt.Errorf("refreshing the login: %w", err)
	}
	u.mu.Lock()
	if u.session != nil {
		u.session = &session
		account.SaveSession(session)
	}
	u.mu.Unlock()
	return session, nil
}
