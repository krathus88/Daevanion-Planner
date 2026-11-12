package account

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

func fakeSupabase(t *testing.T, handler http.HandlerFunc) {
	t.Helper()
	server := httptest.NewServer(handler)
	old := baseURL
	baseURL = server.URL
	t.Cleanup(func() {
		baseURL = old
		server.Close()
	})
}

const tokenJSON = `{"access_token":"access","refresh_token":"refresh","expires_in":3600,
	"user":{"id":"user-1","user_metadata":{"full_name":"Tester"}}}`

func TestLoginExchangesTheCode(t *testing.T) {
	var verifier string
	fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/auth/v1/token" || r.URL.Query().Get("grant_type") != "pkce" || r.Header.Get("apikey") != PublishableKey {
			t.Errorf("unexpected request %s", r.URL)
		}
		var body map[string]string
		json.NewDecoder(r.Body).Decode(&body)
		if body["auth_code"] != "the-code" {
			t.Errorf("code %q", body["auth_code"])
		}
		verifier = body["code_verifier"]
		io.WriteString(w, tokenJSON)
	})

	var authorize string
	open := func(link string) error {
		authorize = link
		parsed, _ := url.Parse(link)
		redirect := parsed.Query().Get("redirect_to")
		go http.Get(redirect + "?code=the-code")
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	session, err := Login(ctx, open)
	if err != nil {
		t.Fatal(err)
	}
	if session.AccessToken != "access" || session.UserID != "user-1" || session.Name != "Tester" {
		t.Fatalf("got %+v", session)
	}
	parsed, _ := url.Parse(authorize)
	q := parsed.Query()
	if q.Get("provider") != "discord" || q.Get("code_challenge_method") != "s256" || verifier == "" || q.Get("code_challenge") == verifier {
		t.Fatalf("authorize %s", authorize)
	}
}

func TestLoginRefusedForNonMembers(t *testing.T) {
	fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {})
	open := func(link string) error {
		parsed, _ := url.Parse(link)
		redirect := parsed.Query().Get("redirect_to")
		go http.Get(redirect + "?error=access_denied&error_description=" + url.QueryEscape("Not on the members list"))
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := Login(ctx, open); err != ErrNotMember {
		t.Fatalf("got %v", err)
	}
}

func TestRefresh(t *testing.T) {
	fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("grant_type") != "refresh_token" {
			t.Errorf("grant %s", r.URL.Query().Get("grant_type"))
		}
		io.WriteString(w, tokenJSON)
	})
	session, err := Refresh(context.Background(), Session{RefreshToken: "old"})
	if err != nil || session.RefreshToken != "refresh" || time.Until(session.ExpiresAt) < 50*time.Minute {
		t.Fatalf("got %+v %v", session, err)
	}
}

func TestRefreshError(t *testing.T) {
	fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		io.WriteString(w, `{"error":"invalid_grant","error_description":"Invalid Refresh Token"}`)
	})
	if _, err := Refresh(context.Background(), Session{RefreshToken: "old"}); err == nil || !strings.Contains(err.Error(), "Invalid Refresh Token") {
		t.Fatalf("got %v", err)
	}
}

func TestUpload(t *testing.T) {
	fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/rest/v1/user_data" || r.URL.Query().Get("on_conflict") != "user_id,key" {
			t.Errorf("url %s", r.URL)
		}
		if r.Header.Get("Authorization") != "Bearer access" || !strings.Contains(r.Header.Get("Prefer"), "merge-duplicates") {
			t.Errorf("headers %v", r.Header)
		}
		var rows []map[string]any
		json.NewDecoder(r.Body).Decode(&rows)
		if len(rows) != 1 || rows[0]["user_id"] != "user-1" || rows[0]["key"] != "k" {
			t.Errorf("rows %v", rows)
		}
		w.WriteHeader(http.StatusCreated)
	})
	err := Upload(context.Background(), Session{AccessToken: "access", UserID: "user-1"}, []Row{{Key: "k", Value: 1, UpdatedAt: "2026-11-12T00:00:00Z"}})
	if err != nil {
		t.Fatal(err)
	}
}

func TestUploadExpired(t *testing.T) {
	fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	})
	if err := Upload(context.Background(), Session{}, []Row{{Key: "k"}}); err != ErrExpired {
		t.Fatalf("got %v", err)
	}
}

func TestEncryptRoundTrip(t *testing.T) {
	sealed, err := encrypt([]byte("secret"))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(sealed), "secret") {
		t.Fatal("not encrypted")
	}
	plain, err := decrypt(sealed)
	if err != nil || string(plain) != "secret" {
		t.Fatalf("got %q %v", plain, err)
	}
}

func TestDownload(t *testing.T) {
	fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		if r.URL.Path != "/rest/v1/user_data" || q.Get("key") != "like.daevanion:game:v1:*" || q.Get("select") != "key,value" {
			t.Errorf("url %s", r.URL)
		}
		if r.Header.Get("Authorization") != "Bearer access" {
			t.Errorf("headers %v", r.Header)
		}
		io.WriteString(w, `[{"key":"daevanion:game:v1:1301:Kryx","value":{"v":1}},{"key":"other","value":2}]`)
	})
	rows, err := Download(context.Background(), Session{AccessToken: "access"}, "daevanion:game:v1:")
	if err != nil || len(rows) != 1 || string(rows["daevanion:game:v1:1301:Kryx"]) != `{"v":1}` {
		t.Fatalf("got %v %v", rows, err)
	}
}

func TestDownloadExpired(t *testing.T) {
	fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	})
	if _, err := Download(context.Background(), Session{}, "x"); err != ErrExpired {
		t.Fatalf("got %v", err)
	}
}
