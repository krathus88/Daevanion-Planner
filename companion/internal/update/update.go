// Package update keeps the companion current: it finds the newest companion
// release on GitHub, downloads its .exe, checks it against the release's
// SHA-256 file and swaps it in for the running one.
package update

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// Where releases come from: the site's repository, tagged companion-v1.2.3
// by .github/workflows/companion.yml.
//
// ReleasesURL is a variable only so a test build can point it elsewhere
// (-ldflags "-X daevanion-companion/internal/update.ReleasesURL=…").
var ReleasesURL = "https://api.github.com/repos/krathus88/Daevanion-Planner/releases?per_page=30"

const (
	tagPrefix = "companion-"
	exeName   = "Daevanion-Companion.exe"
	sumName   = exeName + ".sha256"
	// Far above the real size (~8 MB): a bigger download is refused.
	maxSize = 64 << 20
)

// Release is a published companion version.
type Release struct {
	// "v1.2.3", as the companion names its own version.
	Version string
	ExeURL  string
	SumURL  string
}

var client = &http.Client{Timeout: 2 * time.Minute}

func get(ctx context.Context, url string) (*http.Response, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	// GitHub asks for a User-Agent; a generic one, nothing about the user.
	request.Header.Set("User-Agent", "Daevanion-Companion")
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	if response.StatusCode != http.StatusOK {
		response.Body.Close()
		return nil, fmt.Errorf("%s answered %s", url, response.Status)
	}
	return response, nil
}

// parseVersion reads "v1.2.3"; false for anything else (dev builds).
func parseVersion(version string) ([3]int, bool) {
	parts := strings.Split(strings.TrimPrefix(version, "v"), ".")
	var out [3]int
	if !strings.HasPrefix(version, "v") || len(parts) != 3 {
		return out, false
	}
	for i, part := range parts {
		n, err := strconv.Atoi(part)
		if err != nil || n < 0 {
			return out, false
		}
		out[i] = n
	}
	return out, true
}

// IsRelease is false for dev builds ("dev", "local"), which never update.
func IsRelease(version string) bool {
	_, ok := parseVersion(version)
	return ok
}

// Newer reports whether candidate is a later version than current. A
// current version that isn't one (a dev build) never updates.
func Newer(current, candidate string) bool {
	a, okA := parseVersion(current)
	b, okB := parseVersion(candidate)
	if !okA || !okB {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return b[i] > a[i]
		}
	}
	return false
}

type githubRelease struct {
	Tag        string `json:"tag_name"`
	Draft      bool   `json:"draft"`
	Prerelease bool   `json:"prerelease"`
	Assets     []struct {
		Name string `json:"name"`
		URL  string `json:"browser_download_url"`
	} `json:"assets"`
}

// Latest finds the newest published companion release that has both the
// .exe and its SHA-256 file. ok is false when there is none.
func Latest(ctx context.Context, url string) (release Release, ok bool, err error) {
	response, err := get(ctx, url)
	if err != nil {
		return Release{}, false, err
	}
	defer response.Body.Close()
	var list []githubRelease
	if err := json.NewDecoder(io.LimitReader(response.Body, 4<<20)).Decode(&list); err != nil {
		return Release{}, false, fmt.Errorf("reading the release list: %w", err)
	}
	for _, item := range list {
		version, isCompanion := strings.CutPrefix(item.Tag, tagPrefix)
		if !isCompanion || item.Draft || item.Prerelease {
			continue
		}
		if _, valid := parseVersion(version); !valid {
			continue
		}
		candidate := Release{Version: version}
		for _, asset := range item.Assets {
			switch asset.Name {
			case exeName:
				candidate.ExeURL = asset.URL
			case sumName:
				candidate.SumURL = asset.URL
			}
		}
		if candidate.ExeURL == "" || candidate.SumURL == "" {
			continue
		}
		if !ok || Newer(release.Version, candidate.Version) {
			release, ok = candidate, true
		}
	}
	return release, ok, nil
}

// Download fetches the release's .exe to path, keeping it only if it
// matches the release's SHA-256 file.
func Download(ctx context.Context, release Release, path string) error {
	sumResponse, err := get(ctx, release.SumURL)
	if err != nil {
		return err
	}
	sumText, err := io.ReadAll(io.LimitReader(sumResponse.Body, 1024))
	sumResponse.Body.Close()
	if err != nil {
		return err
	}
	// "<hash>  Daevanion-Companion.exe", as sha256sum writes it.
	fields := strings.Fields(string(sumText))
	if len(fields) == 0 {
		return errors.New("the release's SHA-256 file is empty")
	}
	want, err := hex.DecodeString(fields[0])
	if err != nil || len(want) != sha256.Size {
		return errors.New("the release's SHA-256 file isn't a SHA-256")
	}

	response, err := get(ctx, release.ExeURL)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	hash := sha256.New()
	written, err := io.Copy(io.MultiWriter(file, hash), io.LimitReader(response.Body, maxSize+1))
	closeErr := file.Close()
	switch {
	case err != nil:
	case closeErr != nil:
		err = closeErr
	case written > maxSize:
		err = errors.New("the download is far bigger than the companion")
	case !bytes.Equal(hash.Sum(nil), want):
		err = errors.New("the download doesn't match the release's SHA-256")
	}
	if err != nil {
		os.Remove(path)
		return err
	}
	return nil
}

// Install swaps the downloaded .exe in for exe. Windows lets a running .exe
// be renamed, not replaced: it moves aside to exe.old (removed at the next
// start, CleanUp) and the download takes its name.
func Install(downloaded, exe string) error {
	old := exe + ".old"
	os.Remove(old)
	if err := os.Rename(exe, old); err != nil {
		return fmt.Errorf("moving the running version aside: %w", err)
	}
	if err := os.Rename(downloaded, exe); err != nil {
		// Put it back, so the companion still starts.
		os.Rename(old, exe)
		return fmt.Errorf("putting the new version in place: %w", err)
	}
	return nil
}

// CleanUp removes what the last update left: the version it replaced. Right
// after an update that version is still exiting and Windows keeps its file
// locked, so it tries again for a while (call it on its own goroutine).
func CleanUp(exe string) {
	old := exe + ".old"
	for try := 0; try < 30; try++ {
		err := os.Remove(old)
		if err == nil || os.IsNotExist(err) {
			return
		}
		time.Sleep(time.Second)
	}
}
