// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement, useCallback, useMemo, useState } from "react";

import { Box, XY } from "@synnaxlabs/x";
import ReactFlow, {
  Handle,
  NodeProps,
  Position,
  ReactFlowProvider,
  Viewport,
  useOnViewportChange,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  Background,
  SmoothStepEdge,
  Controls,
} from "reactflow";

import { Valve } from "../Valve/main";

import { Aether } from "@/core/aether/main";
import { useResize } from "@/core/hooks";
import { PID as WorkerPID, pidState } from "@/core/vis/pid/worker";
import { Value } from "@/core/vis/Value/main";
import { StaticTelem } from "@/telem/static/main";

const ValueNode = (props: NodeProps): ReactElement => {
  const telem = StaticTelem.usePoint(12000);
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Value
        label="Regen PT"
        telem={telem}
        units="psi"
        position={{ x: props.xPos, y: props.yPos }}
        selected={props.selected}
      />
      <Handle type="source" position={Position.Right} />
    </>
  );
};

const ValveNode = (props: NodeProps): ReactElement => {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Valve />
      <Handle type="source" position={Position.Right} />
    </>
  );
};

const n = [
  { id: "node-1", type: "value", position: { x: 250, y: 250 }, data: {} },
  { id: "node-2", type: "value", position: { x: 400, y: 500 }, data: {} },
  { id: "node-3", type: "valve", position: { x: 800, y: 500 }, data: {} },
];

const PIDInternal = (): ReactElement => {
  const nodeType = useMemo(() => ({ value: ValueNode, valve: ValveNode }), []);
  const edgeType = useMemo(() => ({ default: SmoothStepEdge }), []);
  const {
    path,
    state: [, setState],
  } = Aether.use(
    WorkerPID.TYPE,
    {
      position: XY.ZERO,
      region: Box.ZERO,
    },
    pidState
  );

  const [nodes, setNodes] = useState(n);
  const [edges, setEdges] = useState([]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const resizeRef = useResize((box) => {
    setState((prev) => ({ ...prev, region: box }));
  }, {});

  const handleViewport = useCallback((viewport: Viewport): void => {
    setState((prev) => ({ ...prev, position: new XY(viewport.x, viewport.y) }));
  }, []);

  useOnViewportChange({
    onStart: handleViewport,
    onChange: handleViewport,
    onEnd: handleViewport,
  });

  return (
    <Aether.Composite path={path}>
      <ReactFlow
        nodeTypes={nodeType}
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        ref={resizeRef}
        edgeTypes={edgeType}
        // panOnDrag={false}
        panOnScroll={false}
        minZoom={1}
        maxZoom={1}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </Aether.Composite>
  );
};

export const PID = (): ReactElement => {
  return (
    <ReactFlowProvider>
      <PIDInternal />
    </ReactFlowProvider>
  );
};
