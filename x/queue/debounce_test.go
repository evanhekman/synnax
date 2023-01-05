// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package queue_test

import (
	"context"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/queue"
	"github.com/synnaxlabs/x/signal"
	"time"
)

var _ = Describe("Debounce", func() {
	var (
		req    confluence.Stream[[]int]
		res    confluence.Stream[[]int]
		d      *queue.Debounce[int]
		ctx    signal.Context
		cancel context.CancelFunc
	)
	BeforeEach(func() {
		d = &queue.Debounce[int]{
			Config: queue.DebounceConfig{
				FlushInterval:  30 * time.Millisecond,
				FlushThreshold: 15,
			},
		}
		req = confluence.NewStream[[]int](10)
		res = confluence.NewStream[[]int](10)
		ctx, cancel = signal.TODO()
		d.InFrom(req)
		d.OutTo(res)
		d.Flow(ctx, confluence.CloseInletsOnExit())
	})
	AfterEach(func() { cancel() })
	It("Should flush the queue at a specified interval", func() {
		req.Inlet() <- []int{1, 2, 3, 4, 5}
		req.Inlet() <- []int{6, 7, 8, 9, 10}
		time.Sleep(50 * time.Millisecond)
		req.Close()
		Expect(ctx.Wait()).To(Succeed())
		responses := <-res.Outlet()
		Expect(responses).To(Equal([]int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}))
	})
	It("Should flush teh queue when the threshold is reached", func() {
		req.Inlet() <- []int{1, 2, 3, 4, 5}
		req.Inlet() <- []int{6, 7, 8, 9, 10}
		req.Inlet() <- []int{11, 12, 13, 14, 15}
		req.Close()
		Expect(ctx.Wait()).To(Succeed())
		responses := <-res.Outlet()
		Expect(responses).To(Equal([]int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}))
	})
})
