// Code generated by "stringer -type=IteratorCommand"; DO NOT EDIT.

package cesium

import "strconv"

func _() {
	// An "invalid array index" compiler error signifies that the constant values have changed.
	// Re-run the stringer command to generate them again.
	var x [1]struct{}
	_ = x[IterNext-1]
	_ = x[IterPrev-2]
	_ = x[IterFirst-3]
	_ = x[IterLast-4]
	_ = x[IterNextSpan-5]
	_ = x[IterPrevSpan-6]
	_ = x[IterReadView-7]
	_ = x[IterValid-8]
	_ = x[IterError-9]
	_ = x[IterSeekFirst-10]
	_ = x[IterSeekLast-11]
	_ = x[IterSeekLT-12]
	_ = x[IterSeekGE-13]
}

const _IteratorCommand_name = "IterNextIterPrevIterFirstIterLastIterNextSpanIterPrevSpanIterRangeIterValidIterErrorIterSeekFirstIterSeekLastIterSeekLTIterSeekGE"

var _IteratorCommand_index = [...]uint8{0, 8, 16, 25, 33, 45, 57, 66, 75, 84, 97, 109, 119, 129}

func (i IteratorCommand) String() string {
	i -= 1
	if i >= IteratorCommand(len(_IteratorCommand_index)-1) {
		return "IteratorCommand(" + strconv.FormatInt(int64(i+1), 10) + ")"
	}
	return _IteratorCommand_name[_IteratorCommand_index[i]:_IteratorCommand_index[i+1]]
}