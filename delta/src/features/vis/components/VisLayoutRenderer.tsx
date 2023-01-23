// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { memo } from "react";

import { UnexpectedError } from "@synnaxlabs/client";
import { useDispatch } from "react-redux";

import { setVis, useSelectSVis } from "../store";
import { Vis } from "../types";

import { LayoutRenderer, LayoutRendererProps } from "@/features/layout";

import { LinePlot } from "./line/LinePlot";
import { LineSVis } from "./line/types";

export const VisLayoutRenderer: LayoutRenderer = {
  Renderer: memo(({ layoutKey }: LayoutRendererProps) => {
    const vis = useSelectSVis(layoutKey);
    if (vis == null) throw new UnexpectedError(`Visualization not found: ${layoutKey}`);
    const dispatch = useDispatch();

    const onChange = (vis: Vis): void => {
      dispatch(setVis(vis));
    };

    switch (vis.variant) {
      case "linePlot":
        return (
          <LinePlot vis={vis as LineSVis} onChange={onChange} resizeDebounce={100} />
        );
    }
    return <h1>No Visualization Found</h1>;
  }),
};
VisLayoutRenderer.Renderer.displayName = "VisualizationLayoutRenderer";