package desktop

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

var (
	advapi32 = syscall.NewLazyDLL("advapi32.dll")

	regOpenKeyEx    = advapi32.NewProc("RegOpenKeyExW")
	regQueryValueEx = advapi32.NewProc("RegQueryValueExW")
	regSetValueEx   = advapi32.NewProc("RegSetValueExW")
	regDeleteValue  = advapi32.NewProc("RegDeleteValueW")
	regCloseKey     = advapi32.NewProc("RegCloseKey")
	messageBox      = user32.NewProc("MessageBoxW")
	createMutex     = kernel.NewProc("CreateMutexW")
	shellExecute    = shell32.NewProc("ShellExecuteW")
	closeHandle     = kernel.NewProc("CloseHandle")
)

const (
	hkeyCurrentUser = 0x80000001
	keyQueryValue   = 0x0001
	keySetValue     = 0x0002
	regSZ           = 1

	errorAlreadyExists = 183

	mbIconError       = 0x10
	mbIconQuestion    = 0x20
	mbIconInformation = 0x40
	mbYesNo           = 0x04
	mbTopmost         = 0x40000
	idYes             = 6
)

// The per-user list Windows starts programs from at sign-in, the one Task
// Manager's Startup apps tab lists (and can disable) by this name.
const (
	runKey      = `Software\Microsoft\Windows\CurrentVersion\Run`
	startupName = "Daevanion Companion"
)

// StartupFlag is passed to the companion when Windows starts it.
const StartupFlag = "-startup"

// startupCommand is how Windows should start this .exe, or "" when it's a
// temporary build (`go run`), which must not be registered.
func startupCommand() string {
	exe, err := os.Executable()
	if err != nil {
		return ""
	}
	if strings.Contains(strings.ToLower(exe), `\go-build`) {
		return ""
	}
	// Quoted for spaces, as Windows reads a command line (not %q, which
	// doubles every backslash).
	return fmt.Sprintf(`"%s" %s`, exe, StartupFlag)
}

// CanStartWithWindows is false for temporary builds.
func CanStartWithWindows() bool {
	return startupCommand() != ""
}

func openRunKey(access uintptr) (uintptr, error) {
	var key uintptr
	r, _, _ := regOpenKeyEx.Call(hkeyCurrentUser, uintptr(unsafe.Pointer(wide(runKey))), 0, access, uintptr(unsafe.Pointer(&key)))
	if r != 0 {
		return 0, syscall.Errno(r)
	}
	return key, nil
}

// StartsWithWindows reports whether the startup entry exists (Task Manager
// may still have it disabled; that is the user's to change there).
func StartsWithWindows() bool {
	key, err := openRunKey(keyQueryValue)
	if err != nil {
		return false
	}
	defer regCloseKey.Call(key)
	var size uint32
	r, _, _ := regQueryValueEx.Call(key, uintptr(unsafe.Pointer(wide(startupName))), 0, 0, 0, uintptr(unsafe.Pointer(&size)))
	return r == 0
}

// SetStartWithWindows adds or removes the startup entry. Adding it again
// updates the path, for when the .exe was moved.
func SetStartWithWindows(on bool) error {
	key, err := openRunKey(keySetValue)
	if err != nil {
		return err
	}
	defer regCloseKey.Call(key)
	name := uintptr(unsafe.Pointer(wide(startupName)))
	if !on {
		r, _, _ := regDeleteValue.Call(key, name)
		if r != 0 && r != uintptr(syscall.ERROR_FILE_NOT_FOUND) {
			return syscall.Errno(r)
		}
		return nil
	}
	command := startupCommand()
	if command == "" {
		return fmt.Errorf("a temporary build can't start with Windows")
	}
	value, _ := syscall.UTF16FromString(command)
	r, _, _ := regSetValueEx.Call(key, name, 0, regSZ, uintptr(unsafe.Pointer(&value[0])), uintptr(len(value)*2))
	if r != 0 {
		return syscall.Errno(r)
	}
	return nil
}

// ShowError shows a message box; for errors before the tray icon exists.
func ShowError(text string) {
	messageBox.Call(0, uintptr(unsafe.Pointer(wide(text))), uintptr(unsafe.Pointer(wide("Daevanion Companion"))), mbIconError)
}

// ShowInfo shows an information message box.
func ShowInfo(text string) {
	messageBox.Call(0, uintptr(unsafe.Pointer(wide(text))), uintptr(unsafe.Pointer(wide("Daevanion Companion"))), mbIconInformation)
}

// Ask shows a Yes/No question above other windows (without taking the
// game's focus) and reports Yes.
func Ask(title, text string) bool {
	r, _, _ := messageBox.Call(0, uintptr(unsafe.Pointer(wide(text))), uintptr(unsafe.Pointer(wide(title))), mbYesNo|mbIconQuestion|mbTopmost)
	return r == idYes
}

// The lock FirstInstance took.
var instance uintptr

// FirstInstance is false when the companion already runs for this Windows
// user. The lock lasts as long as the process, or until ReleaseInstance.
func FirstInstance() bool {
	handle, _, err := createMutex.Call(0, 0, uintptr(unsafe.Pointer(wide(`Local\DaevanionCompanion`))))
	if handle == 0 {
		return true
	}
	if err == syscall.Errno(errorAlreadyExists) {
		closeHandle.Call(handle)
		return false
	}
	instance = handle
	return true
}

// ReleaseInstance lets another companion start: the updated one, started
// just before this one exits.
func ReleaseInstance() {
	if instance != 0 {
		closeHandle.Call(instance)
		instance = 0
	}
}

// Open opens a file or link with its usual program.
func Open(target string) {
	shellExecute.Call(0, uintptr(unsafe.Pointer(wide("open"))), uintptr(unsafe.Pointer(wide(target))), 0, 0, 1)
}

// DataDir is where the companion keeps its files (the login, the log).
func DataDir() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir = filepath.Join(dir, "Daevanion Companion")
	return dir, os.MkdirAll(dir, 0o700)
}
