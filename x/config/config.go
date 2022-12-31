// Copyright 2022 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

// Package config implements standardization utilities for managing service
// configurations.
package config

// Config represents a configuration for a service that can be validated and
// override. Config is a recursive type, meaning that the type argument to C
// must be the config itself.
type Config[C any] interface {
	// Override sets all non-zero values from override on the config and returns
	// the merged result.
	Override(override C) C
	// Validate checks if the configuration is valid. Returns an error if it is
	// not.
	Validate() error
}

func OverrideAndValidate[C Config[C]](base C, overrides ...C) (C, error) {
	for _, override := range overrides {
		base = base.Override(override)
	}
	return base, base.Validate()
}

func BoolPointer(b bool) *bool { return &b }
