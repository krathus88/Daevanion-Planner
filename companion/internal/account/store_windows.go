package account

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"syscall"
	"unsafe"
)

// The login stays in the user's AppData, encrypted for this Windows user
// (DPAPI), so another account on the PC can't read it.

type dataBlob struct {
	size uint32
	data *byte
}

var (
	crypt32   = syscall.NewLazyDLL("crypt32.dll")
	kernel32  = syscall.NewLazyDLL("kernel32.dll")
	protect   = crypt32.NewProc("CryptProtectData")
	unprotect = crypt32.NewProc("CryptUnprotectData")
	localFree = kernel32.NewProc("LocalFree")
)

const uiForbidden = 0x1

func newBlob(b []byte) *dataBlob {
	if len(b) == 0 {
		return &dataBlob{}
	}
	return &dataBlob{size: uint32(len(b)), data: &b[0]}
}

func (b *dataBlob) bytes() []byte {
	out := make([]byte, b.size)
	copy(out, unsafe.Slice(b.data, b.size))
	return out
}

func encrypt(plain []byte) ([]byte, error) {
	var out dataBlob
	r, _, err := protect.Call(uintptr(unsafe.Pointer(newBlob(plain))), 0, 0, 0, 0, uiForbidden, uintptr(unsafe.Pointer(&out)))
	if r == 0 {
		return nil, err
	}
	defer localFree.Call(uintptr(unsafe.Pointer(out.data)))
	return out.bytes(), nil
}

func decrypt(sealed []byte) ([]byte, error) {
	var out dataBlob
	r, _, err := unprotect.Call(uintptr(unsafe.Pointer(newBlob(sealed))), 0, 0, 0, 0, uiForbidden, uintptr(unsafe.Pointer(&out)))
	if r == 0 {
		return nil, err
	}
	defer localFree.Call(uintptr(unsafe.Pointer(out.data)))
	return out.bytes(), nil
}

func sessionPath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "Daevanion Companion", "session.bin"), nil
}

// SaveSession keeps the login for the next start.
func SaveSession(s Session) error {
	path, err := sessionPath()
	if err != nil {
		return err
	}
	plain, err := json.Marshal(s)
	if err != nil {
		return err
	}
	sealed, err := encrypt(plain)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	return os.WriteFile(path, sealed, 0o600)
}

// LoadSession reads the saved login; ok is false when there is none.
func LoadSession() (Session, bool) {
	path, err := sessionPath()
	if err != nil {
		return Session{}, false
	}
	sealed, err := os.ReadFile(path)
	if err != nil {
		return Session{}, false
	}
	plain, err := decrypt(sealed)
	if err != nil {
		return Session{}, false
	}
	var s Session
	if json.Unmarshal(plain, &s) != nil || s.RefreshToken == "" {
		return Session{}, false
	}
	return s, true
}

// ForgetSession logs out on this PC.
func ForgetSession() error {
	path, err := sessionPath()
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}
