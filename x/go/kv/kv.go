// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

// Package kv defines a general interface for a key-value store that provides support for get/set/delete operations
// as well as basic read-iteration. This package should be used as a boundary for separating an application from a
// specific storage implementation.
//
// For a general implementation of DB, see the pebblekv package.
// For an in-memory implementation of DB, see the memkv package.
package kv

import (
	"context"
	"github.com/cockroachdb/pebble"
	"github.com/synnaxlabs/alamos"
	"io"
)

// NotFound is returned when a key is not found in the DB store.
var NotFound = pebble.ErrNotFound

type IterValidityState = pebble.IterValidityState

// Reader is a readable key-value store.
type Reader interface {
	Context() context.Context
	// Get returns the value for the given key.
	Get(key []byte, opts ...interface{}) ([]byte, error)
	// NewIterator returns an Iterator using the given IteratorOptions.
	NewIterator(opts IteratorOptions) Iterator
}

type Readable interface {
	NewReader(ctx context.Context) Reader
}

type Writeable interface {
	NewWriter(ctx context.Context) Writer
}

// DB represents a general key-value store.
type DB interface {
	Readable
	Writeable
	io.Closer
	alamos.ReportProvider
}

func Get(ctx context.Context, db DB, key []byte) ([]byte, error) {
	return db.NewReader(ctx).Get(key)
}

func Set(ctx context.Context, db DB, key, value []byte) error {
	return db.NewWriter(ctx).Set(key, value)
}
