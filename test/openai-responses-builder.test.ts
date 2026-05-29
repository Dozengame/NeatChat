import { buildOpenAIResponsesPayload } from "../app/client/platforms/openai-responses-builder";
import { DEFAULT_CONFIG } from "../app/store/config";
import { ServiceProvider } from "../app/constant";
import { shouldEnableOpenAIResponsesWebSearch } from "../app/utils/openai-responses";

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
    expect(payload.include).toEqual(["reasoning.encrypted_content"]);
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

  test("replays stored Responses output items when running stateless", () => {
    const priorOutput = [
      {
        id: "rs_123",
        type: "reasoning",
        encrypted_content: "encrypted",
        summary: [],
      },
      {
        id: "msg_123",
        type: "message",
        status: "completed",
        role: "assistant",
        content: [
          {
            type: "output_text",
            text: "Prior answer",
            annotations: [],
          },
        ],
      },
    ];
    const payload = buildOpenAIResponsesPayload({
      messages: [
        { role: "user", content: "First question" },
        {
          role: "assistant",
          content: "Prior answer",
          openaiResponseId: "resp_123",
          openaiResponsesOutput: priorOutput,
        },
        { role: "user", content: "Follow up" },
      ],
      modelConfig,
      store: false,
    }) as any;

    expect(payload.previous_response_id).toBeUndefined();
    expect(payload.input).toEqual([
      {
        role: "user",
        content: [{ type: "input_text", text: "First question" }],
      },
      ...priorOutput,
      {
        role: "user",
        content: [{ type: "input_text", text: "Follow up" }],
      },
    ]);
  });

  test("uses previous_response_id when server-side state is enabled", () => {
    const payload = buildOpenAIResponsesPayload({
      messages: [
        { role: "user", content: "First question" },
        {
          role: "assistant",
          content: "Prior answer",
          openaiResponseId: "resp_123",
          openaiResponseStored: true,
        },
        { role: "user", content: "Follow up" },
      ],
      modelConfig,
      store: true,
    }) as any;

    expect(payload.previous_response_id).toBe("resp_123");
    expect(payload.input).toEqual([
      {
        role: "user",
        content: [{ type: "input_text", text: "Follow up" }],
      },
    ]);
  });

  test("does not reference prior stateless response ids after storage is enabled", () => {
    const priorOutput = [
      {
        id: "rs_123",
        type: "reasoning",
        encrypted_content: "encrypted",
        summary: [],
      },
      {
        id: "msg_123",
        type: "message",
        status: "completed",
        role: "assistant",
        content: [
          {
            type: "output_text",
            text: "Prior answer",
            annotations: [],
          },
        ],
      },
    ];
    const payload = buildOpenAIResponsesPayload({
      messages: [
        { role: "user", content: "First question" },
        {
          role: "assistant",
          content: "Prior answer",
          openaiResponseId: "resp_123",
          openaiResponseStored: false,
          openaiResponsesOutput: priorOutput,
        },
        { role: "user", content: "Follow up" },
      ],
      modelConfig,
      store: true,
    }) as any;

    expect(payload.previous_response_id).toBeUndefined();
    expect(payload.input).toEqual([
      {
        role: "user",
        content: [{ type: "input_text", text: "First question" }],
      },
      ...priorOutput,
      {
        role: "user",
        content: [{ type: "input_text", text: "Follow up" }],
      },
    ]);
  });

  test("adds hosted web search tool when enabled", () => {
    const payload = buildOpenAIResponsesPayload({
      messages: [{ role: "user", content: "What changed today?" }],
      modelConfig,
      enableWebSearch: true,
    }) as any;

    expect(payload.tools).toEqual([{ type: "web_search" }]);
  });

  test("requires hosted web search for time-sensitive requests", () => {
    const payload = buildOpenAIResponsesPayload({
      messages: [{ role: "user", content: "今天有什么大新闻" }],
      modelConfig,
      enableWebSearch: true,
      webSearchMode: "required",
    }) as any;

    expect(payload.tools).toEqual([{ type: "web_search" }]);
    expect(payload.tool_choice).toBe("required");
  });

  test("does not add hosted web search for pasted attachment body text", () => {
    const content = [
      "文件名: 粘贴的文本.txt",
      "类型: text/plain",
      "大小: 1.91 KB",
      "",
      "当前这段长文本只是用户粘贴的附件正文，不是实时搜索请求。",
    ].join("\n");
    const payload = buildOpenAIResponsesPayload({
      messages: [{ role: "user", content }],
      modelConfig: { ...modelConfig, model: "gpt-5.4" as any },
      enableWebSearch: shouldEnableOpenAIResponsesWebSearch(content),
    }) as any;

    expect(payload.tools).toBeUndefined();
    expect(payload.tool_choice).toBeUndefined();
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
