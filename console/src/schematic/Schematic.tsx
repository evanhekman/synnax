// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Dispatch, type PayloadAction } from "@reduxjs/toolkit";
import { useSelectWindowKey } from "@synnaxlabs/drift/react";
import { Icon } from "@synnaxlabs/media";
import {
  Button,
  Control,
  Diagram,
  Haul,
  Legend,
  Schematic as Core,
  Status,
  Text,
  Theming,
  Triggers,
  usePrevious,
  useSyncedRef,
  Viewport,
} from "@synnaxlabs/pluto";
import { box, deep, type UnknownRecord } from "@synnaxlabs/x";
import { useMutation } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { nanoid } from "nanoid";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";

import { useLoadRemote } from "@/hooks/useLoadRemote";
import { Layout } from "@/layout";
import { migrateState, STATES_Z } from "@/schematic/migrations";
import {
  select,
  useSelect,
  useSelectNodeProps,
  useSelectViewport,
  useSelectViewportMode,
} from "@/schematic/selectors";
import {
  addElement,
  calculatePos,
  copySelection,
  internalCreate,
  pasteSelection,
  setControlStatus,
  setEdges,
  setEditable,
  setElementProps,
  setFitViewOnResize,
  setLegend,
  setNodes,
  setRemoteCreated,
  setViewport,
  type State,
  toggleControl,
  ZERO_STATE,
} from "@/schematic/slice";
import { Workspace } from "@/workspace";

interface SyncPayload {
  key?: string;
}

export const HAUL_TYPE = "schematic-element";

const useSyncComponent = (layoutKey: string): Dispatch<PayloadAction<SyncPayload>> =>
  Workspace.useSyncComponent<SyncPayload>(
    "Schematic",
    layoutKey,
    async (ws, store, client) => {
      const s = store.getState();
      const data = select(s, layoutKey);
      if (data == null || data.snapshot) return;
      const la = Layout.selectRequired(s, layoutKey);
      const setData = {
        ...data,
        key: undefined,
        snapshot: undefined,
      } as unknown as UnknownRecord;
      if (!data.remoteCreated) store.dispatch(setRemoteCreated({ key: layoutKey }));
      await new Promise((r) => setTimeout(r, 1000));
      await client.workspaces.schematic.create(ws, {
        key: layoutKey,
        name: la.name,
        data: setData,
      });
    },
  );

const SymbolRenderer = ({
  symbolKey,
  position,
  selected,
  layoutKey,
}: Diagram.SymbolProps & { layoutKey: string }): ReactElement | null => {
  console.log("SymbolRenderer");
  const { key, ...props } = useSelectNodeProps(layoutKey, symbolKey);
  console.log("After useSelectNodeProps");
  const dispatch = useSyncComponent(layoutKey);
  console.log("After useSyncComponent");

  const handleChange = useCallback(
    (props: object) => {
      dispatch(
        setElementProps({
          layoutKey,
          key: symbolKey,
          props: { key, ...props },
        }),
      );
    },
    [dispatch, symbolKey, layoutKey, key],
  );

  const C = Core.SYMBOLS[key as Core.Variant];
  if (C == null) {
    throw new Error(`Symbol ${key} not found`);
  }

  const zoom = useSelectViewport(layoutKey);

  return (
    <C.Symbol
      aetherKey={symbolKey}
      position={position}
      selected={selected}
      onChange={handleChange}
      zoom={zoom.zoom}
      {...props}
    />
  );
};

export const Loaded: Layout.Renderer = ({ layoutKey }) => {
  const windowKey = useSelectWindowKey() as string;
  const { name } = Layout.useSelectRequired(layoutKey);
  const schematic = useSelect(layoutKey);

  const dispatch = useSyncComponent(layoutKey);
  const theme = Theming.use();
  const viewportRef = useSyncedRef(schematic.viewport);

  const prevName = usePrevious(name);
  useEffect(() => {
    if (prevName !== name) dispatch(Layout.rename({ key: layoutKey, name }));
  }, [name, prevName, layoutKey]);

  const handleEdgesChange: Diagram.DiagramProps["onEdgesChange"] = useCallback(
    (edges) => {
      dispatch(setEdges({ key: layoutKey, edges }));
    },
    [dispatch, layoutKey],
  );

  const handleNodesChange: Diagram.DiagramProps["onNodesChange"] = useCallback(
    (nodes) => {
      dispatch(setNodes({ key: layoutKey, nodes }));
    },
    [dispatch, layoutKey],
  );

  const handleViewportChange: Diagram.DiagramProps["onViewportChange"] = useCallback(
    (vp) => {
      dispatch(setViewport({ key: layoutKey, viewport: vp }));
    },
    [layoutKey],
  );

  const handleEditableChange: Diagram.DiagramProps["onEditableChange"] = useCallback(
    (cbk) => {
      dispatch(setEditable({ key: layoutKey, editable: cbk }));
    },
    [layoutKey],
  );

  const handleSetFitViewOnResize = useCallback(
    (v: boolean) => {
      dispatch(setFitViewOnResize({ key: layoutKey, fitViewOnResize: v }));
    },
    [layoutKey, dispatch],
  );

  const handleControlStatusChange = useCallback(
    (control: Control.Status) => {
      dispatch(setControlStatus({ key: layoutKey, control }));
    },
    [layoutKey],
  );

  const acquireControl = useCallback(
    (v: boolean) => {
      dispatch(
        toggleControl({
          key: layoutKey,
          status: v ? "acquired" : "released",
        }),
      );
    },
    [layoutKey],
  );

  const elRenderer = useCallback(
    (props: Diagram.SymbolProps) => {
      return <SymbolRenderer layoutKey={layoutKey} {...props} />;
    },
    [layoutKey],
  );

  const ref = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback(
    ({ items, event }: Haul.OnDropProps): Haul.Item[] => {
      const valid = Haul.filterByType(HAUL_TYPE, items);
      if (ref.current == null || event == null) return valid;
      const region = box.construct(ref.current);
      valid.forEach(({ key, data }) => {
        const spec = Core.SYMBOLS[key as Core.Variant];
        if (spec == null) return;
        const pos = calculatePos(
          region,
          { x: event.clientX, y: event.clientY },
          viewportRef.current,
        );
        dispatch(
          addElement({
            key: layoutKey,
            elKey: nanoid(),
            node: {
              position: pos,
              zIndex: spec.zIndex,
            },
            props: {
              key,
              ...spec.defaultProps(theme),
              ...(data ?? {}),
            },
          }),
        );
      });
      return valid;
    },
    [schematic.viewport, theme],
  );

  const dropProps = Haul.useDrop({
    type: "Schematic",
    key: layoutKey,
    canDrop: Haul.canDropOfType(HAUL_TYPE),
    onDrop: handleDrop,
  });

  const mode = useSelectViewportMode();
  const triggers = useMemo(() => Viewport.DEFAULT_TRIGGERS[mode], [mode]);

  Triggers.use({
    triggers: [
      ["Control", "V"],
      ["Control", "C"],
    ],
    region: ref,
    callback: useCallback(
      ({ triggers, cursor, stage }: Triggers.UseEvent) => {
        if (ref.current == null || stage !== "start") return;
        const region = box.construct(ref.current);
        const copy = triggers.some((t) => t.includes("C"));
        const pos = calculatePos(region, cursor, viewportRef.current);
        if (copy) dispatch(copySelection({ pos }));
        else dispatch(pasteSelection({ pos, key: layoutKey }));
      },
      [dispatch, layoutKey, viewportRef],
    ),
  });

  const handleDoubleClick = useCallback(() => {
    if (!schematic.editable) return;
    dispatch(
      Layout.setNavDrawerVisible({
        windowKey,
        key: "visualization",
        value: true,
      }) as PayloadAction<SyncPayload>,
    );
  }, [windowKey, dispatch, schematic.editable]);

  const [legendPosition, setLegendPosition] = useState<Legend.StickyXY>(
    schematic.legend.position,
  );

  const storeLegendPosition = useCallback(
    (position: Legend.StickyXY) => {
      dispatch(
        setLegend({
          key: layoutKey,
          legend: { position },
        }),
      );
    },
    [dispatch, layoutKey],
  );

  const handleLegendPositionChange = useCallback(
    (position: Legend.StickyXY) => {
      setLegendPosition(position);
      storeLegendPosition(position);
    },
    [storeLegendPosition],
  );

  return (
    <div
      ref={ref}
      onDoubleClick={handleDoubleClick}
      style={{ width: "inherit", height: "inherit", position: "relative" }}
    >
      <Control.Controller
        name={name}
        authority={1}
        acquireTrigger={schematic.controlAcquireTrigger}
        onStatusChange={handleControlStatusChange}
      >
        <Diagram.Diagram
          onViewportChange={handleViewportChange}
          edges={schematic.edges}
          nodes={schematic.nodes}
          viewport={schematic.viewport}
          onEdgesChange={handleEdgesChange}
          onNodesChange={handleNodesChange}
          onEditableChange={handleEditableChange}
          editable={schematic.editable}
          triggers={triggers}
          onDoubleClick={handleDoubleClick}
          fitViewOnResize={schematic.fitViewOnResize}
          setFitViewOnResize={handleSetFitViewOnResize}
          {...dropProps}
        >
          <Diagram.NodeRenderer>{elRenderer}</Diagram.NodeRenderer>
          <Diagram.Background />
          <Diagram.Controls>
            {!schematic.snapshot && (
              <Diagram.ToggleEditControl disabled={schematic.control === "acquired"} />
            )}
            <Diagram.FitViewControl />
            {!schematic.snapshot && (
              <Button.ToggleIcon
                value={schematic.control === "acquired"}
                onChange={acquireControl}
                tooltipLocation={{ x: "right", y: "center" }}
                variant="outlined"
                tooltip={
                  <Text.Text level="small">
                    {schematic.control === "acquired"
                      ? "Release control"
                      : "Acquire control"}
                  </Text.Text>
                }
              >
                <Icon.Circle />
              </Button.ToggleIcon>
            )}
          </Diagram.Controls>
        </Diagram.Diagram>
        <Control.Legend
          position={legendPosition}
          onPositionChange={handleLegendPositionChange}
        />
      </Control.Controller>
    </div>
  );
};

export const Schematic: Layout.Renderer = ({
  layoutKey,
  ...props
}): ReactElement | null => {
  const schematic = useLoadRemote({
    name: "Schematic",
    targetVersion: ZERO_STATE.version,
    layoutKey,
    useSelect: useSelect,
    fetcher: async (client, layoutKey) => {
      const { key, data } = await client.workspaces.schematic.retrieve(layoutKey);
      return { key, ...data } as unknown as State;
    },
    actionCreator: internalCreate,
  });
  if (schematic == null) return null;
  return <Loaded layoutKey={layoutKey} {...props} />;
};

export type LayoutType = "schematic";
export const LAYOUT_TYPE = "schematic";

export const SELECTABLE: Layout.Selectable = {
  key: LAYOUT_TYPE,
  title: "Schematic",
  icon: <Icon.Schematic />,
  create: (layoutKey: string) => create({ key: layoutKey }),
};

export const create =
  (initial: Partial<State> & Omit<Partial<Layout.State>, "type">): Layout.Creator =>
  ({ dispatch }) => {
    const { name = "Schematic", location = "mosaic", window, tab, ...rest } = initial;
    const key = initial.key ?? uuidv4();
    dispatch(internalCreate({ ...deep.copy(ZERO_STATE), key, ...rest }));
    return { key, location, name, type: LAYOUT_TYPE, window, tab };
  };

export interface ImportProps {
  filePath?: string;
}

export const useImport = (): ((props: ImportProps) => void) => {
  const addStatus = Status.useAggregator();
  const placeLayout = Layout.usePlacer();
  return useMutation<void, Error, ImportProps, void>({
    mutationFn: async ({ filePath }) => {
      let path = filePath;
      if (path == null) {
        const fileResponse = await open({
          directory: false,
          multiple: false,
          title: "Import schematic into Synnax",
        });
        if (fileResponse == null) return;
        path = fileResponse.path;
      }
      const file = await readFile(path);
      const fileName = path.split("/").pop();
      const importedStr = new TextDecoder().decode(file);
      const json = JSON.parse(importedStr);
      const z = STATES_Z.find((stateZ) => {
        return stateZ.safeParse(json).success;
      });
      if (z == null)
        throw new Error(
          (fileName != null ? `${fileName} is not` : `${filePath} is not a path to`) +
            " a valid schematic.",
        );
      const newState = migrateState(z.parse(json));
      placeLayout(
        create({
          ...newState,
          name: fileName?.split(".")[0] ?? "New Schematic",
        }),
      );
    },
    onError: (e) => {
      addStatus({
        key: nanoid(),
        variant: "error",
        message: "Failed to import schematic.",
        description: e.message,
      });
    },
  }).mutate;
};
