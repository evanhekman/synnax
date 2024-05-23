import { device } from "@synnaxlabs/client";
import { z } from "zod";

export const connectionConfigZ = z.object({
  endpoint: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type ConnectionConfig = z.infer<typeof connectionConfigZ>;

export const nodeProperties = z.object({
  dataType: z.string(),
  name: z.string(),
  nodeId: z.string(),
});

export type NodeProperties = z.infer<typeof nodeProperties>;

export const propertiesZ = z.object({
  connection: connectionConfigZ,
  channels: nodeProperties.array(),
});

export type Properties = z.infer<typeof propertiesZ>;

export type Device = device.Device<Properties>;

export const channelConfigZ = z
  .object({
    key: z.string(),
    dataType: z.string(),
    name: z.string(),
    nodeId: z.string().optional(),
    isIndex: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isIndex && !data.nodeId) {
      ctx.addIssue({
        code: "custom",
        path: ["nodeId"],
        message: "Data channels must have a node ID",
      });
    }
    return true;
  })
  .transform((data) => {
    return data;
  })
  .superRefine((data, ctx) => {
    if (data.isIndex && data.dataType !== "timestamp") {
      console.log(data.dataType);
      ctx.addIssue({
        code: "custom",
        path: ["dataType"],
        message: "Index channels must have a data type of timestamp",
      });
    }
    return true;
  });

export type ChannelConfig = z.infer<typeof channelConfigZ>;

export const groupConfigZ = z
  .object({
    key: z.string(),
    name: z.string(),
    channels: channelConfigZ.array(),
  })
  .superRefine((data, ctx) => {
    const indexes: [ChannelConfig, number][] = [];
    console.log("ABC");
    data.channels.forEach((channel, i) => {
      if (channel.isIndex) indexes.push([channel, i]);
    });
    if (indexes.length > 1) {
      const found = indexes.map(([i]) => i.name).join(", ");
      ctx.addIssue({
        code: "custom",
        path: ["channels"],
        message: `Only one index channel is allowed per group, found: ${found}`,
      });
      indexes.forEach(([c, i]) => {
        ctx.addIssue({
          code: "custom",
          path: ["channels", i],
          message: `Only one index channel is allowed per group, found: ${found}`,
        });
      });
    } else if (indexes.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["channels"],
        message: "A group must have at least one index channel",
      });
    }
  });

export type GroupConfig = z.infer<typeof groupConfigZ>;
