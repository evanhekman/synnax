// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import { OntologyID } from "@synnaxlabs/client";
import type { OntologyResourceType } from "@synnaxlabs/client";
import { ONE_XY, ZERO_XY } from "@synnaxlabs/pluto";
import { AiFillDatabase } from "react-icons/ai";
import { MdOutlineDeviceHub, MdSensors } from "react-icons/md";

import { ClusterIcon } from "@/features/cluster";
import { LayoutPlacer } from "@/features/layout";
import { createVisualization } from "@/features/vis";

import { LineVis } from "../vis/components/line/types";

import { WorkspaceState } from "@/features/workspace";

export interface SelectionContext {
  id: OntologyID;
  placer: LayoutPlacer;
  workspace: WorkspaceState;
}

export interface ResourceType {
  type: OntologyResourceType;
  icon: ReactElement;
  onSelect?: (ctx: SelectionContext) => void;
  hasChildren: boolean;
}

export const resourceTypes: Record<string, ResourceType> = {
  builtin: {
    type: "builtin",
    icon: <AiFillDatabase />,
    hasChildren: true,
  },
  cluster: {
    type: "cluster",
    icon: <ClusterIcon />,
    hasChildren: true,
  },
  node: {
    type: "node",
    icon: <MdOutlineDeviceHub />,
    hasChildren: true,
  },
  channel: {
    type: "channel",
    icon: <MdSensors />,
    hasChildren: false,
    onSelect: ({ placer, id, workspace }: SelectionContext) => {
      placer(
        createVisualization<LineVis>({
          channels: {
            y1: [id.key],
            y2: [],
            y3: [],
            y4: [],
            x1: "",
          },
          ranges: {
            x1: workspace.activeRange != null ? [workspace.activeRange] : [],
          },
          zoom: ONE_XY,
          pan: ZERO_XY,
        })
      );
    },
  },
};