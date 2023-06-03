// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import { useState } from "@storybook/addons";
import type { Meta, StoryFn } from "@storybook/react";
import { KeyedRenderableRecord } from "@synnaxlabs/x";

import { Select, SelectMultipleProps } from ".";

import { ListColumn } from "@/core/std/List";

const story: Meta<typeof Select.Multiple> = {
  title: "Core/Select",
  component: Select.Multiple,
};

const sampleData = Array.from({ length: 500 }).map((_, i) => ({
  key: `Option ${i}`,
  name: `strain-gauge-${i}`,
  dataType: "Float64",
  sampleRate: i,
}));

interface SampleRecord {
  key: string;
  sampleRate: number;
  name: string;
  dataType: string;
}

const sampleColumns: Array<ListColumn<SampleRecord>> = [
  {
    key: "name",
    name: "Name",
    visible: true,
  },
  {
    key: "dataType",
    name: "Data Type",
    visible: true,
  },
  {
    key: "sampleRate",
    name: "Sample Rate",
    visible: true,
  },
];

const MultipleTemplate = <E extends KeyedRenderableRecord<E>>(
  args: Omit<SelectMultipleProps<E>, "value" | "onChange">
): ReactElement => {
  const [value, setValue] = useState<readonly string[]>([]);
  return <Select.Multiple {...args} value={value} onChange={setValue} />;
};

export const Multiple: StoryFn<typeof Select.Multiple<SampleRecord>> =
  MultipleTemplate.bind({});

Multiple.args = {
  value: [],
  columns: sampleColumns,
  location: "bottom",
  data: sampleData,
};

const Template = (
  props: Omit<SelectMultipleProps<SampleRecord>, "value" | "onChange">
): ReactElement => {
  const [value, setValue] = useState<string>("");
  return <Select {...props} value={value} onChange={setValue} />;
};

export const Default: StoryFn<typeof Template> = Template.bind({});

Default.args = {
  columns: sampleColumns,
  location: "bottom",
  data: sampleData,
};

// eslint-disable-next-line import/no-default-export
export default story;
