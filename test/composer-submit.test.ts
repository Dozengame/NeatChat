import { getComposerSubmitState } from "../app/utils/composer-submit";

describe("Composer 2.2 submit control", () => {
  const idle = {
    hasContent: false,
    uploading: false,
    readOnly: false,
    loading: false,
    streamingMessageIds: [] as string[],
  };

  test("enables Send only for submittable idle content", () => {
    expect(getComposerSubmitState(idle)).toBe("disabled");
    expect(getComposerSubmitState({ ...idle, hasContent: true })).toBe("send");
  });

  test("keeps upload, read-only, and preflight loading states disabled", () => {
    expect(
      getComposerSubmitState({ ...idle, hasContent: true, uploading: true }),
    ).toBe("disabled");
    expect(
      getComposerSubmitState({ ...idle, hasContent: true, readOnly: true }),
    ).toBe("disabled");
    expect(
      getComposerSubmitState({ ...idle, hasContent: true, loading: true }),
    ).toBe("disabled");
  });

  test("gives current-session Stop precedence over every Send condition", () => {
    expect(
      getComposerSubmitState({
        ...idle,
        uploading: true,
        readOnly: true,
        loading: true,
        streamingMessageIds: ["assistant-message"],
      }),
    ).toBe("stop");
  });
});
