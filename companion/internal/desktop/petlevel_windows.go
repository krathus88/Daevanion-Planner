package desktop

import "strconv"

// soulsToLevel is the souls each Insight level takes to reach the next
// (game.SoulsToLevel).
var soulsToLevel = [3]int{5, 25, 75}

// levelText is how the shop panel shows a pet's level, like the site: the
// level in its color ("Locked" muted), then its souls toward the next level
// ("12/25"), none at Lv3 or for a locked pet without souls. A level below 0
// isn't known: "?".
func levelText(level, souls int) (label string, color uintptr, progress string) {
	switch {
	case level < 0:
		return "?", colorMuted, ""
	case level >= 3:
		return "Lv3", levelColors[3], ""
	case level == 0:
		label, color = "Locked", colorMuted
		if souls == 0 {
			return label, color, ""
		}
	default:
		label, color = "Lv"+strconv.Itoa(level), levelColors[level]
	}
	return label, color, strconv.Itoa(souls) + "/" + strconv.Itoa(soulsToLevel[level])
}
