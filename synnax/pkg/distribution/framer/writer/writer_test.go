// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package writer_test

import (
	"context"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/synnax/pkg/distribution/channel"
	dcore "github.com/synnaxlabs/synnax/pkg/distribution/core"
	"github.com/synnaxlabs/synnax/pkg/distribution/framer/core"
	"github.com/synnaxlabs/synnax/pkg/distribution/framer/writer"
	"github.com/synnaxlabs/x/query"
	"github.com/synnaxlabs/x/telem"
	. "github.com/synnaxlabs/x/testutil"
	"github.com/synnaxlabs/x/validate"
	"go.uber.org/zap"
	"io"
)

var _ = Describe("Writer", func() {
	Describe("Happy Path", Ordered, func() {
		scenarios := []func() scenario{
			gatewayOnlyScenario,
			peerOnlyScenario,
			mixedScenario,
		}
		for _, sF := range scenarios {
			_sF := sF
			var s scenario
			BeforeAll(func() { s = _sF() })
			AfterAll(func() { Expect(s.close.Close()).To(Succeed()) })
			Specify("It should write and commit data", func() {
				writer := MustSucceed(s.service.New(context.TODO(), writer.Config{
					Keys:  s.keys,
					Start: 10 * telem.SecondTS,
				}))
				Expect(writer.Write(core.NewFrame(
					s.keys,
					[]telem.Array{
						telem.NewArrayV[int64](1, 2, 3),
						telem.NewArrayV[int64](3, 4, 5),
						telem.NewArrayV[int64](5, 6, 7),
					}),
				)).To(BeTrue())
				Expect(writer.Commit()).To(BeTrue())
				Expect(writer.Error()).To(Succeed())
				Expect(writer.Write(core.NewFrame(
					s.keys,
					[]telem.Array{
						telem.NewArrayV[int64](1, 2, 3),
						telem.NewArrayV[int64](3, 4, 5),
						telem.NewArrayV[int64](5, 6, 7),
					}),
				)).To(BeTrue())
				Expect(writer.Commit()).To(BeTrue())
				Expect(writer.Error()).To(Succeed())
				Expect(writer.Close()).To(Succeed())
			})
		}
	})
	Describe("open Errors", Ordered, func() {
		var s scenario
		BeforeAll(func() { s = gatewayOnlyScenario() })
		AfterAll(func() { Expect(s.close.Close()).To(Succeed()) })
		It("Should return an error if no keys are provided", func() {
			_, err := s.service.New(context.TODO(), writer.Config{
				Keys:  []channel.Key{},
				Start: 10 * telem.SecondTS,
			})
			Expect(err).To(HaveOccurredAs(validate.Error))
			Expect(err.Error()).To(ContainSubstring("keys"))
		})
		It("Should return an error if the channel can't be found", func() {
			_, err := s.service.New(context.TODO(), writer.Config{
				Keys: []channel.Key{
					channel.NewKey(0, 22),
					s.keys[0],
				},
				Start: 10 * telem.SecondTS,
			})
			Expect(err).To(HaveOccurredAs(query.NotFound))
			Expect(err.Error()).To(ContainSubstring("channel"))
			Expect(err.Error()).To(ContainSubstring("22"))
			Expect(err.Error()).ToNot(ContainSubstring("1"))
		})
		It("Should return an error if two keys do not share the same rate", func() {
			ch := channel.Channel{Rate: 2 * telem.Hz, DataType: telem.Int64T}
			Expect(s.channel.Create(&ch)).To(Succeed())
			_, err := s.service.New(context.TODO(), writer.Config{
				Keys: []channel.Key{s.keys[0], ch.Key()},
			})
			Expect(err).To(HaveOccurredAs(validate.Error))
			Expect(err.Error()).To(ContainSubstring("rate"))
		})
		It("Should return an error if two keys do not share the same index", func() {
			indexes := []channel.Channel{
				{DataType: telem.TimeStampT, IsIndex: true},
				{DataType: telem.TimeStampT, IsIndex: true},
			}
			Expect(s.channel.CreateMany(&indexes)).To(Succeed())
			channels := []channel.Channel{
				{DataType: telem.Int64T, LocalIndex: indexes[0].StorageKey},
				{DataType: telem.Int64T, LocalIndex: indexes[1].StorageKey},
			}
			Expect(s.channel.CreateMany(&channels)).To(Succeed())
			_, err := s.service.New(context.TODO(), writer.Config{
				Keys: []channel.Key{
					channels[0].Key(),
					channels[1].Key(),
				},
			})
			Expect(err).To(HaveOccurredAs(validate.Error))
			Expect(err.Error()).To(ContainSubstring("index"))
		})
	})
	Describe("Frame Errors", Ordered, func() {
		var s scenario
		BeforeAll(func() { s = peerOnlyScenario() })
		AfterAll(func() { Expect(s.close.Close()).To(Succeed()) })
		It("Should return an error if a key is provided that is not in the list of keys provided to the writer", func() {
			writer := MustSucceed(s.service.New(context.TODO(), writer.Config{
				Keys:  s.keys,
				Start: 10 * telem.SecondTS,
			}))
			Expect(writer.Write(core.NewFrame(
				append(s.keys, channel.NewKey(12, 22)),
				[]telem.Array{
					telem.NewArrayV[int64](1, 2, 3),
					telem.NewArrayV[int64](3, 4, 5),
					telem.NewArrayV[int64](5, 6, 7),
					telem.NewArrayV[int64](5, 6, 7),
				}),
			)).To(BeTrue())
			Expect(writer.Commit()).To(BeFalse())
			Expect(writer.Error()).To(HaveOccurredAs(validate.Error))
			Expect(writer.Error()).To(BeNil())
			Expect(writer.Error()).To(BeNil())
			Expect(writer.Close()).To(Succeed())
		})
	})
})

type scenario struct {
	keys    channel.Keys
	service *writer.Service
	channel channel.Service
	close   io.Closer
}

func newChannelSet() []channel.Channel {
	return []channel.Channel{
		{
			Name:     "test1",
			Rate:     1 * telem.Hz,
			DataType: telem.Int64T,
		},
		{
			Name:     "test2",
			Rate:     1 * telem.Hz,
			DataType: telem.Int64T,
		},
		{
			Name:     "test3",
			Rate:     1 * telem.Hz,
			DataType: telem.Int64T,
		},
	}
}

func gatewayOnlyScenario() scenario {
	channels := newChannelSet()
	builder, services := provision(1, zap.NewNop())
	svc := services[1]
	Expect(svc.channel.CreateMany(&channels)).To(Succeed())
	keys := channel.KeysFromChannels(channels)
	return scenario{
		keys:    keys,
		service: svc.writer,
		close:   builder,
		channel: svc.channel,
	}
}

func peerOnlyScenario() scenario {
	channels := newChannelSet()
	builder, services := provision(4, zap.NewNop())
	svc := services[1]
	for i, ch := range channels {
		ch.NodeID = dcore.NodeID(i + 2)
		channels[i] = ch
	}
	Expect(svc.channel.CreateMany(&channels)).To(Succeed())
	Eventually(func(g Gomega) {
		var chs []channel.Channel
		err := svc.channel.NewRetrieve().Entries(&chs).WhereKeys(channel.KeysFromChannels(channels)...).Exec(context.TODO())
		g.Expect(err).To(Succeed())
		g.Expect(chs).To(HaveLen(len(channels)))
	}).Should(Succeed())
	keys := channel.KeysFromChannels(channels)
	return scenario{
		keys:    keys,
		service: svc.writer,
		close:   builder,
		channel: svc.channel,
	}
}

func mixedScenario() scenario {
	channels := newChannelSet()
	builder, services := provision(3, zap.NewNop())
	svc := services[1]
	for i, ch := range channels {
		ch.NodeID = dcore.NodeID(i + 1)
		channels[i] = ch
	}
	Expect(svc.channel.CreateMany(&channels)).To(Succeed())
	Eventually(func(g Gomega) {
		var chs []channel.Channel
		err := svc.channel.NewRetrieve().Entries(&chs).WhereKeys(channel.KeysFromChannels(channels)...).Exec(context.TODO())
		g.Expect(err).To(Succeed())
		g.Expect(chs).To(HaveLen(len(channels)))
	}).Should(Succeed())
	keys := channel.KeysFromChannels(channels)
	return scenario{
		keys:    keys,
		service: svc.writer,
		close:   builder,
		channel: svc.channel,
	}
}