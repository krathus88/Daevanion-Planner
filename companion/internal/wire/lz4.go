package wire

import "errors"

var errLZ4 = errors.New("bad lz4 block")

// decodeLZ4 unpacks one raw LZ4 block (no frame header) into exactly size bytes.
func decodeLZ4(src []byte, size int) ([]byte, error) {
	dst := make([]byte, 0, size)
	i := 0

	for i < len(src) {
		token := src[i]
		i++

		literals := int(token >> 4)
		if literals == 15 {
			for {
				if i >= len(src) {
					return nil, errLZ4
				}
				extra := src[i]
				i++
				literals += int(extra)
				if extra != 255 {
					break
				}
			}
		}

		if i+literals > len(src) || len(dst)+literals > size {
			return nil, errLZ4
		}
		dst = append(dst, src[i:i+literals]...)
		i += literals

		// The last sequence has literals only.
		if i >= len(src) {
			break
		}

		if i+2 > len(src) {
			return nil, errLZ4
		}
		offset := int(src[i]) | int(src[i+1])<<8
		i += 2

		match := int(token & 15)
		if match == 15 {
			for {
				if i >= len(src) {
					return nil, errLZ4
				}
				extra := src[i]
				i++
				match += int(extra)
				if extra != 255 {
					break
				}
			}
		}
		match += 4

		start := len(dst) - offset
		if offset == 0 || start < 0 || len(dst)+match > size {
			return nil, errLZ4
		}
		// Byte by byte: a match may overlap the bytes it is copying.
		for k := 0; k < match; k++ {
			dst = append(dst, dst[start+k])
		}
	}

	if len(dst) != size {
		return nil, errLZ4
	}

	return dst, nil
}
