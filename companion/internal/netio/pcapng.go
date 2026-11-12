package netio

import (
	"bufio"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"time"
)

// Packet is one captured frame.
type Packet struct {
	Time time.Time
	Link int
	Data []byte
}

const (
	blockSection   = 0x0a0d0d0a
	blockInterface = 0x00000001
	blockSimple    = 0x00000003
	blockEnhanced  = 0x00000006
	byteOrderMagic = 0x1a2b3c4d
)

type pcapngInterface struct {
	link int
	// Units per second of the timestamps.
	resolution uint64
}

// ReadPcapng calls handle for every packet in a pcapng file (as Wireshark saves).
func ReadPcapng(r io.Reader, handle func(Packet)) error {
	br := bufio.NewReaderSize(r, 1<<20)
	var order binary.ByteOrder = binary.LittleEndian
	var interfaces []pcapngInterface

	for {
		var head [8]byte
		if _, err := io.ReadFull(br, head[:]); err != nil {
			if errors.Is(err, io.EOF) {
				return nil
			}
			return err
		}

		blockType := binary.LittleEndian.Uint32(head[0:4])
		if blockType == blockSection {
			// The byte order comes from the magic inside this block.
			var magic [4]byte
			if _, err := io.ReadFull(br, magic[:]); err != nil {
				return err
			}
			if binary.LittleEndian.Uint32(magic[:]) == byteOrderMagic {
				order = binary.LittleEndian
			} else if binary.BigEndian.Uint32(magic[:]) == byteOrderMagic {
				order = binary.BigEndian
			} else {
				return errors.New("not a pcapng file")
			}
			length := order.Uint32(head[4:8])
			if length < 16 {
				return errors.New("bad pcapng section")
			}
			if _, err := br.Discard(int(length) - 12); err != nil {
				return err
			}
			interfaces = nil
			continue
		}

		blockType = order.Uint32(head[0:4])
		length := order.Uint32(head[4:8])
		if length < 12 || length > 64<<20 {
			return fmt.Errorf("bad pcapng block length %d", length)
		}
		body := make([]byte, length-12)
		if _, err := io.ReadFull(br, body); err != nil {
			return err
		}
		if _, err := br.Discard(4); err != nil {
			return err
		}

		switch blockType {
		case blockInterface:
			if len(body) < 8 {
				return errors.New("bad interface block")
			}
			iface := pcapngInterface{link: int(order.Uint16(body[0:2])), resolution: 1_000_000}
			iface.resolution = readResolution(order, body[8:], iface.resolution)
			interfaces = append(interfaces, iface)
		case blockEnhanced:
			if len(body) < 20 {
				return errors.New("bad packet block")
			}
			id := order.Uint32(body[0:4])
			if int(id) >= len(interfaces) {
				return errors.New("packet for an unknown interface")
			}
			iface := interfaces[id]
			stamp := uint64(order.Uint32(body[4:8]))<<32 | uint64(order.Uint32(body[8:12]))
			captured := order.Uint32(body[12:16])
			if int(captured) > len(body)-20 {
				return errors.New("bad packet length")
			}
			handle(Packet{
				Time: toTime(stamp, iface.resolution),
				Link: iface.link,
				Data: body[20 : 20+captured],
			})
		case blockSimple:
			if len(interfaces) == 0 || len(body) < 4 {
				continue
			}
			original := order.Uint32(body[0:4])
			data := body[4:]
			if int(original) < len(data) {
				data = data[:original]
			}
			handle(Packet{Link: interfaces[0].link, Data: data})
		}
	}
}

func readResolution(order binary.ByteOrder, options []byte, fallback uint64) uint64 {
	for len(options) >= 4 {
		code := order.Uint16(options[0:2])
		length := int(order.Uint16(options[2:4]))
		if code == 0 || 4+length > len(options) {
			break
		}
		if code == 9 && length >= 1 {
			value := options[4]
			if value&0x80 != 0 {
				return 1 << (value & 0x7f)
			}
			resolution := uint64(1)
			for k := byte(0); k < value; k++ {
				resolution *= 10
			}
			return resolution
		}
		options = options[4+((length+3)&^3):]
	}

	return fallback
}

func toTime(stamp, resolution uint64) time.Time {
	seconds := stamp / resolution
	rest := stamp % resolution
	return time.Unix(int64(seconds), int64(rest*1_000_000_000/resolution))
}
