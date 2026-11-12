// Package account logs in to the site's Supabase project with Discord and
// uploads snapshots to the user's own synced data.
package account

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// The site's public Supabase project (same values as the site's .env:
// public by design, row-level security decides who can write).
const (
	SupabaseURL    = "https://wuzzvtvrfifezbhylwnd.supabase.co"
	PublishableKey = "sb_publishable_Y4b3MPos6Gw7rKHOkqqICg_kxFsailq"
)

// baseURL is SupabaseURL; tests point it at a local server.
var baseURL = SupabaseURL

// CallbackPort must match the redirect URL allowed in Supabase's Auth
// settings: http://localhost:48761/callback
const CallbackPort = 48761

// ErrNotMember means Supabase refused the login: the account isn't on the
// members list.
var ErrNotMember = errors.New("this Discord account isn't on the members list")

// Session is a logged-in user.
type Session struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	UserID       string    `json:"user_id"`
	Name         string    `json:"name"`
}

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	User         struct {
		ID           string `json:"id"`
		UserMetadata struct {
			FullName string `json:"full_name"`
			Name     string `json:"name"`
		} `json:"user_metadata"`
	} `json:"user"`
	Error       string `json:"error"`
	Description string `json:"error_description"`
	Message     string `json:"msg"`
}

func (t tokenResponse) session() Session {
	name := t.User.UserMetadata.FullName
	if name == "" {
		name = t.User.UserMetadata.Name
	}
	return Session{
		AccessToken:  t.AccessToken,
		RefreshToken: t.RefreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(t.ExpiresIn) * time.Second),
		UserID:       t.User.ID,
		Name:         name,
	}
}

var client = &http.Client{Timeout: 30 * time.Second}

func randomString(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

// Login opens the browser on Discord's login and waits for Supabase to
// send the user back to the companion.
func Login(ctx context.Context, openBrowser func(string) error) (Session, error) {
	verifier := randomString(48)
	sum := sha256.Sum256([]byte(verifier))
	challenge := base64.RawURLEncoding.EncodeToString(sum[:])
	redirect := fmt.Sprintf("http://localhost:%d/callback", CallbackPort)

	listener, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", CallbackPort))
	if err != nil {
		return Session{}, fmt.Errorf("port %d is busy (is the companion already open?): %w", CallbackPort, err)
	}

	codes := make(chan string, 1)
	failures := make(chan string, 1)
	server := &http.Server{
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != "/callback" {
				http.NotFound(w, r)
				return
			}
			query := r.URL.Query()
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			if code := query.Get("code"); code != "" {
				fmt.Fprint(w, page("Logged in", "You can close this tab and go back to the companion."))
				select {
				case codes <- code:
				default:
				}
				return
			}
			message := query.Get("error_description")
			if message == "" {
				message = query.Get("error")
			}
			fmt.Fprint(w, page("Login failed", message))
			select {
			case failures <- message:
			default:
			}
		}),
		ReadHeaderTimeout: 10 * time.Second,
	}
	go server.Serve(listener)
	defer server.Close()

	authorize := baseURL + "/auth/v1/authorize?" + url.Values{
		"provider":              {"discord"},
		"redirect_to":           {redirect},
		"code_challenge":        {challenge},
		"code_challenge_method": {"s256"},
	}.Encode()
	if err := openBrowser(authorize); err != nil {
		return Session{}, fmt.Errorf("opening the browser: %w", err)
	}

	select {
	case <-ctx.Done():
		return Session{}, ctx.Err()
	case message := <-failures:
		if strings.Contains(strings.ToLower(message), "member") || strings.Contains(strings.ToLower(message), "hook") {
			return Session{}, ErrNotMember
		}
		return Session{}, fmt.Errorf("login failed: %s", message)
	case code := <-codes:
		return exchange(ctx, "pkce", map[string]string{"auth_code": code, "code_verifier": verifier})
	}
}

func page(title, text string) string {
	return fmt.Sprintf(`<!doctype html><meta charset="utf-8"><title>%[1]s</title>`+
		`<body style="font-family:system-ui;background:#111;color:#eee;display:grid;place-items:center;height:90vh">`+
		`<div><h1>%[1]s</h1><p>%[2]s</p></div>`, title, htmlEscape(text))
}

func htmlEscape(s string) string {
	return strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;", `"`, "&quot;").Replace(s)
}

// Refresh gets a new access token.
func Refresh(ctx context.Context, s Session) (Session, error) {
	return exchange(ctx, "refresh_token", map[string]string{"refresh_token": s.RefreshToken})
}

func exchange(ctx context.Context, grant string, body map[string]string) (Session, error) {
	payload, _ := json.Marshal(body)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/auth/v1/token?grant_type="+grant, bytes.NewReader(payload))
	if err != nil {
		return Session{}, err
	}
	request.Header.Set("apikey", PublishableKey)
	request.Header.Set("Content-Type", "application/json")

	response, err := client.Do(request)
	if err != nil {
		return Session{}, err
	}
	defer response.Body.Close()

	var token tokenResponse
	data, _ := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	_ = json.Unmarshal(data, &token)
	if response.StatusCode != http.StatusOK || token.AccessToken == "" {
		message := firstNonEmpty(token.Description, token.Message, token.Error, response.Status)
		if strings.Contains(strings.ToLower(message), "member") {
			return Session{}, ErrNotMember
		}
		return Session{}, fmt.Errorf("supabase: %s", message)
	}

	return token.session(), nil
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

// Row is one user_data row.
type Row struct {
	Key       string `json:"key"`
	Value     any    `json:"value"`
	UpdatedAt string `json:"updated_at"`
}

// Download reads the user's own rows whose key starts with prefix: key →
// value as JSON.
func Download(ctx context.Context, s Session, prefix string) (map[string]json.RawMessage, error) {
	query := url.Values{
		"select": {"key,value"},
		"key":    {"like." + prefix + "*"},
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+"/rest/v1/user_data?"+query.Encode(), nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("apikey", PublishableKey)
	request.Header.Set("Authorization", "Bearer "+s.AccessToken)

	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode == http.StatusUnauthorized {
		return nil, ErrExpired
	}
	if response.StatusCode/100 != 2 {
		data, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		return nil, fmt.Errorf("download failed: %s %s", response.Status, strings.TrimSpace(string(data)))
	}

	var rows []struct {
		Key   string          `json:"key"`
		Value json.RawMessage `json:"value"`
	}
	if err := json.NewDecoder(response.Body).Decode(&rows); err != nil {
		return nil, err
	}
	out := make(map[string]json.RawMessage, len(rows))
	for _, row := range rows {
		if strings.HasPrefix(row.Key, prefix) {
			out[row.Key] = row.Value
		}
	}
	return out, nil
}

// ErrExpired means the access token needs refreshing.
var ErrExpired = errors.New("session expired")

// Upload writes rows to the user's own synced data, as the site does.
func Upload(ctx context.Context, s Session, rows []Row) error {
	type uploadRow struct {
		UserID string `json:"user_id"`
		Row
	}
	var body []uploadRow
	for _, row := range rows {
		body = append(body, uploadRow{UserID: s.UserID, Row: row})
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/rest/v1/user_data?on_conflict=user_id,key", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	request.Header.Set("apikey", PublishableKey)
	request.Header.Set("Authorization", "Bearer "+s.AccessToken)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "resolution=merge-duplicates,return=minimal")

	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode == http.StatusUnauthorized {
		return ErrExpired
	}
	if response.StatusCode/100 != 2 {
		data, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		return fmt.Errorf("upload failed: %s %s", response.Status, strings.TrimSpace(string(data)))
	}
	return nil
}
