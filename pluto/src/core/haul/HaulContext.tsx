// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  createContext,
  MutableRefObject,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Deep } from "@synnaxlabs/x";

import { useStateRef } from "@/core/hooks/useStateRef";

export interface Hauled {
  key: string;
  type: string;
}

export interface HaulContextValue {
  startDrag: (entities: Hauled[]) => void;
  endDrag: () => void;
  dragging: Hauled[];
}

const HaulContext = createContext<HaulContextValue | null>(null);

export const useHaulContext = (): HaulContextValue => {
  const ctx = useContext(HaulContext);
  if (ctx == null) throw new Error("HaulContext not available");
  return ctx;
};

export const useOptionalHaulContext = (): HaulContextValue | null =>
  useContext(HaulContext);

export interface HaulProviderProps extends PropsWithChildren {}

interface HaulState {
  dragging: Hauled[];
}

const ZERO_HAUL_STATE = { dragging: [] };

export const HaulProvider = ({ children }: HaulProviderProps): ReactElement => {
  const ctx = useOptionalHaulContext();
  const [state, setState] = useState<HaulState>(Deep.copy(ZERO_HAUL_STATE));

  const startDrag = useCallback(
    (entities: Hauled[]) => setState((p) => ({ ...p, dragging: entities })),
    [setState]
  );

  const endDrag = useCallback(
    () => setState((p) => ({ ...p, dragging: [] })),
    [setState]
  );

  return (
    <HaulContext.Provider
      value={
        ctx ?? {
          dragging: state.dragging,
          startDrag,
          endDrag,
        }
      }
    >
      {children}
    </HaulContext.Provider>
  );
};

export interface UseHaulStateReturn extends HaulContextValue {}

export const useHaulState = (): UseHaulStateReturn => {
  return useHaulContext();
};

export interface UseHaulRefReturn extends Omit<HaulContextValue, "dragging"> {
  dragging: MutableRefObject<Hauled[]>;
}

export const useHaulRef = (): UseHaulRefReturn => {
  const [ref, setRef] = useStateRef<Hauled[]>([]);
  const { startDrag, endDrag, dragging } = useHaulContext();
  useEffect(() => setRef(dragging), [setRef, dragging]);

  return useMemo(
    () => ({
      dragging: ref,
      startDrag,
      endDrag,
    }),
    [ref, startDrag, endDrag]
  );
};
