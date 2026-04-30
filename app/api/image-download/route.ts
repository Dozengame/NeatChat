import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const ALLOWED_IMAGE_HOSTS = new Set(["123.207.69.230"]);
const ALLOWED_IMAGE_PATH_PREFIXES = ["/jimeng-media/"];
const IMAGE_EXTENSION_PATTERN = /\.(?:png|jpe?g|webp|gif)$/i;

function isAllowedImageUrl(url: URL) {
  return (
    url.protocol === "https:" &&
    ALLOWED_IMAGE_HOSTS.has(url.hostname) &&
    ALLOWED_IMAGE_PATH_PREFIXES.some((prefix) =>
      url.pathname.startsWith(prefix),
    ) &&
    IMAGE_EXTENSION_PATTERN.test(url.pathname)
  );
}

function getImageFileName(url: URL) {
  const fallbackName = "generated-image.png";
  const fileName = url.pathname.split("/").filter(Boolean).pop();

  if (!fileName) return fallbackName;

  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function getContentDisposition(fileName: string) {
  const asciiFileName = fileName
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/"/g, "");
  return `attachment; filename="${
    asciiFileName || "generated-image.png"
  }"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("url");

  if (!src) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  if (!isAllowedImageUrl(imageUrl)) {
    return NextResponse.json(
      { error: "Image URL is not allowed" },
      { status: 400 },
    );
  }

  const response = await fetch(imageUrl.toString(), {
    method: "GET",
    headers: {
      Accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: response.status || 502 },
    );
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return NextResponse.json(
      { error: "Remote URL did not return an image" },
      { status: 415 },
    );
  }

  const fileName = getImageFileName(imageUrl);

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": getContentDisposition(fileName),
      "Cache-Control": "private, max-age=60",
    },
  });
}
