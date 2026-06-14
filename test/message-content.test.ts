import {
  getMessageImages,
  getMessageTextContent,
  hasMessageContent,
} from "../app/utils";
import type { RequestMessage } from "../app/client/types";

describe("message content helpers", () => {
  test("treats image-only multimodal messages as meaningful content", () => {
    const message: RequestMessage = {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: "data:image/png;base64,aa" },
        },
      ],
    };

    expect(getMessageTextContent(message)).toBe("");
    expect(getMessageImages(message)).toEqual(["data:image/png;base64,aa"]);
    expect(hasMessageContent(message)).toBe(true);
  });

  test("ignores empty multimodal text and missing image URLs", () => {
    const message: RequestMessage = {
      role: "user",
      content: [
        { type: "text", text: "  " },
        { type: "image_url", image_url: { url: "" } },
      ],
    };

    expect(getMessageImages(message)).toEqual([]);
    expect(hasMessageContent(message)).toBe(false);
  });
});
