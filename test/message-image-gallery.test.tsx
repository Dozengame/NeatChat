import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("../app/icons/download.svg", () => {
  const React = require("react");
  return function DownloadIconMock() {
    return React.createElement("svg", { "data-testid": "download-icon" });
  };
});

import {
  MessageImageGallery,
  MessageImagePreview,
} from "../app/components/message-image-gallery";
import Locale from "../app/locales";
import {
  getImageActionLabels,
  getMessageImageLabel,
} from "../app/utils/image-action-labels";

const images = [
  "https://example.test/generated-1.png",
  "https://example.test/generated-2.png",
  "https://example.test/generated-3.png",
];

function renderGallery() {
  const onPreview = jest.fn();
  const onDownload = jest.fn();
  render(
    <MessageImageGallery
      images={images}
      onPreview={onPreview}
      onDownload={onDownload}
    />,
  );
  return { onPreview, onDownload };
}

function getOption(index: number) {
  return screen.getByRole("button", {
    name: Locale.ImageActions.ShowGalleryImage(index, images.length),
  });
}

describe("MessageImageGallery", () => {
  test("marks a single image preview as a horizontal swipe surface", () => {
    const labels = getImageActionLabels("Generated image");
    const { container } = render(
      <MessageImagePreview
        src={images[0]}
        alt="Generated image"
        className="message-image"
        actionLabels={labels}
        onPreview={jest.fn()}
        onDownload={jest.fn()}
      />,
    );

    expect(container.firstChild).toHaveAttribute(
      "data-chat-horizontal-scroll",
      "true",
    );
  });

  test("exposes one labelled option group without duplicating thumbnail speech", () => {
    renderGallery();

    const group = screen.getByRole("group", {
      name: Locale.ImageActions.Gallery,
    });
    const options = images.map((_, index) => getOption(index + 1));
    expect(options[0]).toHaveAttribute("aria-pressed", "true");
    expect(options[0]).toHaveAttribute("tabindex", "0");
    expect(options[1]).toHaveAttribute("aria-pressed", "false");
    expect(options[1]).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();

    const thumbnails = group.querySelectorAll("img");
    expect(thumbnails).toHaveLength(images.length);
    thumbnails.forEach((thumbnail) => {
      expect(thumbnail).toHaveAttribute("alt", "");
    });
    expect(
      screen.getByAltText(getMessageImageLabel(0, images.length)),
    ).toHaveAttribute("src", images[0]);
  });

  test("routes preview and download through the currently selected image", () => {
    const { onPreview, onDownload } = renderGallery();
    fireEvent.click(getOption(2));

    const selectedLabel = getMessageImageLabel(1, images.length);
    const selectedActions = getImageActionLabels(selectedLabel);
    expect(getOption(2)).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByAltText(selectedLabel)).toHaveAttribute(
      "src",
      images[1],
    );

    const previewButton = screen.getByRole("button", {
      name: selectedActions.preview,
    });
    fireEvent.click(previewButton);
    expect(onPreview).toHaveBeenCalledWith(images[1], {
      trigger: previewButton,
      label: selectedLabel,
    });

    fireEvent.click(
      screen.getByRole("button", { name: selectedActions.download }),
    );
    expect(onDownload).toHaveBeenCalledWith(images[1]);
  });

  test("cycles with four arrow keys and supports Home and End", () => {
    renderGallery();
    const first = getOption(1);
    const second = getOption(2);
    const third = getOption(3);
    first.focus();

    expect(fireEvent.keyDown(first, { key: "ArrowLeft" })).toBe(false);
    expect(third).toHaveFocus();
    expect(third).toHaveAttribute("aria-pressed", "true");

    expect(fireEvent.keyDown(third, { key: "ArrowRight" })).toBe(false);
    expect(first).toHaveFocus();

    expect(fireEvent.keyDown(first, { key: "ArrowUp" })).toBe(false);
    expect(third).toHaveFocus();

    expect(fireEvent.keyDown(third, { key: "ArrowDown" })).toBe(false);
    expect(first).toHaveFocus();

    expect(fireEvent.keyDown(first, { key: "End" })).toBe(false);
    expect(third).toHaveFocus();

    expect(fireEvent.keyDown(third, { key: "Home" })).toBe(false);
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute("tabindex", "0");
    expect(second).toHaveAttribute("tabindex", "-1");
    expect(third).toHaveAttribute("tabindex", "-1");
  });
});
