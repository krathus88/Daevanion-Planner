package main

import (
	"reflect"
	"testing"
)

func TestRestartArgs(t *testing.T) {
	for _, c := range []struct {
		args []string
		want []string
	}{
		{nil, []string{"-updated", "v1.0.0"}},
		{[]string{"-startup"}, []string{"-startup", "-updated", "v1.0.0"}},
		// A second update replaces the first one's note.
		{[]string{"-startup", "-updated", "v0.9.0"}, []string{"-startup", "-updated", "v1.0.0"}},
		{[]string{"-updated=v0.9.0", "-offline"}, []string{"-offline", "-updated", "v1.0.0"}},
	} {
		if got := restartArgs(c.args, "v1.0.0"); !reflect.DeepEqual(got, c.want) {
			t.Errorf("restartArgs(%q) = %q, want %q", c.args, got, c.want)
		}
	}
}
