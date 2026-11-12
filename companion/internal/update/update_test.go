package update

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestNewer(t *testing.T) {
	for _, c := range []struct {
		current, candidate string
		want               bool
	}{
		{"v1.2.3", "v1.2.4", true},
		{"v1.2.3", "v1.10.0", true},
		{"v1.2.3", "v2.0.0", true},
		{"v1.2.3", "v1.2.3", false},
		{"v1.3.0", "v1.2.9", false},
		// Dev builds never update; broken versions are never newer.
		{"dev", "v9.9.9", false},
		{"local", "v9.9.9", false},
		{"v1.2.3", "v1.2", false},
		{"v1.2.3", "1.2.4", false},
	} {
		if got := Newer(c.current, c.candidate); got != c.want {
			t.Errorf("Newer(%q, %q) = %v", c.current, c.candidate, got)
		}
	}
}

// A GitHub release list: the site's other releases, a draft, a prerelease,
// one without its SHA-256 file, and two good companion versions.
const releaseList = `[
	{"tag_name": "companion-v1.4.0", "draft": true, "assets": [
		{"name": "Daevanion-Companion.exe", "browser_download_url": "x"},
		{"name": "Daevanion-Companion.exe.sha256", "browser_download_url": "x"}]},
	{"tag_name": "companion-v1.3.0", "prerelease": true, "assets": [
		{"name": "Daevanion-Companion.exe", "browser_download_url": "x"},
		{"name": "Daevanion-Companion.exe.sha256", "browser_download_url": "x"}]},
	{"tag_name": "companion-v1.2.5", "assets": [
		{"name": "Daevanion-Companion.exe", "browser_download_url": "x"}]},
	{"tag_name": "v3.0.0", "assets": []},
	{"tag_name": "companion-v1.2.0", "assets": [
		{"name": "Daevanion-Companion.exe", "browser_download_url": "old.exe"},
		{"name": "Daevanion-Companion.exe.sha256", "browser_download_url": "old.sha256"}]},
	{"tag_name": "companion-v1.2.1", "assets": [
		{"name": "Daevanion-Companion.exe", "browser_download_url": "new.exe"},
		{"name": "Daevanion-Companion.exe.sha256", "browser_download_url": "new.sha256"}]}
]`

func TestLatest(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("User-Agent") != "Daevanion-Companion" {
			t.Errorf("User-Agent %q", r.Header.Get("User-Agent"))
		}
		fmt.Fprint(w, releaseList)
	}))
	defer server.Close()

	got, ok, err := Latest(context.Background(), server.URL)
	want := Release{Version: "v1.2.1", ExeURL: "new.exe", SumURL: "new.sha256"}
	if err != nil || !ok || got != want {
		t.Fatalf("got %+v %v %v", got, ok, err)
	}
}

func TestLatestWithoutReleases(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `[]`)
	}))
	defer server.Close()

	if _, ok, err := Latest(context.Background(), server.URL); ok || err != nil {
		t.Fatalf("got %v %v", ok, err)
	}
}

// Serves an .exe and a SHA-256 file for it (or for something else).
func releaseServer(t *testing.T, exe []byte, sumOf []byte) (*httptest.Server, Release) {
	sum := sha256.Sum256(sumOf)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/exe":
			w.Write(exe)
		case "/sum":
			fmt.Fprintf(w, "%s  Daevanion-Companion.exe\n", hex.EncodeToString(sum[:]))
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(server.Close)
	return server, Release{Version: "v1.2.1", ExeURL: server.URL + "/exe", SumURL: server.URL + "/sum"}
}

func TestDownloadKeepsAMatchingExe(t *testing.T) {
	exe := []byte("the new companion")
	_, release := releaseServer(t, exe, exe)
	path := filepath.Join(t.TempDir(), "new.exe")

	if err := Download(context.Background(), release, path); err != nil {
		t.Fatal(err)
	}
	if got, _ := os.ReadFile(path); string(got) != string(exe) {
		t.Fatalf("got %q", got)
	}
}

func TestDownloadRefusesAMismatch(t *testing.T) {
	_, release := releaseServer(t, []byte("something else"), []byte("the new companion"))
	path := filepath.Join(t.TempDir(), "new.exe")

	if err := Download(context.Background(), release, path); err == nil {
		t.Fatal("kept an .exe that doesn't match")
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatal("left the download behind")
	}
}

func TestInstallSwapsTheExe(t *testing.T) {
	dir := t.TempDir()
	exe := filepath.Join(dir, "Daevanion-Companion.exe")
	downloaded := filepath.Join(dir, "new.exe")
	os.WriteFile(exe, []byte("old"), 0o755)
	os.WriteFile(downloaded, []byte("new"), 0o755)

	if err := Install(downloaded, exe); err != nil {
		t.Fatal(err)
	}
	if got, _ := os.ReadFile(exe); string(got) != "new" {
		t.Fatalf("exe holds %q", got)
	}
	if got, _ := os.ReadFile(exe + ".old"); string(got) != "old" {
		t.Fatalf("old holds %q", got)
	}

	CleanUp(exe)
	if _, err := os.Stat(exe + ".old"); !os.IsNotExist(err) {
		t.Fatal("the old version is still there")
	}
}

func TestInstallPutsTheOldBackOnFailure(t *testing.T) {
	dir := t.TempDir()
	exe := filepath.Join(dir, "Daevanion-Companion.exe")
	os.WriteFile(exe, []byte("old"), 0o755)

	if err := Install(filepath.Join(dir, "missing.exe"), exe); err == nil {
		t.Fatal("installed a missing download")
	}
	if got, _ := os.ReadFile(exe); string(got) != "old" {
		t.Fatalf("exe holds %q", got)
	}
}
