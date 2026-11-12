// Package pipeline turns captured packets into tracker updates.
package pipeline

import (
	"time"

	"daevanion-companion/internal/netio"
	"daevanion-companion/internal/state"
	"daevanion-companion/internal/wire"
)

// GamePort is the TCP port of the game and Abyss servers.
const GamePort = 13328

// CaptureFilter keeps only what the server sends.
const CaptureFilter = "tcp src port 13328"

type stream struct {
	assembler netio.Assembler
	decoder   *wire.Decoder
}

// Pipeline owns one stream per server connection.
type Pipeline struct {
	tracker *state.Tracker
	streams map[netio.Flow]*stream
	// Messages read, for the status line.
	Messages int
	// Called for every message, before the tracker (to record a session).
	OnMessage func(conn string, m wire.Message, at time.Time)
}

// New feeds tracker.
func New(tracker *state.Tracker) *Pipeline {
	return &Pipeline{tracker: tracker, streams: make(map[netio.Flow]*stream)}
}

// Packet handles one captured frame.
func (p *Pipeline) Packet(packet netio.Packet) {
	segment, ok := netio.ParseSegment(packet.Link, packet.Data)
	if !ok || segment.Src.Port != GamePort {
		return
	}

	flow := netio.Flow{Src: segment.Src, Dst: segment.Dst}
	key := flow.String()
	s := p.streams[flow]

	if s == nil || segment.SYN {
		s = &stream{decoder: wire.NewDecoderMidway()}
		if segment.SYN {
			s.decoder = wire.NewDecoder()
		}
		p.streams[flow] = s
		p.tracker.Closed(key)
	}

	result := s.assembler.Add(segment, packet.Time)
	if result.Lost {
		s.decoder.Lost()
	}
	for _, data := range result.Data {
		for _, m := range s.decoder.Feed(data) {
			p.Messages++
			if p.OnMessage != nil {
				p.OnMessage(key, m, packet.Time)
			}
			p.tracker.Handle(key, m, packet.Time)
		}
	}

	if segment.Closing {
		delete(p.streams, flow)
		p.tracker.Closed(key)
	}
}
