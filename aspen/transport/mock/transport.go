// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package mock

import (
	"github.com/synnaxlabs/alamos"
	"github.com/synnaxlabs/aspen"
	"github.com/synnaxlabs/aspen/internal/cluster/gossip"
	"github.com/synnaxlabs/aspen/internal/cluster/pledge"
	"github.com/synnaxlabs/aspen/internal/kv"
	"github.com/synnaxlabs/freighter"
	"github.com/synnaxlabs/freighter/fmock"
	"github.com/synnaxlabs/x/address"
	"github.com/synnaxlabs/x/signal"
	"go/types"
)

type Network struct {
	pledge     *fmock.Network[pledge.Request, pledge.Response]
	cluster    *fmock.Network[gossip.Message, gossip.Message]
	operations *fmock.Network[kv.WriteRequest, kv.WriteRequest]
	lease      *fmock.Network[kv.WriteRequest, types.Nil]
	feedback   *fmock.Network[kv.FeedbackMessage, types.Nil]
}

func NewNetwork() *Network {
	return &Network{
		pledge:     fmock.NewNetwork[pledge.Request, pledge.Response](),
		cluster:    fmock.NewNetwork[gossip.Message, gossip.Message](),
		operations: fmock.NewNetwork[kv.WriteRequest, kv.WriteRequest](),
		lease:      fmock.NewNetwork[kv.WriteRequest, types.Nil](),
		feedback:   fmock.NewNetwork[kv.FeedbackMessage, types.Nil](),
	}
}

func (n *Network) NewTransport() aspen.Transport { return &transport{net: n} }

// transport is an in-memory, synchronous implementation of aspen.transport.
type transport struct {
	net            *Network
	pledgeServer   *fmock.UnaryServer[pledge.Request, pledge.Response]
	pledgeClient   *fmock.UnaryClient[pledge.Request, pledge.Response]
	clusterServer  *fmock.UnaryServer[gossip.Message, gossip.Message]
	clusterClient  *fmock.UnaryClient[gossip.Message, gossip.Message]
	batchServer    *fmock.UnaryServer[kv.WriteRequest, kv.WriteRequest]
	batchClient    *fmock.UnaryClient[kv.WriteRequest, kv.WriteRequest]
	leaseServer    *fmock.UnaryServer[kv.WriteRequest, types.Nil]
	leaseClient    *fmock.UnaryClient[kv.WriteRequest, types.Nil]
	feedbackServer *fmock.UnaryServer[kv.FeedbackMessage, types.Nil]
	feedbackClient *fmock.UnaryClient[kv.FeedbackMessage, types.Nil]
}

// Configure implements aspen.transport.
func (t *transport) Configure(ctx signal.Context, addr address.Address, external bool) error {
	t.pledgeServer = t.net.pledge.UnaryServer(addr)
	t.pledgeClient = t.net.pledge.UnaryClient()
	t.clusterServer = t.net.cluster.UnaryServer(addr)
	t.clusterClient = t.net.cluster.UnaryClient()
	t.batchServer = t.net.operations.UnaryServer(addr)
	t.batchClient = t.net.operations.UnaryClient()
	t.leaseServer = t.net.lease.UnaryServer(addr)
	t.leaseClient = t.net.lease.UnaryClient()
	t.feedbackServer = t.net.feedback.UnaryServer(addr)
	t.feedbackClient = t.net.feedback.UnaryClient()
	return nil
}

func (t *transport) PledgeClient() pledge.TransportClient { return t.pledgeClient }

func (t *transport) PledgeServer() pledge.TransportServer { return t.pledgeServer }

func (t *transport) GossipClient() gossip.TransportClient { return t.clusterClient }

func (t *transport) GossipServer() gossip.TransportServer { return t.clusterServer }

func (t *transport) BatchClient() kv.BatchTransportClient { return t.batchClient }

func (t *transport) BatchServer() kv.BatchTransportServer { return t.batchServer }

func (t *transport) LeaseClient() kv.LeaseTransportClient { return t.leaseClient }

func (t *transport) LeaseServer() kv.LeaseTransportServer { return t.leaseServer }

func (t *transport) FeedbackClient() kv.FeedbackTransportClient { return t.feedbackClient }

func (t *transport) FeedbackServer() kv.FeedbackTransportServer { return t.feedbackServer }

func (t *transport) Use(middleware ...freighter.Middleware) {
	t.pledgeClient.Use(middleware...)
	t.pledgeServer.Use(middleware...)
	t.clusterClient.Use(middleware...)
	t.clusterServer.Use(middleware...)
	t.batchClient.Use(middleware...)
	t.batchServer.Use(middleware...)
	t.leaseClient.Use(middleware...)
	t.leaseServer.Use(middleware...)
	t.feedbackClient.Use(middleware...)
	t.feedbackServer.Use(middleware...)
}

func (t *transport) Report() alamos.Report {
	return t.pledgeClient.Report()
}
