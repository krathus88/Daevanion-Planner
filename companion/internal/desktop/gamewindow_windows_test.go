package desktop

import (
	"encoding/binary"
	"testing"
)

type tcpRow struct {
	state      uint32
	remotePort uint16
	pid        uint32
}

// tcpTable builds a MIB_TCPTABLE_OWNER_PID with the given rows.
func tcpTable(rows ...tcpRow) []byte {
	table := make([]byte, 4+24*len(rows))
	binary.LittleEndian.PutUint32(table, uint32(len(rows)))
	for i, row := range rows {
		at := 4 + i*24
		binary.LittleEndian.PutUint32(table[at:], row.state)
		binary.BigEndian.PutUint16(table[at+8:], 50000)
		binary.BigEndian.PutUint16(table[at+16:], row.remotePort)
		binary.LittleEndian.PutUint32(table[at+20:], row.pid)
	}
	return table
}

func TestOwnerOfRemotePort(t *testing.T) {
	table := tcpTable(
		tcpRow{state: tcpStateEstablished, remotePort: 443, pid: 10},
		tcpRow{state: 2, remotePort: 13328, pid: 20},
		tcpRow{state: tcpStateEstablished, remotePort: 13328, pid: 30},
	)
	if pid := ownerOfRemotePort(table, 13328); pid != 30 {
		t.Errorf("got %d, want 30", pid)
	}
	if pid := ownerOfRemotePort(table, 8080); pid != 0 {
		t.Errorf("got %d for a port nobody uses, want 0", pid)
	}
}

func TestOwnerOfRemotePortShortTables(t *testing.T) {
	full := tcpTable(tcpRow{state: tcpStateEstablished, remotePort: 13328, pid: 30})
	for name, table := range map[string][]byte{
		"empty":         nil,
		"count only":    full[:4],
		"truncated row": full[:len(full)-1],
	} {
		if pid := ownerOfRemotePort(table, 13328); pid != 0 {
			t.Errorf("%s: got %d, want 0", name, pid)
		}
	}
}
