// Command replay reads a Wireshark capture and prints the snapshots the
// companion would upload, for checking the decoding against known values.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"time"

	"daevanion-companion/internal/netio"
	"daevanion-companion/internal/pipeline"
	"daevanion-companion/internal/record"
	"daevanion-companion/internal/state"
)

func main() {
	logPath := flag.String("log", "", "also write the messages to this log, like the companion's -record")
	flag.Parse()
	if flag.NArg() != 1 {
		fmt.Fprintln(os.Stderr, "usage: replay [-log file] <capture.pcapng>")
		os.Exit(2)
	}

	file, err := os.Open(flag.Arg(0))
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer file.Close()

	tracker := state.NewTracker()
	var clock time.Time
	tracker.Log = func(format string, args ...any) {
		fmt.Printf("%s  %s\n", clock.Format("15:04:05"), fmt.Sprintf(format, args...))
	}
	p := pipeline.New(tracker)
	if *logPath != "" {
		recorder, path, err := record.Create(*logPath, time.Now())
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		defer recorder.Close()
		p.OnMessage = recorder.Message
		fmt.Printf("Writing the messages to %s\n", path)
	}

	err = netio.ReadPcapng(file, func(packet netio.Packet) {
		clock = packet.Time
		p.Packet(packet)
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	fmt.Printf("%d messages\n", p.Messages)
	out, _ := json.MarshalIndent(tracker.All(), "", "  ")
	fmt.Println(string(out))
}
