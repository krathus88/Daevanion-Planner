// Package netio reads TCP segments out of captured link-layer frames and puts
// each connection's bytes back in order.
package netio

import (
	"encoding/binary"
	"fmt"
)

// Link types the capture can hand us.
const (
	LinkEthernet = 1
	LinkRaw      = 101
)

const (
	flagFIN = 0x01
	flagSYN = 0x02
	flagRST = 0x04
)

// Segment is one TCP segment.
type Segment struct {
	Src, Dst Endpoint
	Seq      uint32
	SYN      bool
	Closing  bool
	Payload  []byte
}

// Endpoint is an IPv4 address and port.
type Endpoint struct {
	IP   [4]byte
	Port uint16
}

func (e Endpoint) String() string {
	return fmt.Sprintf("%d.%d.%d.%d:%d", e.IP[0], e.IP[1], e.IP[2], e.IP[3], e.Port)
}

// Flow names one direction of one connection.
type Flow struct {
	Src, Dst Endpoint
}

func (f Flow) String() string {
	return f.Src.String() + " > " + f.Dst.String()
}

// ParseSegment reads an IPv4 TCP segment from a frame of the given link type.
func ParseSegment(link int, frame []byte) (Segment, bool) {
	ip := frame

	switch link {
	case LinkEthernet:
		if len(frame) < 14 {
			return Segment{}, false
		}
		etherType := binary.BigEndian.Uint16(frame[12:14])
		offset := 14
		// One or two VLAN tags.
		for (etherType == 0x8100 || etherType == 0x88a8) && len(frame) >= offset+4 {
			etherType = binary.BigEndian.Uint16(frame[offset+2 : offset+4])
			offset += 4
		}
		if etherType != 0x0800 {
			return Segment{}, false
		}
		ip = frame[offset:]
	case LinkRaw:
	default:
		return Segment{}, false
	}

	if len(ip) < 20 || ip[0]>>4 != 4 || ip[9] != 6 {
		return Segment{}, false
	}
	headerLength := int(ip[0]&0x0f) * 4
	totalLength := int(binary.BigEndian.Uint16(ip[2:4]))
	// Fragments other than the first carry no TCP header.
	if binary.BigEndian.Uint16(ip[6:8])&0x1fff != 0 {
		return Segment{}, false
	}
	if headerLength < 20 || totalLength < headerLength {
		return Segment{}, false
	}
	// Some capture paths report 0 for offloaded segments.
	if totalLength == 0 || totalLength > len(ip) {
		totalLength = len(ip)
	}

	tcp := ip[headerLength:totalLength]
	if len(tcp) < 20 {
		return Segment{}, false
	}
	dataOffset := int(tcp[12]>>4) * 4
	if dataOffset < 20 || dataOffset > len(tcp) {
		return Segment{}, false
	}
	flags := tcp[13]

	var segment Segment
	copy(segment.Src.IP[:], ip[12:16])
	copy(segment.Dst.IP[:], ip[16:20])
	segment.Src.Port = binary.BigEndian.Uint16(tcp[0:2])
	segment.Dst.Port = binary.BigEndian.Uint16(tcp[2:4])
	segment.Seq = binary.BigEndian.Uint32(tcp[4:8])
	segment.SYN = flags&flagSYN != 0
	segment.Closing = flags&(flagFIN|flagRST) != 0
	segment.Payload = tcp[dataOffset:]

	return segment, true
}
