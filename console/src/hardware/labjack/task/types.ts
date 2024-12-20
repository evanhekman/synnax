// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { device, type task } from "@synnaxlabs/client";
import { z } from "zod";

import { outputChannelTypeZ } from "@/hardware/labjack/device/types";
import { thermocoupleTypeZ } from "@/hardware/task/common/thermocouple";

export const PREFIX = "labjack";

export const linearScaleZ = z.object({
  type: z.literal("linear"),
  slope: z.number(),
  offset: z.number(),
});

export type LinearScale = z.infer<typeof linearScaleZ>;

export const ZERO_LINEAR_SCALE: LinearScale = {
  type: "linear",
  slope: 1,
  offset: 0,
};

export const thermocoupleScaleZ = z.object({
  type: z.literal("thermocouple"),
  thermocoupleType: thermocoupleTypeZ,
});

export type ThermocoupleScale = z.infer<typeof thermocoupleScaleZ>;

export const ZERO_THERMOCOUPLE_SCALE: ThermocoupleScale = {
  type: "thermocouple",
  thermocoupleType: "K",
};

export const noScaleZ = z.object({
  type: z.literal("none"),
});

export type NoScale = z.infer<typeof noScaleZ>;

export const ZERO_NO_SCALE: NoScale = { type: "none" };

export const scaleZ = z.union([noScaleZ, linearScaleZ]);
export type Scale = z.infer<typeof scaleZ>;
export type ScaleType = Scale["type"];

export const ZERO_SCALES: Record<ScaleType, Scale> = {
  none: ZERO_NO_SCALE,
  linear: ZERO_LINEAR_SCALE,
};

export const SCALE_SCHEMAS: Record<ScaleType, z.ZodType<Scale>> = {
  none: noScaleZ,
  linear: linearScaleZ,
};

export const inputChan = z.object({
  port: z.string(),
  enabled: z.boolean(),
  key: z.string(),
  range: z.number().optional(),
  channel: z.number(),
  type: z.literal("AI").or(z.literal("DI")),
  scale: scaleZ,
});
export type InputChan = z.infer<typeof inputChan>;

export const temperatureUnitsZ = z.enum(["C", "F", "K"]);
export type TemperatureUnits = z.infer<typeof temperatureUnitsZ>;

export const thermocoupleChanZ = z.object({
  key: z.string(),
  port: z.string(),
  enabled: z.boolean(),
  channel: z.number(),
  range: z.number(),
  type: z.literal("TC"),
  thermocoupleType: thermocoupleTypeZ.or(z.literal("C")),
  posChan: z.number(),
  negChan: z.number(),
  cjcSource: z.string(),
  cjcSlope: z.number(),
  cjcOffset: z.number(),
  units: temperatureUnitsZ,
  scale: scaleZ,
});
export type ThermocoupleChan = z.infer<typeof thermocoupleChanZ>;
export type ThermocoupleChanType = ThermocoupleChan["type"];
export const ZERO_THERMOCOUPLE_CHAN: ThermocoupleChan = {
  port: "",
  enabled: true,
  key: "",
  channel: 0,
  range: 0,
  type: "TC",
  thermocoupleType: "K",
  posChan: 0,
  negChan: 199,
  units: "K",
  cjcSource: "TEMPERATURE_DEVICE_K",
  cjcSlope: 1,
  cjcOffset: 0,
  scale: ZERO_NO_SCALE,
};

export const readChan = z.union([inputChan, thermocoupleChanZ]);
export type ReadChan = z.infer<typeof readChan>;
export type ReadChanType = ReadChan["type"];

export const ZERO_READ_CHAN: ReadChan = {
  port: "AIN0",
  enabled: true,
  key: "",
  channel: 0,
  type: "AI",
  range: 0,
  scale: { type: "none" },
};

export const writeChan = z.object({
  type: outputChannelTypeZ,
  port: z.string(),
  enabled: z.boolean(),
  cmdKey: z.number(),
  stateKey: z.number(),
  key: z.string(),
});

export type WriteChan = z.infer<typeof writeChan>;
export type WriteChanType = WriteChan["type"];
export const ZERO_WRITE_CHAN: WriteChan = {
  port: "DIO4",
  enabled: true,
  key: "",
  cmdKey: 0,
  stateKey: 0,
  type: "DO",
};

const deviceKeyZ = device.deviceKeyZ.min(1, "Must specify a device");

export const readTaskConfigZ = z
  .object({
    device: deviceKeyZ,
    sampleRate: z.number().int().min(0).max(50000),
    streamRate: z.number().int().min(0).max(50000),
    channels: z.array(readChan),
    dataSaving: z.boolean(),
  })
  .refine(
    (cfg) =>
      // Ensure that the stream Rate is lower than the sample rate
      cfg.sampleRate >= cfg.streamRate,
    {
      path: ["streamRate"],
      message: "Stream rate must be less than or equal to the sample rate",
    },
  );
export type ReadTaskConfig = z.infer<typeof readTaskConfigZ>;

export const writeTaskConfigZ = z.object({
  device: deviceKeyZ,
  channels: z.array(writeChan),
  dataSaving: z.boolean(),
  stateRate: z.number().int().min(1).max(50000),
});
export type WriteTaskConfig = z.infer<typeof writeTaskConfigZ>;

export const baseReadStateDetailsZ = z.object({
  running: z.boolean(),
  message: z.string(),
});
type baseReadStateDetails = z.infer<typeof baseReadStateDetailsZ>;

export const errorReadStateDetailsZ = baseReadStateDetailsZ.extend({
  errors: z.array(
    z.object({
      message: z.string(),
      path: z.string(),
    }),
  ),
});
type ErrorReadStateDetails = z.infer<typeof errorReadStateDetailsZ>;

export type ReadStateDetails = baseReadStateDetails | ErrorReadStateDetails;

export const writeStateDetailsZ = z.object({ running: z.boolean() });
export type WriteStateDetails = z.infer<typeof writeStateDetailsZ>;

export const READ_TYPE = `${PREFIX}_read`;
export type ReadType = typeof READ_TYPE;

export const ZERO_READ_CONFIG: ReadTaskConfig = {
  device: "",
  sampleRate: 10,
  streamRate: 5,
  channels: [],
  dataSaving: true,
};
export type Read = task.Task<ReadTaskConfig, ReadStateDetails, ReadType>;
export type ReadPayload = task.Payload<ReadTaskConfig, ReadStateDetails, ReadType>;
export const ZERO_READ_PAYLOAD: ReadPayload = {
  key: "",
  name: "LabJack Read Task",
  config: ZERO_READ_CONFIG,
  type: READ_TYPE,
};

export const WRITE_TYPE = `${PREFIX}_write`;
export type WriteType = typeof WRITE_TYPE;

export const ZERO_WRITE_CONFIG: WriteTaskConfig = {
  device: "",
  channels: [],
  dataSaving: true,
  stateRate: 10,
};
export type Write = task.Task<WriteTaskConfig, WriteStateDetails, WriteType>;
export type WritePayload = task.Payload<WriteTaskConfig, WriteStateDetails, WriteType>;
export const ZERO_WRITE_PAYLOAD: WritePayload = {
  key: "",
  name: "LabJack Write Task",
  config: ZERO_WRITE_CONFIG,
  type: WRITE_TYPE,
};

export type Chan = ReadChan | WriteChan;
