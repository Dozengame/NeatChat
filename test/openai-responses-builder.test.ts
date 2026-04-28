import { buildOpenAIResponsesPayload } from "../app/client/platforms/openai-responses-builder";
import { DEFAULT_CONFIG } from "../app/store/config";
import { ServiceProvider } from "../app/constant";

describe("buildOpenAIResponsesPayload", () => {
  const modelConfig = {
    ...DEFAULT_CONFIG.modelConfig,
    model: "gpt-5.5" as any,
    providerName: ServiceProvider.OpenAI,
    temperature: 1,
    top_p: 1,
    max_output_tokens: 12345,
    reasoningEffort: "low" as const,
    textVerbosity: "low" as const,
  };

  test("builds Responses payload without Chat Completions fields", () => {
    const payload = buildOpenAIResponsesPayload({
      messages: [
        { role: "system", content: "You are concise." },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi" },
      ],
      modelConfig,
      stream: true,
      reasoningSummary: "auto",
      truncation: "disabled",
      store: false,
    }) as any;

    expect(payload.messages).toBeUndefined();
    expect(payload.max_tokens).toBeUndefined();
    expect(payload.max_completion_tokens).toBeUndefined();
    expect(payload.instructions).toBe("You are concise.");
    expect(payload.input).toEqual([
      {
        role: "user",
        content: [{ type: "input_text", text: "Hello" }],
      },
      {
        role: "assistant",
        content: [{ type: "output_text", text: "Hi" }],
      },
    ]);
    expect(payload.max_output_tokens).toBe(12345);
    expect(payload.reasoning).toEqual({ effort: "low", summary: "auto" });
    expect(payload.text).toEqual({ verbosity: "low" });
    expect(payload.truncation).toBe("disabled");
    expect(payload.store).toBe(false);
    expect(payload.temperature).toBe(1);
  });

  test("preserves image inputs", () => {
    const payload = buildOpenAIResponsesPayload({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this" },
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,aa" },
            },
          ],
        },
      ],
      modelConfig,
    }) as any;

    expect(payload.input[0].content).toEqual([
      { type: "input_text", text: "Describe this" },
      { type: "input_image", image_url: "data:image/png;base64,aa" },
    ]);
  });

  test("converts prior assistant messages to Responses output content", () => {
    const payload = buildOpenAIResponsesPayload({
      messages: [
        { role: "user", content: "What is in this file?" },
        {
          role: "assistant",
          content: [
            { type: "text", text: "It contains a short note." },
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,aa" },
            },
          ],
        },
        { role: "user", content: "Summarize it again." },
      ],
      modelConfig,
    }) as any;

    expect(payload.input).toEqual([
      {
        role: "user",
        content: [{ type: "input_text", text: "What is in this file?" }],
      },
      {
        role: "assistant",
        content: [{ type: "output_text", text: "It contains a short note." }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: "Summarize it again." }],
      },
    ]);
  });

  test("omits sampling params for older reasoning models", () => {
    const payload = buildOpenAIResponsesPayload({
      messages: [{ role: "user", content: "Hello" }],
      modelConfig: {
        ...modelConfig,
        model: "o3" as any,
      },
    }) as any;

    expect(payload.temperature).toBeUndefined();
    expect(payload.top_p).toBeUndefined();
  });
});
