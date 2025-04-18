// Copyright 2025 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { LabJack } from "@/hardware/labjack";
import { NI } from "@/hardware/ni";
import { OPC } from "@/hardware/opc";
import { type Layout } from "@/layout";
import { type Palette } from "@/palette";

export * from "@/hardware/device/notifications";
export * from "@/hardware/device/ontology";
export * from "@/hardware/device/Toolbar";
export * from "@/hardware/device/useListenForChanges";

export const COMMANDS: Palette.Command[] = OPC.Device.COMMANDS;

export const LAYOUTS: Record<string, Layout.Renderer> = {
  ...LabJack.Device.LAYOUTS,
  ...NI.Device.LAYOUTS,
  ...OPC.Device.LAYOUTS,
};
