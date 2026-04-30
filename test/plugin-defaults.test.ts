import {
  getRetiredDefaultPluginIds,
  isRetiredDefaultPluginId,
} from "../app/utils/plugin-defaults";

function plugin(id: string) {
  return {
    id,
    title: id,
    version: "1.0.0",
    content: "{}",
    builtin: false,
    createdAt: 1,
  };
}

describe("default plugin sync", () => {
  test("removes retired bundled plugin ids from persisted state", () => {
    expect(
      getRetiredDefaultPluginIds(
        {
          dalle3: plugin("dalle3"),
          jinaurl: plugin("jinaurl"),
          custom: plugin("custom"),
        },
        [],
      ),
    ).toEqual(["dalle3", "jinaurl"]);
  });

  test("keeps active bundled plugin ids", () => {
    expect(
      getRetiredDefaultPluginIds(
        {
          dalle3: plugin("dalle3"),
        },
        ["dalle3"],
      ),
    ).toEqual([]);
  });

  test("identifies retired bundled plugin ids", () => {
    expect(isRetiredDefaultPluginId("dalle3")).toBe(true);
    expect(isRetiredDefaultPluginId("custom")).toBe(false);
  });
});
