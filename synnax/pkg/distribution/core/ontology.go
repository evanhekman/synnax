package core

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/schema"
	"go.uber.org/zap"
	"strconv"
)

const (
	nodeOntologyType    ontology.Type = "node"
	clusterOntologyType ontology.Type = "cluster"
)

// NodeOntologyID returns a unique identifier for a Node for use within a resource
// Ontology.
func NodeOntologyID(id NodeID) ontology.ID {
	return ontology.ID{Type: nodeOntologyType, Key: strconv.Itoa(int(id))}
}

func ClusterOntologyID(key uuid.UUID) ontology.ID {
	return ontology.ID{Type: clusterOntologyType, Key: key.String()}
}

var (
	_nodeSchema = &ontology.Schema{
		Type: nodeOntologyType,
		Fields: map[string]schema.Field{
			"id":      {Type: schema.Uint32},
			"address": {Type: schema.String},
			"state":   {Type: schema.Uint32},
		},
	}
	_clusterSchema = &ontology.Schema{
		Type: clusterOntologyType,
		Fields: map[string]schema.Field{
			"key": {Type: schema.String},
		},
	}
)

type NodeOntologyService struct {
	Logger   *zap.SugaredLogger
	Ontology *ontology.Ontology
	Cluster  Cluster
}

var _ ontology.Service = (*NodeOntologyService)(nil)

func (s *NodeOntologyService) ListenForChanges() {
	s.update(s.Cluster.PeekState())
	s.Cluster.OnChange(s.update)
}

func (s *NodeOntologyService) update(state ClusterState) {
	w := s.Ontology.NewWriter()
	clusterID := ClusterOntologyID(s.Cluster.Key())
	if err := w.DefineResource(clusterID); err != nil {
		s.Logger.Errorf("failed to define HostResolver resource: %v", err)
	}
	if err := w.DefineRelationship(ontology.Root, ontology.ParentOf, clusterID); err != nil {
		s.Logger.Errorf("failed to define HostResolver relationship: %v", err)
	}
	for _, n := range state.Nodes {
		nodeID := NodeOntologyID(n.ID)
		if err := w.DefineResource(NodeOntologyID(n.ID)); err != nil {
			s.Logger.Errorf("failed to define node resource: %v", err)
		}
		if err := w.DefineRelationship(clusterID, ontology.ParentOf, nodeID); err != nil {
			s.Logger.Errorf("failed to define HostResolver relationship: %v", err)
		}
	}
}

func (s *NodeOntologyService) Schema() *schema.Schema { return _nodeSchema }

func (s *NodeOntologyService) RetrieveEntity(key string) (schema.Entity, error) {
	id, err := strconv.Atoi(key)
	if err != nil {
		return schema.Entity{}, err
	}
	n, err := s.Cluster.Node(NodeID(id))
	return newNodeEntity(n), err
}

func newNodeEntity(n Node) schema.Entity {
	e := schema.NewEntity(_nodeSchema, fmt.Sprintf("Node %v", n.ID))
	schema.Set(e, "id", uint32(n.ID))
	schema.Set(e, "address", n.Address.String())
	schema.Set(e, "state", uint32(n.State))
	return e
}

type ClusterOntologyService struct {
	Cluster Cluster
}

var _ ontology.Service = (*ClusterOntologyService)(nil)

func (s *ClusterOntologyService) Schema() *schema.Schema { return _clusterSchema }

func (s *ClusterOntologyService) RetrieveEntity(_ string) (schema.Entity, error) {
	e := schema.NewEntity(_clusterSchema, "HostResolver")
	schema.Set(e, "key", s.Cluster.Key().String())
	return e, nil
}
