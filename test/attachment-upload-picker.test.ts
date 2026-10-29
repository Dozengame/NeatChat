import { fireEvent, waitFor } from "@testing-library/dom";
import { uploadAttachments } from "../app/utils/file";

describe("attachment file picker lifecycle", () => {
  let input: HTMLInputElement;
  const callbacks = () => ({
    start: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    finish: jest.fn(),
  });

  beforeEach(() => {
    jest
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(function (this: HTMLInputElement) {
        input = this;
        expect(input.isConnected).toBe(true);
      });
  });

  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  test("retains a hidden connected target until cancellation", () => {
    const c = callbacks();
    uploadAttachments(c.start, c.success, c.error, c.finish, "image");
    expect(input.type).toBe("file");
    expect(input.accept).toContain("image/");
    expect(input.multiple).toBe(true);
    expect(input.hidden).toBe(true);
    expect(input.isConnected).toBe(true);

    fireEvent(input, new Event("cancel"));
    expect(input.isConnected).toBe(false);
    expect(c.finish).toHaveBeenCalledTimes(1);
    expect(c.start).not.toHaveBeenCalled();
    expect(c.success).not.toHaveBeenCalled();
    expect(c.error).not.toHaveBeenCalled();
  });

  test("cleans up an empty selection", () => {
    const c = callbacks();
    uploadAttachments(c.start, c.success, c.error, c.finish);
    fireEvent.change(input, { target: { files: [] } });
    expect(input.isConnected).toBe(false);
    expect(c.finish).toHaveBeenCalledTimes(1);
    expect(c.start).not.toHaveBeenCalled();
  });

  test("cleans up a rejected image-only selection", () => {
    const c = callbacks();
    uploadAttachments(c.start, c.success, c.error, c.finish, "image");
    fireEvent.change(input, {
      target: {
        files: [new File(["hello"], "note.txt", { type: "text/plain" })],
      },
    });
    expect(input.isConnected).toBe(false);
    expect(c.finish).toHaveBeenCalledTimes(1);
    expect(c.error).toHaveBeenCalledTimes(1);
    expect(c.start).not.toHaveBeenCalled();
  });

  test("keeps the input through processing and removes it after success", async () => {
    const c = callbacks();
    uploadAttachments(c.start, c.success, c.error, c.finish, "file");
    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(input.isConnected).toBe(true);
    expect(c.start).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(c.finish).toHaveBeenCalledTimes(1));
    expect(c.success).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: "note.txt",
          content: "hello",
          originalFile: file,
        }),
      ],
      [],
    );
    expect(c.error).not.toHaveBeenCalled();
    expect(input.isConnected).toBe(false);
  });
});
