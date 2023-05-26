// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { PropsWithChildren } from "react";

import { GLCanvas } from "@synnaxlabs/pluto";

import { TelemetryProvider } from "@/vis/telem";

import "./VisCanvas.css";

export const VisCanvas = ({ children }: PropsWithChildren): ReactElement => (
  <GLCanvas className="delta-vis__canvas">
    <TelemetryProvider>{children}</TelemetryProvider>
  </GLCanvas>
);
