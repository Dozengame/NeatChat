// using tauri command to send request
// see src-tauri/src/stream.rs, and src-tauri/src/main.rs
// 1. invoke('stream_fetch', {url, method, headers, body}), get response with headers.
// 2. listen event: `stream-response` multi times to get body

type ResponseEvent = {
  id: number;
  payload: {
    request_id: number;
    status?: number;
    chunk?: number[];
  };
};

type StreamResponse = {
  request_id: number;
  status: number;
  status_text: string;
  headers: Record<string, string>;
};

const encoder = new TextEncoder();

function encodeText(text: string) {
  return Array.from(encoder.encode(text));
}

function appendBytes(target: number[], bytes: ArrayLike<number>) {
  for (let i = 0; i < bytes.length; i += 1) {
    target.push(bytes[i]);
  }
}

function escapeMultipartName(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function blobToBytes(blob: Blob) {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }

  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

async function serializeFormData(formData: FormData) {
  const boundary = `----NeatChatFormBoundary${Date.now().toString(16)}${Math.random()
    .toString(16)
    .slice(2)}`;
  const body: number[] = [];

  for (const [name, value] of formData.entries()) {
    appendBytes(
      body,
      encodeText(
        `--${boundary}\r\nContent-Disposition: form-data; name="${escapeMultipartName(
          name,
        )}"`,
      ),
    );

    if (typeof value === "string") {
      appendBytes(body, encodeText(`\r\n\r\n${value}\r\n`));
      continue;
    }

    const filename = escapeMultipartName(value.name || "blob");
    const contentType = value.type || "application/octet-stream";
    appendBytes(
      body,
      encodeText(
        `; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`,
      ),
    );
    appendBytes(body, await blobToBytes(value));
    appendBytes(body, encodeText("\r\n"));
  }

  appendBytes(body, encodeText(`--${boundary}--\r\n`));

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

export async function serializeTauriRequestBody(
  body: BodyInit | null | undefined,
) {
  if (typeof body === "string") {
    return {
      body: encodeText(body),
      contentType: undefined,
    };
  }

  if (body instanceof FormData) {
    return serializeFormData(body);
  }

  return {
    body: [],
    contentType: undefined,
  };
}

export function fetch(url: string, options?: RequestInit): Promise<Response> {
  if (window.__TAURI__) {
    const tauri = window.__TAURI__;
    const {
      signal,
      method = "GET",
      headers: _headers = {},
      body,
    } = options || {};
    let unlisten: Function | undefined;
    let setRequestId: Function | undefined;
    const requestIdPromise = new Promise((resolve) => (setRequestId = resolve));
    const ts = new TransformStream();
    const writer = ts.writable.getWriter();

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      unlisten && unlisten();
      writer.ready.then(() => {
        writer.close().catch((e) => console.error(e));
      });
    };

    if (signal) {
      signal.addEventListener("abort", () => close());
    }
    // @ts-ignore 2. listen response multi times, and write to Response.body
    tauri.event
      .listen("stream-response", (e: ResponseEvent) =>
        requestIdPromise.then((request_id) => {
          const { request_id: rid, chunk, status } = e?.payload || {};
          if (request_id != rid) {
            return;
          }
          if (chunk) {
            writer.ready.then(() => {
              writer.write(new Uint8Array(chunk));
            });
          } else if (status === 0) {
            // end of body
            close();
          }
        }),
      )
      .then((u: Function) => (unlisten = u));

    const headers: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      "User-Agent": navigator.userAgent,
    };
    for (const item of new Headers(_headers || {})) {
      headers[item[0]] = item[1];
    }
    return serializeTauriRequestBody(body).then((requestBody) => {
      if (requestBody.contentType) {
        headers["Content-Type"] = requestBody.contentType;
      }

      return tauri
        .invoke("stream_fetch", {
          method: method.toUpperCase(),
          url,
          headers,
          body: requestBody.body,
        })
        .then((res: StreamResponse) => {
          const { request_id, status, status_text: statusText, headers } = res;
          setRequestId?.(request_id);
          const response = new Response(ts.readable, {
            status,
            statusText,
            headers,
          });
          if (status >= 300) {
            setTimeout(close, 100);
          }
          return response;
        })
        .catch((e) => {
          console.error("stream error", e);
          // throw e;
          return new Response("", { status: 599 });
        });
    });
  }
  return window.fetch(url, options);
}
