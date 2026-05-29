import { serializeTauriRequestBody } from "../app/utils/stream";

describe("Tauri stream fetch body serialization", () => {
  test("serializes FormData into multipart bytes", async () => {
    const formData = new FormData();
    formData.append("model", "gpt-image-2");
    formData.append(
      "image[]",
      new Blob(["image-bytes"], { type: "image/png" }),
      "reference.png",
    );

    const result = await serializeTauriRequestBody(formData);
    const bodyText = new TextDecoder().decode(new Uint8Array(result.body));

    expect(result.contentType).toMatch(
      /^multipart\/form-data; boundary=----NeatChatFormBoundary/,
    );
    expect(bodyText).toContain('name="model"');
    expect(bodyText).toContain("gpt-image-2");
    expect(bodyText).toContain('name="image[]"');
    expect(bodyText).toContain('filename="reference.png"');
    expect(bodyText).toContain("Content-Type: image/png");
    expect(bodyText).toContain("image-bytes");
  });
});
