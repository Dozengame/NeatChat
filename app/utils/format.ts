export function prettyObject(msg: any) {
  const obj = msg;
  if (typeof msg !== "string") {
    msg = JSON.stringify(msg, null, "  ");
  }
  if (msg === "{}") {
    return obj.toString();
  }
  if (msg.startsWith("```json")) {
    return msg;
  }
  return ["```json", msg, "```"].join("\n");
}

export function* chunks(s: string, maxBytes = 1000 * 1000) {
  const decoder = new TextDecoder("utf-8");
  let buf = new TextEncoder().encode(s);
  const findSpaceBackward = (bytes: Uint8Array, start: number) => {
    for (let i = Math.min(start, bytes.length - 1); i >= 0; i -= 1) {
      if (bytes[i] === 32) return i;
    }
    return -1;
  };
  const findSpaceForward = (bytes: Uint8Array, start: number) => {
    for (let i = Math.max(0, start); i < bytes.length; i += 1) {
      if (bytes[i] === 32) return i;
    }
    return -1;
  };
  while (buf.length) {
    let i = findSpaceBackward(buf, maxBytes + 1);
    // If no space found, try forward search
    if (i < 0) i = findSpaceForward(buf, maxBytes);
    // If there's no space at all, take all
    if (i < 0) i = buf.length;
    // This is a safe cut-off point; never half-way a multi-byte
    yield decoder.decode(buf.slice(0, i));
    buf = buf.slice(i + 1); // Skip space (if any)
  }
}
