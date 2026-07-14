import { webcrypto } from "crypto";

const mockServerConfig: Record<string, any> = {};

jest.mock("../app/config/server", () => ({
  getServerSideConfig: () => mockServerConfig,
}));

import { createSignedAccessDeviceId } from "../app/api/abuse-control";
import { buildAccessControlConfig } from "../app/utils/access-control";

if (typeof Request === "undefined") {
  (globalThis as any).Request = class {};
}
if (typeof Response === "undefined") {
  (globalThis as any).Response = class {
    body: unknown;
    status: number;
    statusText: string;
    headers: Headers;

    constructor(body?: unknown, init: ResponseInit = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.statusText = init.statusText ?? "";
      this.headers = new Headers(init.headers);
    }

    get ok() {
      return this.status >= 200 && this.status < 300;
    }

    async text() {
      return typeof this.body === "string" ? this.body : "";
    }

    static json(body: unknown, init: ResponseInit = {}) {
      return new (globalThis as any).Response(JSON.stringify(body), {
        ...init,
        headers: {
          "content-type": "application/json",
          ...(init.headers ?? {}),
        },
      });
    }
  };
}

const { requestOpenai } =
  require("../app/api/common") as typeof import("../app/api/common");

function makeRequest(body: Record<string, unknown>, signedDeviceId?: string) {
  return {
    nextUrl: new URL("https://neatchat.test/api/openai/v1/responses"),
    headers: new Headers({
      Authorization: "Bearer test-user-key",
      "content-type": "application/json",
    }),
    method: "POST",
    body: {},
    text: jest.fn(async () => JSON.stringify(body)),
    cookies: {
      get: (name: string) =>
        name === "neatchat_device_id" && signedDeviceId
          ? { name, value: signedDeviceId }
          : undefined,
    },
  } as any;
}

describe("OpenAI Responses proxy preprocessing", () => {
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    if (!globalThis.crypto?.subtle) {
      Object.defineProperty(globalThis, "crypto", {
        value: webcrypto,
        configurable: true,
      });
    }
  });

  beforeEach(() => {
    const accessControl = buildAccessControlConfig({
      ACCESS_DEVICE_ID_ENABLED: "true",
      ACCESS_DEVICE_ID_SECRET: "test-device-secret",
    });
    Object.assign(mockServerConfig, {
      baseUrl: "https://api.openai.com",
      openaiResponsesUrl: undefined,
      openaiImagesUrl: undefined,
      customModels: "",
      openaiOrgId: undefined,
      openaiReasoningMode: "pro",
      openaiReasoningContext: "current_turn",
      openaiInputImageDetail: "original",
      openaiPromptCacheMode: "disabled",
      openaiPromptCacheKey: undefined,
      defaultTemperature: 0.4,
      openaiTextVerbosity: "low",
      openaiMaxOutputTokens: 30_000,
      webuiLockedFields: "",
      accessControl,
    });
    globalThis.fetch = jest.fn(
      async () =>
        new Response("ok", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    ) as any;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  test("injects a verified raw device ID even when CUSTOM_MODELS is empty", async () => {
    const rawDeviceId = "device-one-000001";
    const signedDeviceId = await createSignedAccessDeviceId(
      mockServerConfig.accessControl,
      rawDeviceId,
    );
    const req = makeRequest(
      {
        model: "gpt-5.6-terra",
        input: "Hello",
        safety_identifier: "client-spoof",
      },
      signedDeviceId,
    );

    await requestOpenai(req);

    const outbound = JSON.parse(
      (globalThis.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(outbound.safety_identifier).toBe(rawDeviceId);
    expect(req.text).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(outbound)).not.toContain(signedDeviceId);
    expect(JSON.stringify(outbound)).not.toContain("test-user-key");
  });

  test.each(["gpt-5.5", "gpt-5.6-sol"])(
    "removes a spoofed identifier for %s without a verified cookie",
    async (model) => {
      await requestOpenai(
        makeRequest({ model, input: "Hello", safety_identifier: "spoof" }),
      );

      const outbound = JSON.parse(
        (globalThis.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(outbound.safety_identifier).toBeUndefined();
    },
  );

  test("enforces locked GPT-5.6 settings on direct HTTP payloads", async () => {
    await requestOpenai(
      makeRequest({
        model: "gpt-5.6-terra",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: "https://example.com/image.png",
                detail: "low",
                prompt_cache_breakpoint: { mode: "explicit" },
              },
            ],
          },
        ],
        reasoning: {
          effort: "high",
          mode: "standard",
          context: "all_turns",
        },
        prompt_cache_options: { mode: "implicit", ttl: "1h" },
        prompt_cache_key: "attacker-key",
        temperature: 2,
        text: {
          verbosity: "high",
          format: { type: "text" },
        },
        max_output_tokens: 128_000,
      }),
    );

    const outbound = JSON.parse(
      (globalThis.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(outbound.reasoning).toEqual({
      effort: "high",
      mode: "pro",
      context: "current_turn",
    });
    expect(outbound.input[0].content[0].detail).toBe("original");
    expect(
      outbound.input[0].content[0].prompt_cache_breakpoint,
    ).toBeUndefined();
    expect(outbound.prompt_cache_options).toEqual({
      mode: "explicit",
      ttl: "30m",
    });
    expect(outbound.prompt_cache_key).toBeUndefined();
    expect(outbound.temperature).toBeUndefined();
    expect(outbound.text).toEqual({
      verbosity: "low",
      format: { type: "text" },
    });
    expect(outbound.max_output_tokens).toBe(30_000);
  });

  test("rejects invalid JSON instead of forwarding an unprocessed body", async () => {
    const req = makeRequest({});
    req.text = jest.fn(async () => "{");

    const response = await requestOpenai(req);

    expect(response.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
