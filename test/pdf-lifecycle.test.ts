const mockGetDocument = jest.fn();

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "mock-worker" },
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
}));

jest.mock("../app/components/ui-lib-actions", () => ({
  showModal: jest.fn(),
  showToast: jest.fn(),
}));

import { readAttachmentFile } from "../app/utils/file";

describe("PDF loading task lifecycle", () => {
  beforeEach(() => {
    mockGetDocument.mockReset();
  });

  test("destroys the loading task after successful extraction", async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    mockGetDocument.mockReturnValue({
      destroy,
      promise: Promise.resolve({
        numPages: 1,
        getPage: jest.fn().mockResolvedValue({
          getTextContent: jest
            .fn()
            .mockResolvedValue({ items: [{ str: "hello pdf" }] }),
        }),
      }),
    });

    const result = await readAttachmentFile(
      new File([new Uint8Array([1, 2, 3])], "sample.pdf", {
        type: "application/pdf",
      }),
    );

    expect(result.content).toContain("hello pdf");
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test("destroys the loading task when document loading fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const destroy = jest.fn().mockResolvedValue(undefined);
    mockGetDocument.mockReturnValue({
      destroy,
      promise: {
        then: (
          _resolve: (value: unknown) => void,
          reject: (reason: Error) => void,
        ) => reject(new Error("broken pdf")),
      },
    });

    const result = await readAttachmentFile(
      new File([new Uint8Array([1])], "broken.pdf", {
        type: "application/pdf",
      }),
    );

    expect(result.content).toBeTruthy();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
