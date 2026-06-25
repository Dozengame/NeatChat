jest.mock("../app/store/config", () => ({
  useAppConfig: jest.fn(() => ({
    enableArtifacts: true,
    enableCodeFold: true,
  })),
}));

jest.mock("../app/utils", () => ({
  copyToClipboard: jest.fn(),
  useWindowSize: jest.fn(() => ({ width: 1024, height: 768 })),
}));

jest.mock("../app/utils/token", () => ({
  encode: jest.fn((text: string) => text.split("")),
}));

jest.mock("../app/components/ui-lib-actions", () => ({
  showToast: jest.fn(),
}));

jest.mock("react-markdown", () =>
  jest.requireActual("react-markdown/react-markdown.min.js"),
);

jest.mock("remark-math", () => jest.fn());
jest.mock("remark-breaks", () => jest.fn());
jest.mock("remark-gfm", () => jest.fn());
jest.mock("rehype-katex", () => jest.fn());
jest.mock("rehype-raw", () => jest.fn());
jest.mock("rehype-highlight", () => jest.fn());

jest.mock("next/dynamic", () => {
  return () => function DynamicPlaceholder() {
    return null;
  };
});

jest.mock("../app/icons/file.svg", () => {
  const React = require("react");
  return function FileIconMock() {
    return React.createElement("svg", { "data-testid": "file-icon" });
  };
});

jest.mock("../app/icons/three-dots.svg", () => {
  const React = require("react");
  return function LoadingIconMock() {
    return React.createElement("svg", { "data-testid": "loading-icon" });
  };
});

jest.mock("../app/icons/download.svg", () => {
  const React = require("react");
  return function DownloadIconMock() {
    return React.createElement("svg", { "data-testid": "download-icon" });
  };
});

jest.mock("../app/icons/copy.svg", () => {
  const React = require("react");
  return function CopyIconMock() {
    return React.createElement("svg", { "data-testid": "copy-icon" });
  };
});

import { fireEvent, render, screen } from "@testing-library/react";
import { Markdown } from "../app/components/markdown";
import { copyToClipboard } from "../app/utils";
import { showToast } from "../app/components/ui-lib-actions";

describe("Markdown file attachments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test("renders detected file blocks as clickable attachment cards and copies the original body", () => {
    render(
      <Markdown
        content={
          "文件名: Gemini-UX-audit.pdf\n类型: application/pdf\n大小: 24.00 KB\n\n第一行内容\n第二行内容\n\n---\n\n请忽略这条测试消息。"
        }
      />,
    );

    const attachment = screen.getByRole("button", {
      name: "文件附件：Gemini-UX-audit.pdf，application/pdf，24.00 KB。点击复制文件内容。",
    });

    expect(attachment).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Gemini-UX-audit.pdf")).toBeInTheDocument();
    expect(screen.getByText("24.00 KB")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
    expect(screen.queryByText(/文件名:/)).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="file://"]')).not.toBeInTheDocument();

    fireEvent.click(attachment);

    expect(showToast).toHaveBeenCalledWith("文件内容已复制到剪贴板");
    expect(copyToClipboard).toHaveBeenCalledWith("第一行内容\n第二行内容");
  });

  test("keeps unsafe javascript links downgraded to text", () => {
    render(<Markdown content="[bad](javascript:alert(1))" />);

    expect(screen.getByText("bad")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "bad" })).not.toBeInTheDocument();
  });

  test("renders audio and video links as media cards without figure wrappers", () => {
    const { container } = render(
      <Markdown
        content={
          "[listen](https://example.com/clip.MP3?sig=1#t=2)\n\n[watch](https://example.com/clip.MP4?sig=1#t=1)"
        }
      />,
    );

    const audioFrame = container.querySelector(".markdown-media-audio");
    const videoFrame = container.querySelector(".markdown-media-video");
    const audioPlayer = container.querySelector(".markdown-audio-player");
    const videoPlayer = container.querySelector(".markdown-video-player");
    const videoSource = container.querySelector(".markdown-video-player source");

    expect(audioFrame?.tagName).toBe("SPAN");
    expect(videoFrame?.tagName).toBe("SPAN");
    expect(container.querySelector("figure.markdown-media-frame")).toBeNull();
    expect(audioPlayer).toHaveAttribute(
      "src",
      "https://example.com/clip.MP3?sig=1#t=2",
    );
    expect(audioPlayer).toHaveAttribute("controls");
    expect(audioPlayer).toHaveAttribute("aria-label", "音频附件");
    expect(videoPlayer).toHaveAttribute("controls");
    expect(videoPlayer).toHaveAttribute("aria-label", "视频附件");
    expect(videoSource).toHaveAttribute(
      "src",
      "https://example.com/clip.MP4?sig=1#t=1",
    );
    expect(container.querySelector(".markdown-video-player")).not.toHaveAttribute(
      "width",
    );
  });
});

describe("Markdown image actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test("labels preview and download actions with the image alt text", () => {
    const onPreviewImage = jest.fn();
    const onDownloadImage = jest.fn();

    render(
      <Markdown
        content="![generated sunrise](https://example.com/sunrise.png)"
        onPreviewImage={onPreviewImage}
        onDownloadImage={onDownloadImage}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "预览 generated sunrise" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "下载 generated sunrise 原图" }),
    );

    expect(onPreviewImage).toHaveBeenCalledWith(
      "https://example.com/sunrise.png",
      "generated sunrise",
    );
    expect(onDownloadImage).toHaveBeenCalledWith(
      "https://example.com/sunrise.png",
    );
  });
});
