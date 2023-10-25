// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import {
  Input,
  Select,
  Align,
  Tabs,
  componentRenderProp,
  useMemoCompare,
  compareArrayDeps,
  Text,
} from "@synnaxlabs/pluto";
import { type direction } from "@synnaxlabs/x";
import { useDispatch } from "react-redux";

import { useSelect } from "@/lineplot/selectors";
import { type AxisState, setAxis, shouldDisplayAxis } from "@/lineplot/slice";
import { type Vis } from "@/vis";

export interface AxesProps {
  layoutKey: string;
}

export const Axes = ({ layoutKey }: AxesProps): ReactElement => {
  const vis = useSelect(layoutKey);

  const shouldShow = Object.values(vis.axes)
    .filter((a) => shouldDisplayAxis(a.key, vis))
    .map((a) => a.key);

  const tabs = useMemoCompare(
    () =>
      shouldShow.map((key) => ({
        tabKey: key,
        name: key.toUpperCase(),
      })),
    compareArrayDeps,
    [shouldShow] as [string[]],
  );

  const t = Tabs.useStatic({
    tabs,
  });

  return (
    <Tabs.Tabs {...t} size="small">
      {(p) => {
        return (
          <LinePlotAxisControls
            key={p.tabKey}
            axisKey={p.tabKey as Vis.AxisKey}
            layoutKey={layoutKey}
          />
        );
      }}
    </Tabs.Tabs>
  );
};

export interface LinePlotAxisControlsProps {
  axisKey: Vis.AxisKey;
  layoutKey: string;
}

export const LinePlotAxisControls = ({
  axisKey,
  layoutKey,
}: LinePlotAxisControlsProps): ReactElement => {
  const dispatch = useDispatch();
  const axis = useSelect(layoutKey).axes[axisKey];

  const handleChange = (axis: AxisState): void => {
    dispatch(setAxis({ key: layoutKey, axisKey, axis }));
  };

  const handleLabelChange: Input.Control<string>["onChange"] = (value: string) => {
    handleChange({ ...axis, label: value });
  };

  const handleLowerBoundChange: Input.Control<number>["onChange"] = (value: number) => {
    handleChange({ ...axis, bounds: { ...axis.bounds, lower: value } });
  };

  const handleUpperBoundChange: Input.Control<number>["onChange"] = (value: number) => {
    handleChange({ ...axis, bounds: { ...axis.bounds, upper: value } });
  };

  const handleLabelDirectionChange: Input.Control<"x" | "y">["onChange"] = (value) => {
    handleChange({ ...axis, labelDirection: value });
  };

  const handleTickSpacingChange: Input.Control<number>["onChange"] = (value) => {
    handleChange({ ...axis, tickSpacing: value });
  };

  const handleLabelLevelChange: Input.Control<Text.Level>["onChange"] = (value) => {
    handleChange({ ...axis, labelLevel: value });
  };

  return (
    <Align.Space direction="y" style={{ padding: "2rem" }} size="small">
      <Align.Space direction="x">
        <Input.Item<number, number, Input.NumericProps>
          label="Lower Bound"
          value={axis.bounds.upper}
          onChange={handleUpperBoundChange}
          resetValue={0}
          dragScale={AXES_BOUNDS_DRAG_SCALE}
          grow
        >
          {componentRenderProp(Input.Numeric)}
        </Input.Item>
        <Input.Item<number, number, Input.NumericProps>
          label="Upper Bound"
          value={axis.bounds.lower}
          onChange={handleLowerBoundChange}
          resetValue={0}
          dragScale={AXES_BOUNDS_DRAG_SCALE}
          style={{ flexGrow: 1 }}
        >
          {componentRenderProp(Input.Numeric)}
        </Input.Item>
        <Input.Item<number, number, Input.NumericProps>
          label="Tick Spacing"
          value={axis.tickSpacing}
          onChange={handleTickSpacingChange}
          resetValue={75}
          dragScale={AXES_BOUNDS_DRAG_SCALE}
          bounds={{ lower: 1, upper: 200 }}
          grow
        >
          {componentRenderProp(Input.Numeric)}
        </Input.Item>
      </Align.Space>
      <Align.Space direction="x">
        <Input.Item<string, string, Input.TextProps>
          label="Label"
          value={axis.label}
          placeholder={axisKey.toUpperCase()}
          onChange={handleLabelChange}
          grow
        />

        <Input.Item<direction.Direction, direction.Direction, Select.DirectionProps>
          label="Label Direction"
          value={axis.labelDirection}
          onChange={handleLabelDirectionChange}
          style={{ minWidth: 90 }}
        >
          {componentRenderProp(Select.Direction)}
        </Input.Item>
        <Input.Item<Text.Level, Text.Level, Text.SelectLevelProps>
          label="Label Size"
          value={axis.labelLevel}
          onChange={handleLabelLevelChange}
        >
          {componentRenderProp(Text.SelectLevel)}
        </Input.Item>
      </Align.Space>
    </Align.Space>
  );
};

const AXES_BOUNDS_DRAG_SCALE = {
  x: 0.1,
  y: 0.1,
};
