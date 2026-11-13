// Command winres writes the companion's Windows resources (its icon, the
// name Explorer and Task Manager show, and the manifest) as a .syso object that `go build`
// links into the .exe:
//
//	go run ./cmd/winres
//
// Rerun it after changing cmd/companion/res/app.ico; the output is committed.
package main

import (
	"fmt"
	"os"

	"daevanion-companion/internal/winres"
)

func main() {
	icon, err := os.ReadFile("cmd/companion/res/app.ico")
	if err != nil {
		fail(err)
	}
	resources, err := winres.Icon(icon)
	if err != nil {
		fail(err)
	}
	resources = append(resources, winres.Version(winres.VersionInfo{
		Version:     [4]uint16{1, 0, 0, 0},
		Description: "Daevanion Companion",
		Product:     "Daevanion Companion",
		File:        "Daevanion-Companion.exe",
	}), winres.Manifest())
	out := "cmd/companion/rsrc_windows_amd64.syso"
	if err := os.WriteFile(out, winres.Object(resources), 0o644); err != nil {
		fail(err)
	}
	fmt.Println("Wrote", out)
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
