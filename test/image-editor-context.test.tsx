import { render, screen } from "@testing-library/react";
import { ImageEditor } from "../app/components/image-editor";

jest.mock("../app/icons/confirm.svg", () => {
  const React = require("react");
  return function ConfirmIconMock() {
    return React.createElement("svg", { "data-testid": "confirm-icon" });
  };
});

jest.mock("../app/icons/cancel.svg", () => {
  const React = require("react");
  return function CancelIconMock() {
    return React.createElement("svg", { "data-testid": "cancel-icon" });
  };
});

jest.mock("../app/icons/return.svg", () => {
  const React = require("react");
  return function ReturnIconMock() {
    return React.createElement("svg", { "data-testid": "return-icon" });
  };
});

jest.mock("../app/icons/three-dots.svg", () => {
  const React = require("react");
  return function LoadingIconMock() {
    return React.createElement("svg", { "data-testid": "loading-icon" });
  };
});

jest.mock("../app/icons/close.svg", () => {
  const React = require("react");
  return function CloseIconMock() {
    return React.createElement("svg", { "data-testid": "close-icon" });
  };
});

jest.mock("../app/icons/eye.svg", () => {
  const React = require("react");
  return function EyeIconMock() {
    return React.createElement("svg", { "data-testid": "eye-icon" });
  };
});

jest.mock("../app/icons/eye-off.svg", () => {
  const React = require("react");
  return function EyeOffIconMock() {
    return React.createElement("svg", { "data-testid": "eye-off-icon" });
  };
});

jest.mock("../app/icons/down.svg", () => {
  const React = require("react");
  return function DownIconMock() {
    return React.createElement("svg", { "data-testid": "down-icon" });
  };
});

jest.mock("../app/icons/max.svg", () => {
  const React = require("react");
  return function MaxIconMock() {
    return React.createElement("svg", { "data-testid": "max-icon" });
  };
});

jest.mock("../app/icons/min.svg", () => {
  const React = require("react");
  return function MinIconMock() {
    return React.createElement("svg", { "data-testid": "min-icon" });
  };
});

describe("ImageEditor context", () => {
  beforeEach(() => {
    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("uses a contextual title when the image edit entry provides one", () => {
    render(
      <ImageEditor
        imageUrl="data:image/png;base64,test"
        title="编辑第 1 张图片附件"
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByText("编辑第 1 张图片附件")).toBeInTheDocument();
    expect(screen.queryByText("编辑图片")).not.toBeInTheDocument();
  });

  test("falls back to the generic image editor title", () => {
    render(
      <ImageEditor
        imageUrl="data:image/png;base64,test"
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByText("编辑图片")).toBeInTheDocument();
  });
});
