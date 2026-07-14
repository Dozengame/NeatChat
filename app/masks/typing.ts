import { ModelConfig } from "../store/config";
import { type Mask } from "../store/mask";

export type BuiltinMask = Omit<Mask, "modelConfig"> & {
  builtin: Boolean;
  modelConfig: Partial<ModelConfig>;
};
