// Copyright 2022 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import type { CSSProperties, FunctionComponent } from "react";
import React from "react";

import { RenderableRecord } from "@/util/record";

type RenderF<E extends RenderableRecord<E> = RenderableRecord> = FunctionComponent<{
  key: string | number | symbol;
  entry: E;
  style: CSSProperties;
}>;

export interface ListColumn<E extends RenderableRecord<E> = RenderableRecord> {
  key: keyof E;
  render?: RenderF<E>;
  label: string;
  visible?: boolean;
  width?: number;
}

export interface ListItemProps<E extends RenderableRecord<E>> {
  key: string | number;
  entry: E;
  index: number;
  style: React.CSSProperties;
  selected: boolean;
  columns: Array<ListColumn<E>>;
  onSelect?: (key: string) => void;
}
