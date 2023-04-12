// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package kv

import (
	"context"
	"github.com/samber/lo"
	"github.com/synnaxlabs/x/address"
	"github.com/synnaxlabs/x/confluence"
	kvx "github.com/synnaxlabs/x/kv"
	"github.com/synnaxlabs/x/version"
	"go.uber.org/zap"
)

// |||||| FILTER ||||||

type versionFilter struct {
	Config
	memKV      kvx.DB
	acceptedTo address.Address
	rejectedTo address.Address
	confluence.BatchSwitch[TxRequest, TxRequest]
}

func newVersionFilter(cfg Config, acceptedTo address.Address, rejectedTo address.Address) segment {
	s := &versionFilter{Config: cfg, acceptedTo: acceptedTo, rejectedTo: rejectedTo, memKV: cfg.Engine}
	s.BatchSwitch.ApplySwitch = s._switch
	return s
}

func (vc *versionFilter) _switch(
	_ context.Context,
	b TxRequest,
	o map[address.Address]TxRequest,
) error {
	var (
		rejected = TxRequest{Sender: b.Sender, doneF: b.doneF, ctx: b.ctx, span: b.span}
		accepted = TxRequest{Sender: b.Sender, doneF: b.doneF, ctx: b.ctx, span: b.span}
	)
	ctx, span := vc.T.Debug(b.ctx, "tx-filter")
	defer span.End()
	for _, op := range b.Operations {
		if vc.filter(ctx, op) {
			accepted.Operations = append(accepted.Operations, op)
		} else {
			rejected.Operations = append(rejected.Operations, op)
		}
	}
	if len(accepted.Operations) > 0 {
		o[vc.acceptedTo] = accepted
	}
	if len(rejected.Operations) > 0 {
		o[vc.rejectedTo] = rejected
	}
	return nil
}

func (vc *versionFilter) filter(ctx context.Context, op Operation) bool {
	dig, err := getDigestFromKV(ctx, vc.memKV, op.Key)
	if err != nil {
		dig, err = getDigestFromKV(ctx, vc.Engine, op.Key)
		if err != nil {
			return err == kvx.NotFound
		}
	}
	// If the versions of the operation are equal, we select a winning operation
	// based the which leasehold is higher.
	return lo.Ternary(
		op.Version.EqualTo(dig.Version),
		op.Leaseholder > dig.Leaseholder,
		op.Version.OlderThan(dig.Version),
	)
}

func getDigestFromKV(ctx context.Context, kve kvx.DB, key []byte) (Digest, error) {
	dig := Digest{}
	key, err := digestKey(key)
	if err != nil {
		return dig, err
	}
	b, err := kve.Get(ctx, key)
	if err != nil {
		return dig, err
	}
	return dig, ecd.Decode(ctx, b, &dig)
}

// |||||| ASSIGNER ||||||

const versionCounterKey = "ver"

type versionAssigner struct {
	Config
	counter *kvx.PersistedCounter
	confluence.LinearTransform[TxRequest, TxRequest]
}

func newVersionAssigner(ctx context.Context, cfg Config) (segment, error) {
	c, err := kvx.OpenCounter(ctx, cfg.Engine, []byte(versionCounterKey))
	v := &versionAssigner{Config: cfg, counter: c}
	v.LinearTransform.Transform = v.assign
	return v, err
}

func (va *versionAssigner) assign(_ context.Context, br TxRequest) (TxRequest, bool, error) {
	latestVer := va.counter.Value()
	if _, err := va.counter.Add(int64(br.size())); err != nil {
		va.L.Error("failed to assign version", zap.Error(err))
		return TxRequest{}, false, nil
	}
	for i := range br.Operations {
		br.Operations[i].Version = version.Counter(latestVer + int64(i) + 1)
	}
	return br, true, nil
}
