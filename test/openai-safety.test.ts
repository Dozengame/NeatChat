import { webcrypto } from "crypto";

import {
  applyOpenAISafetyIdentifier,
  sanitizeOpenAIResponsesSafetyIdentifier,
} from "../app/api/openai-safety";
import { createSignedAccessDeviceId } from "../app/api/abuse-control";
import { OPENAI_GPT_56_MODELS } from "../app/constant";
import { buildAccessControlConfig } from "../app/utils/access-control";

function makeRequest(signedDeviceId?: string) {
  return {
    headers: new Headers(),
    cookies: {
      get: (name: string) =>
        name === "neatchat_device_id" && signedDeviceId
          ? { name, value: signedDeviceId }
          : undefined,
    },
  } as any;
}

describe("OpenAI safety identifier", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    if (!globalThis.crypto?.subtle) {
      Object.defineProperty(globalThis, "crypto", {
        value: webcrypto,
        configurable: true,
      });
    }
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ACCESS_DEVICE_ID_ENABLED = "true";
    process.env.ACCESS_DEVICE_ID_SECRET = "test-device-secret";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test.each(OPENAI_GPT_56_MODELS)(
    "overrides a spoofed client value for %s",
    (model) => {
      expect(
        sanitizeOpenAIResponsesSafetyIdentifier(
          { model, safety_identifier: "client-spoof" },
          "device-one-000001",
        ),
      ).toEqual({
        model,
        safety_identifier: "device-one-000001",
      });
    },
  );

  test("removes spoofed values when no valid identifier can be injected", () => {
    const original = {
      model: "gpt-5.6-terra",
      safety_identifier: "client-spoof",
    };

    expect(sanitizeOpenAIResponsesSafetyIdentifier(original)).toEqual({
      model: "gpt-5.6-terra",
    });
    expect(
      sanitizeOpenAIResponsesSafetyIdentifier(original, "x".repeat(65)),
    ).toEqual({ model: "gpt-5.6-terra" });
    expect(original.safety_identifier).toBe("client-spoof");
  });

  test("does not inject safety identifiers for older models", () => {
    expect(
      sanitizeOpenAIResponsesSafetyIdentifier(
        { model: "gpt-5.5", safety_identifier: "client-spoof" },
        "device-one-000001",
      ),
    ).toEqual({ model: "gpt-5.5" });
  });

  test("injects only the raw ID from a valid signed device cookie", async () => {
    const rawDeviceId = "device-one-000001";
    const signedDeviceId = await createSignedAccessDeviceId(
      buildAccessControlConfig(process.env),
      rawDeviceId,
    );
    const body = await applyOpenAISafetyIdentifier(
      makeRequest(signedDeviceId),
      {
        model: "gpt-5.6-sol",
        safety_identifier: "access-code-or-api-key",
      },
    );

    expect(body.safety_identifier).toBe(rawDeviceId);
    expect(JSON.stringify(body)).not.toContain(signedDeviceId);
    expect(JSON.stringify(body)).not.toContain("access-code-or-api-key");
  });
});
