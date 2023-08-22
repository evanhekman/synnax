// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement, memo, useCallback } from "react";

import { Logo } from "@synnaxlabs/media";
import { Mosaic, useDebouncedCallback } from "@synnaxlabs/pluto";
import type { CrudeLocation } from "@synnaxlabs/x";
import { useDispatch } from "react-redux";

import {
  useSelectMosaic,
  moveLayoutMosaicTab,
  selectLayoutMosaicTab,
  resizeLayoutMosaicTab,
  renameLayout,
  removeLayout,
} from "@/layout/store";
import { createVis } from "@/vis";

import { useLayoutPlacer } from "../hooks";

import { LayoutContent } from "./LayoutContent";

const emptyContent = <Logo.Watermark />;

/** LayoutMosaic renders the central layout mosaic of the application. */
export const LayoutMosaic = memo((): ReactElement => {
  const dispatch = useDispatch();
  const [windowKey, mosaic] = useSelectMosaic();
  const placer = useLayoutPlacer();

  const handleDrop = useCallback(
    (key: number, tabKey: string, loc: CrudeLocation): void => {
      dispatch(moveLayoutMosaicTab({ key, tabKey, loc, windowKey }));
    },
    [dispatch, windowKey]
  );

  const handleClose = useCallback(
    (tabKey: string): void => {
      dispatch(removeLayout(tabKey));
    },
    [dispatch]
  );

  const handleSelect = useCallback(
    (tabKey: string): void => {
      dispatch(selectLayoutMosaicTab({ tabKey }));
    },
    [dispatch]
  );

  const handleRename = useCallback(
    (tabKey: string, name: string): void => {
      dispatch(renameLayout({ key: tabKey, name }));
    },
    [dispatch]
  );

  const handleResize = useDebouncedCallback(
    (key, size) => {
      dispatch(resizeLayoutMosaicTab({ key, size, windowKey }));
    },
    100,
    [dispatch, windowKey]
  );

  const handleCreate = useCallback(
    (mosaicKey: number) => {
      placer(createVis({ tab: { mosaicKey } }));
    },
    [placer]
  );

  return (
    <Mosaic.Mosaic
      root={mosaic}
      onDrop={handleDrop}
      onClose={handleClose}
      onSelect={handleSelect}
      onResize={handleResize}
      emptyContent={emptyContent}
      onRename={handleRename}
      onCreate={handleCreate}
      size="medium"
    >
      {(tab) => <LayoutContent key={tab.tabKey} layoutKey={tab.tabKey} />}
    </Mosaic.Mosaic>
  );
});
LayoutMosaic.displayName = "LayoutMosaic";
