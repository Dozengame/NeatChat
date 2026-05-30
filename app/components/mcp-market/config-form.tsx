import AddIcon from "../../icons/add.svg";
import DeleteIcon from "../../icons/delete.svg";
import Locale from "../../locales";
import type { PresetServer } from "../../mcp/types";
import { useRef } from "react";
import { IconButton } from "../button";
import styles from "../mcp-market.module.scss";
import { List, ListItem } from "../ui-lib";
import type { ConfigProperty } from "./helpers";

interface ConfigFormProps {
  preset?: PresetServer;
  userConfig: Record<string, any>;
  onUserConfigChange: (userConfig: Record<string, any>) => void;
}

function readArrayValue(userConfig: Record<string, any>, key: string) {
  const value = userConfig[key];
  return Array.isArray(value) ? value : [];
}

let fallbackRowId = 0;

function createRowId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  fallbackRowId += 1;
  return `mcp-config-row-${fallbackRowId}`;
}

export function ConfigForm({
  preset,
  userConfig,
  onUserConfigChange,
}: ConfigFormProps) {
  const rowIdsRef = useRef<Record<string, string[]>>({});

  if (!preset?.configSchema) return null;

  const getRows = (key: string, values: string[]) => {
    const existingIds = rowIdsRef.current[key] ?? [];
    const ids = values.map((_, index) => existingIds[index] ?? createRowId());

    if (ids.length !== existingIds.length) {
      rowIdsRef.current = { ...rowIdsRef.current, [key]: ids };
    }

    return values.map((value, index) => ({
      id: ids[index],
      index,
      value,
    }));
  };

  const removeRowId = (key: string, index: number) => {
    const existingIds = rowIdsRef.current[key] ?? [];
    rowIdsRef.current = {
      ...rowIdsRef.current,
      [key]: existingIds.filter((_id, itemIndex) => itemIndex !== index),
    };
  };

  return (
    <List>
      {Object.entries(preset.configSchema.properties).map(
        ([key, prop]: [string, ConfigProperty]) => {
          if (prop.type === "array") {
            const currentValue = readArrayValue(userConfig, key);
            const itemLabel = prop.itemLabel || key;

            return (
              <ListItem
                key={key}
                title={key}
                subTitle={prop.description}
                vertical
              >
                <div className={styles["path-list"]}>
                  {getRows(key, currentValue).map((row) => (
                    <div key={row.id} className={styles["path-item"]}>
                      <input
                        type="text"
                        aria-label={`${key} ${row.index + 1}`}
                        value={row.value}
                        placeholder={`${itemLabel} ${row.index + 1}`}
                        onChange={(event) => {
                          onUserConfigChange({
                            ...userConfig,
                            [key]: currentValue.map((item, itemIndex) =>
                              itemIndex === row.index
                                ? event.target.value
                                : item,
                            ),
                          });
                        }}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        className={styles["delete-button"]}
                        onClick={() => {
                          removeRowId(key, row.index);
                          onUserConfigChange({
                            ...userConfig,
                            [key]: currentValue.filter(
                              (_item, itemIndex) => itemIndex !== row.index,
                            ),
                          });
                        }}
                      />
                    </div>
                  ))}
                  <IconButton
                    icon={<AddIcon />}
                    text={Locale.Mcp.Market.ConfigModal.AddItem.replace(
                      "{0}",
                      itemLabel,
                    )}
                    className={styles["add-button"]}
                    bordered
                    onClick={() => {
                      onUserConfigChange({
                        ...userConfig,
                        [key]: [...currentValue, ""],
                      });
                    }}
                  />
                </div>
              </ListItem>
            );
          }

          if (prop.type === "string") {
            const currentValue = userConfig[key] || "";
            return (
              <ListItem key={key} title={key} subTitle={prop.description}>
                <input
                  aria-label={key}
                  type="text"
                  value={currentValue}
                  placeholder={Locale.Mcp.Market.ConfigModal.InputPlaceholder.replace(
                    "{0}",
                    key,
                  )}
                  onChange={(event) => {
                    onUserConfigChange({
                      ...userConfig,
                      [key]: event.target.value,
                    });
                  }}
                />
              </ListItem>
            );
          }

          return null;
        },
      )}
    </List>
  );
}
