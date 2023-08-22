// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import { OS } from "@synnaxlabs/x";

import { MacOS } from "@/os/Controls/Mac";
import { InternalControlsProps } from "@/os/Controls/types";
import { Windows } from "@/os/Controls/Windows";
import { use } from "@/os/use";

const Variants: Record<OS, React.FC<InternalControlsProps>> = {
  MacOS,
  Windows,
  Linux: Windows,
  Docker: Windows,
};

const DEFAULT_OS = "Windows";

export interface ControlsProps extends InternalControlsProps {
  visibleIfOS?: OS;
}

export const Controls = ({
  forceOS,
  visibleIfOS,
  ...props
}: ControlsProps): ReactElement | null => {
  const os = use({ force: forceOS, default: DEFAULT_OS }) as OS;
  const C = Variants[os];
  if (visibleIfOS != null && visibleIfOS !== os) return null;
  return <C {...props} />;
};
