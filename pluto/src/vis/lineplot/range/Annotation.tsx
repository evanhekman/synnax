import { Aether } from "@/aether";
import { range } from "@/vis/lineplot/range/aether";
import { z } from "zod";

interface AnnotationProps extends z.input<typeof range.annotationStateZ> {}

export const Annotation = Aether.wrap<AnnotationProps>(
  "Tooltip",
  ({ aetherKey, ...props }): null => {
    Aether.use({
      aetherKey,
      type: range.Annotation.TYPE,
      schema: range.annotationStateZ,
      initialState: props,
    });
    return null;
  },
);