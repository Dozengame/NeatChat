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
jest.mock("rehype-sanitize", () => ({
  __esModule: true,
  default: jest.fn(),
  defaultSchema: { tagNames: [], attributes: {}, protocols: {} },
}));

jest.mock("next/dynamic", () => {
  return () =>
    function DynamicPlaceholder() {
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
import Locale from "../app/locales";

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
      name: Locale.FileAttachment.Label(
        "Gemini-UX-audit.pdf",
        "application/pdf",
        "24.00 KB",
        true,
      ),
    });

    expect(attachment).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Gemini-UX-audit.pdf")).toBeInTheDocument();
    expect(screen.getByText("24.00 KB")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
    expect(screen.queryByText(/文件名:/)).not.toBeInTheDocument();
    expect(
      document.querySelector('a[href^="file://"]'),
    ).not.toBeInTheDocument();

    fireEvent.click(attachment);

    expect(showToast).toHaveBeenCalledWith(Locale.Markdown.FileCopied);
    expect(copyToClipboard).toHaveBeenCalledWith("第一行内容\n第二行内容");
  });

  test("renders English-locale file metadata without exposing transport labels", () => {
    render(
      <Markdown
        content={
          "File name: performance.txt\nType: text/plain\nSize: 1.00 KB\n\nprofiling result"
        }
      />,
    );

    const attachment = screen.getByRole("button", {
      name: Locale.FileAttachment.Label(
        "performance.txt",
        "text/plain",
        "1.00 KB",
        true,
      ),
    });
    fireEvent.click(attachment);

    expect(screen.queryByText(/File name:/)).not.toBeInTheDocument();
    expect(copyToClipboard).toHaveBeenCalledWith("profiling result");
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
    const audioHeader = audioFrame?.querySelector(".markdown-media-header");
    const videoHeader = videoFrame?.querySelector(".markdown-media-header");
    const audioPlayer = container.querySelector(".markdown-audio-player");
    const videoPlayer = container.querySelector(".markdown-video-player");
    const videoSource = container.querySelector(
      ".markdown-video-player source",
    );
    const openLinks = container.querySelectorAll(".markdown-media-open-link");

    expect(audioFrame?.tagName).toBe("SPAN");
    expect(videoFrame?.tagName).toBe("SPAN");
    expect(container.querySelector("figure.markdown-media-frame")).toBeNull();
    expect(audioHeader).toHaveTextContent(Locale.Markdown.Audio);
    expect(audioHeader).toHaveTextContent("listen");
    expect(videoHeader).toHaveTextContent(Locale.Markdown.Video);
    expect(videoHeader).toHaveTextContent("watch");
    expect(audioPlayer).toHaveAttribute(
      "src",
      "https://example.com/clip.MP3?sig=1#t=2",
    );
    expect(audioPlayer).toHaveAttribute("controls");
    expect(audioPlayer).toHaveAttribute(
      "aria-label",
      Locale.Markdown.MediaAttachment(Locale.Markdown.Audio, "listen"),
    );
    expect(videoPlayer).toHaveAttribute("controls");
    expect(videoPlayer).toHaveAttribute(
      "aria-label",
      Locale.Markdown.MediaAttachment(Locale.Markdown.Video, "watch"),
    );
    expect(videoSource).toHaveAttribute(
      "src",
      "https://example.com/clip.MP4?sig=1#t=1",
    );
    expect(openLinks).toHaveLength(2);
    expect(openLinks[0]).toHaveAttribute(
      "href",
      "https://example.com/clip.MP3?sig=1#t=2",
    );
    expect(openLinks[0]).toHaveTextContent(Locale.Markdown.OpenOriginal);
    expect(openLinks[1]).toHaveAttribute(
      "href",
      "https://example.com/clip.MP4?sig=1#t=1",
    );
    expect(openLinks[1]).toHaveTextContent(Locale.Markdown.OpenOriginal);
    expect(
      container.querySelector(".markdown-video-player"),
    ).not.toHaveAttribute("width");
  });

  test("shows a readable media fallback when audio or video cannot load", () => {
    const { container } = render(
      <Markdown
        content={
          "[listen](https://example.com/missing.mp3)\n\n[watch](https://example.com/missing.mp4)"
        }
      />,
    );

    const audioPlayer = container.querySelector(".markdown-audio-player");
    const videoPlayer = container.querySelector(".markdown-video-player");

    expect(audioPlayer).toBeInTheDocument();
    expect(videoPlayer).toBeInTheDocument();

    fireEvent.error(audioPlayer as Element);
    fireEvent.error(videoPlayer as Element);

    const fallbacks = container.querySelectorAll(".markdown-media-fallback");
    expect(fallbacks).toHaveLength(2);
    expect(fallbacks[0]).toHaveAttribute("role", "status");
    expect(fallbacks[0]).toHaveTextContent(
      Locale.Markdown.MediaFallback(Locale.Markdown.Audio),
    );
    expect(fallbacks[1]).toHaveTextContent(
      Locale.Markdown.MediaFallback(Locale.Markdown.Video),
    );
    expect(container.querySelector(".markdown-audio-player")).toBeNull();
    expect(container.querySelector(".markdown-video-player")).toBeNull();
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
      screen.getByRole("button", {
        name: Locale.ImageActions.PreviewWithLabel("generated sunrise"),
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: Locale.ImageActions.DownloadWithLabel("generated sunrise"),
      }),
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
