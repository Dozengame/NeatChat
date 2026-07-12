import {
  createAbortTimeout,
  withAbortTimeout,
  withAbortTimeoutResponse,
} from "../app/utils/request-timeout";
import fs from "fs";
import path from "path";

describe("request timeout lifecycle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("clears the timer after a resolved operation", async () => {
    const controller = new AbortController();

    await expect(
      withAbortTimeout({
        controller,
        timeoutMs: 1_000,
        operation: async () => "ok",
      }),
    ).resolves.toBe("ok");

    expect(jest.getTimerCount()).toBe(0);
    jest.runOnlyPendingTimers();
    expect(controller.signal.aborted).toBe(false);
  });

  test("clears the timer after a rejected operation", async () => {
    const controller = new AbortController();
    const error = new Error("network failed");

    await expect(
      withAbortTimeout({
        controller,
        timeoutMs: 1_000,
        operation: async () => {
          throw error;
        },
      }),
    ).rejects.toBe(error);

    expect(jest.getTimerCount()).toBe(0);
    jest.runOnlyPendingTimers();
    expect(controller.signal.aborted).toBe(false);
  });

  test("clears the timer after a synchronous throw", async () => {
    const controller = new AbortController();
    const error = new Error("synchronous failure");

    await expect(
      withAbortTimeout({
        controller,
        timeoutMs: 1_000,
        operation: () => {
          throw error;
        },
      }),
    ).rejects.toBe(error);

    expect(jest.getTimerCount()).toBe(0);
  });

  test("aborts a pending operation when the deadline expires", () => {
    const controller = new AbortController();
    const cancel = createAbortTimeout({ controller, timeoutMs: 1_000 });

    jest.advanceTimersByTime(1_000);

    expect(controller.signal.aborted).toBe(true);
    cancel();
    expect(jest.getTimerCount()).toBe(0);
  });

  test("rejects at the deadline when an operation ignores the abort signal", async () => {
    const controller = new AbortController();
    const pending = withAbortTimeout({
      controller,
      timeoutMs: 1_000,
      operation: () => new Promise<never>(() => undefined),
    });

    jest.advanceTimersByTime(1_000);

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(controller.signal.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("still aborts when a custom timeout callback does not", async () => {
    const controller = new AbortController();
    const onTimeout = jest.fn();
    const pending = withAbortTimeout({
      controller,
      timeoutMs: 1_000,
      onTimeout,
      operation: () => new Promise<never>(() => undefined),
    });

    jest.advanceTimersByTime(1_000);

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(controller.signal.aborted).toBe(true);
  });

  test("does not accept a truncated body that resolves normally after abort", async () => {
    const controller = new AbortController();
    const pending = withAbortTimeoutResponse({
      controller,
      timeoutMs: 1_000,
      operation: async () => ({ status: 200 }) as Response,
      consume: () =>
        new Promise<string>((resolve) => {
          controller.signal.addEventListener(
            "abort",
            () => resolve("partial body"),
            { once: true },
          );
        }),
    });

    await Promise.resolve();
    jest.advanceTimersByTime(1_000);

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  test("keeps the deadline active while the response body is consumed", async () => {
    const controller = new AbortController();
    const pending = withAbortTimeoutResponse({
      controller,
      timeoutMs: 1_000,
      operation: async () => ({ status: 200 }) as Response,
      consume: async () =>
        new Promise<never>((_resolve, reject) => {
          controller.signal.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    });

    await Promise.resolve();
    jest.advanceTimersByTime(1_000);

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(controller.signal.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("clears the response deadline after the body is consumed", async () => {
    const controller = new AbortController();
    const response = {
      status: 200,
      json: async () => ({ ok: true }),
    } as Response;

    await expect(
      withAbortTimeoutResponse({
        controller,
        timeoutMs: 1_000,
        operation: async () => response,
        consume: (currentResponse) => currentResponse.json(),
      }),
    ).resolves.toEqual({ response, body: { ok: true } });

    expect(jest.getTimerCount()).toBe(0);
    expect(controller.signal.aborted).toBe(false);
  });

  test("supports a custom timeout action and remains cancellable", () => {
    const controller = new AbortController();
    const onTimeout = jest.fn(() => controller.abort("custom reason"));
    const cancel = createAbortTimeout({
      controller,
      timeoutMs: 1_000,
      onTimeout,
    });

    jest.advanceTimersByTime(1_000);

    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(controller.signal.reason).toBe("custom reason");
    cancel();
    expect(jest.getTimerCount()).toBe(0);
  });

  test("provider clients do not create a redundant outer stream timeout", () => {
    const providers = [
      "alibaba",
      "baidu",
      "bytedance",
      "glm",
      "google",
      "iflytek",
      "moonshot",
      "tencent",
      "xai",
    ];

    for (const provider of providers) {
      const source = fs.readFileSync(
        path.join(process.cwd(), "app/client/platforms", `${provider}.ts`),
        "utf8",
      );
      expect(source).not.toContain("requestTimeoutId");
      expect(source).toContain("withAbortTimeoutResponse");
    }

    const openAIClient = fs.readFileSync(
      path.join(process.cwd(), "app/client/platforms/openai.ts"),
      "utf8",
    );
    expect(openAIClient).toContain("withAbortTimeoutResponse");
  });

  test("local SSE clients always cancel their connection timeout", () => {
    const providers = ["alibaba", "baidu", "bytedance", "iflytek", "tencent"];

    for (const provider of providers) {
      const source = fs.readFileSync(
        path.join(process.cwd(), "app/client/platforms", `${provider}.ts`),
        "utf8",
      );
      expect(source).toContain("createAbortTimeout");
      expect(source).toContain(".finally(cancelRequestTimeout)");
    }

    const sharedStream = fs.readFileSync(
      path.join(process.cwd(), "app/utils/chat.ts"),
      "utf8",
    );
    expect(sharedStream).toContain("createAbortTimeout");
    expect(sharedStream).toContain("const cancelThisRequestTimeout");
    expect(sharedStream).toContain(".finally(() => {");
    expect(sharedStream).toContain("cancelThisRequestTimeout();");
  });
});
