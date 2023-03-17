// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { RefObject, useCallback, useRef } from "react";

import { Box, ClientXY, toXY, XY, ZERO_XY } from "@synnaxlabs/x";

import { useTrigger } from "./hooks";
import { Trigger, TriggerCallback, TriggerEvent } from "./triggers";

export interface TriggerDragEvent extends TriggerEvent {
  box: Box;
  cursor: XY;
  triggers: Trigger[];
}

export type TriggerDragCallback = (props: TriggerDragEvent) => void;

export interface UseCursorDragProps {
  bound: RefObject<HTMLElement>;
  triggers?: Trigger[];
  onDrag: TriggerDragCallback;
}

export const useTriggerDrag = ({
  onDrag,
  triggers = [["MouseLeft"], ["MouseRight"]],
  bound,
}: UseCursorDragProps): void => {
  const triggerRef = useRef<TriggerEvent | null>(null);
  const startLoc = useRef<XY>(ZERO_XY);
  const onMove = useCallback(
    (e: ClientXY & { buttons: number }) => {
      const cursor = toXY(e);
      if (triggerRef.current === null) return;
      const { target, triggers } = triggerRef.current;
      onDrag({
        target,
        box: new Box(startLoc.current, cursor),
        cursor,
        triggers,
        stage: "during",
      });
    },
    [onDrag]
  );
  const handleTrigger = useCallback<TriggerCallback>(
    (event) => {
      const { stage, cursor } = event;
      if (stage === "start") {
        onDrag({ box: new Box(cursor), ...event });
        window.addEventListener("mousemove", onMove);
        triggerRef.current = event;
        startLoc.current = cursor;
      } else if (stage === "end") {
        onDrag({ box: new Box(startLoc.current, cursor), ...event });
        window.removeEventListener("mousemove", onMove);
        triggerRef.current = null;
        startLoc.current = ZERO_XY;
      }
    },
    [onDrag]
  );
  useTrigger(triggers, handleTrigger, bound);
};