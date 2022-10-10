package override

import (
	"github.com/samber/lo"
	"github.com/synnaxlabs/x/types"
	"reflect"
)

func Numeric[N types.Numeric](value N, override N) N {
	return lo.Ternary(override != 0, override, value)
}

func String[T ~string](value T, override T) T {
	return lo.Ternary(override != "", override, value)
}

func Nil[T any](value T, override T) T {
	overrideV := reflect.ValueOf(override)
	if overrideV.IsValid() && (isInterface[T]() || !overrideV.IsNil()) {
		return override
	}
	return value
}

func Slice[T any](value []T, override []T) []T {
	return lo.Ternary(len(override) > 0, override, value)
}

func isInterface[T any]() bool {
	return reflect.TypeOf((*T)(nil)).Elem().Kind() == reflect.Interface
}
