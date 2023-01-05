// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package password

import (
	"github.com/cockroachdb/errors"
)

var (
	Invalid     = errors.New("[synnax] - invalid credentials")
	InvalidHash = errors.New("[synnax] - invalid hash")
)

// Raw represents a raw password. It is not safe to store the raw password on disk.
// The password should be hashed by calling Hash before saving it.
type Raw string

func (r Raw) Hash() (h Hashed, err error) {
	for _, hasher := range Hashers {
		h, err = hasher.Hash(r)
		if err == nil {
			return h, nil
		}
	}
	return h, errors.CombineErrors(InvalidHash, err)
}

// Hashed represents an encrypted hash of a password. It is safe to store the hash on disk.
// The hash can be compared against a raw password by calling Validate.
type Hashed []byte

func (h Hashed) Validate(r Raw) (err error) {
	for _, hasher := range Hashers {
		err = hasher.Compare(r, h)
		if err == nil {
			return nil
		}
	}
	return errors.CombineErrors(Invalid, err)
}
