// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in
// the file licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business
// Source License, use of this software will be governed by the Apache License,
// Version 2.0, included in the file licenses/APL.txt.

import { migrate } from "@synnaxlabs/x";
import { z } from "zod";

import * as v2 from "@/schematic/migrations/v1";

const VERSION = "3.0.0";
type Version = typeof VERSION;

export const stateZ = v2.stateZ.omit({ version: true }).extend({
  version: z.literal(VERSION),
  key: z.string(),
  type: z.literal("schematic"),
});

export interface State extends Omit<v2.State, "version"> {
  version: Version;
  key: string;
  type: "schematic";
}

export const ZERO_STATE: State = {
  ...v2.ZERO_STATE,
  version: VERSION,
  key: "",
  type: "schematic",
};

export const sliceStateZ = v2.sliceStateZ.omit({ version: true }).extend({
  version: z.literal(VERSION),
});

export interface SliceState extends Omit<v2.SliceState, "version" | "schematics"> {
  schematics: Record<string, State>;
  version: Version;
}

export const stateMigration = migrate.createMigration<v2.State, State>({
  name: "schematic.state",
  migrate: (state) => ({
    ...state,
    edges: state.edges.map((edge) => ({
      ...edge,
      segments: [],
    })),
    version: VERSION,
    key: "",
    type: "schematic",
  }),
});

export const sliceMigration = migrate.createMigration<v2.SliceState, SliceState>({
  name: "schematic.slice",
  migrate: (sliceState) => ({
    ...sliceState,
    schematics: Object.fromEntries(
      Object.entries(sliceState.schematics).map(([key, state]) => [
        key,
        {
          ...stateMigration(state),
          key,
        },
      ]),
    ),
    version: VERSION,
  }),
});

export const ZERO_SLICE_STATE: SliceState = {
  ...v2.ZERO_SLICE_STATE,
  version: VERSION,
  schematics: {},
};
