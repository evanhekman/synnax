// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { migrate } from "@synnaxlabs/x";

import * as v0 from "@/layout/migrations/v0";
import * as v3 from "@/layout/migrations/v3";
import * as v4 from "@/layout/migrations/v4";

export type State<A = any> = v0.State<A>;
export type SliceState = v4.SliceState;
export type NavDrawerLocation = v0.NavDrawerLocation;
export type NavDrawerEntryState = v0.NavDrawerEntryState;
export type WindowProps = v0.WindowProps;
export type AnyState<A = any> = v0.State<A>;
export type AnySliceState =
  | v0.SliceState
  | v3.SliceState
  | (Omit<v3.SliceState, "version"> & { version: "0.2.0" })
  | (Omit<v3.SliceState, "version"> & { version: "0.1.0" })
  | v4.SliceState;

export const SLICE_MIGRATIONS: migrate.Migrations = {
  "0.0.0": v3.sliceMigration,
  "0.1.0": v3.sliceMigration,
  "0.2.0": v3.sliceMigration,
  "0.3.0": v3.sliceMigration,
  "3.0.0": v4.sliceMigration,
};

export const ZERO_SLICE_STATE = v4.ZERO_SLICE_STATE;
export const ZERO_MOSAIC_STATE = v0.ZERO_MOSAIC_STATE;
export const MAIN_LAYOUT = v0.MAIN_LAYOUT;

export const migrateSlice = migrate.migrator<AnySliceState, SliceState>({
  name: "layout.slice",
  migrations: SLICE_MIGRATIONS,
  def: ZERO_SLICE_STATE,
});
