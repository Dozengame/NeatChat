import { IconButton } from "@/app/components/button";
import Locale from "@/app/locales";
import { useSdStore } from "@/app/store/sd";

import styles from "./sd-panel.module.scss";
import { ControlParam } from "./control-param";
import { ControlParamItem } from "./control-param-item";
import { getModelParamBasicData, getParams, models } from "./sd-panel-models";

export function SdPanel() {
  const sdStore = useSdStore();
  const currentModel = sdStore.currentModel;
  const setCurrentModel = sdStore.setCurrentModel;
  const currentParams = sdStore.currentParams;
  const setParams = sdStore.setCurrentParams;

  const handleValueChange = (field: string, val: any) => {
    setParams({
      ...currentParams,
      [field]: val,
    });
  };
  const handleModelChange = (model: any) => {
    setCurrentModel(model);
    setParams(getModelParamBasicData(model.params({}), currentParams));
  };

  return (
    <>
      <ControlParamItem title={Locale.SdPanel.AIModel}>
        <div className={styles["ai-models"]}>
          {models.map((item) => {
            return (
              <IconButton
                text={item.name}
                key={item.value}
                type={currentModel.value == item.value ? "primary" : null}
                shadow
                onClick={() => handleModelChange(item)}
              />
            );
          })}
        </div>
      </ControlParamItem>
      <ControlParam
        columns={getParams?.(currentModel, currentParams) as any[]}
        data={currentParams}
        onChange={handleValueChange}
      ></ControlParam>
    </>
  );
}
