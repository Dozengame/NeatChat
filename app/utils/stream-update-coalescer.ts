export function createStreamUpdateCoalescer(
  publish: () => void,
  intervalMs: number | (() => number) = 50,
) {
  let hasPublished = false;
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;

  const publishPending = () => {
    if (pendingTimer !== undefined) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    publish();
  };

  return {
    schedule() {
      if (!hasPublished) {
        hasPublished = true;
        publish();
        return;
      }
      if (pendingTimer === undefined) {
        const nextInterval =
          typeof intervalMs === "function" ? intervalMs() : intervalMs;
        pendingTimer = setTimeout(publishPending, nextInterval);
      }
    },
    flush() {
      if (pendingTimer !== undefined) {
        publishPending();
      }
    },
    cancel() {
      if (pendingTimer !== undefined) {
        clearTimeout(pendingTimer);
        pendingTimer = undefined;
      }
    },
  };
}

export function getStreamUpdateInterval(contentLength: number) {
  if (contentLength >= 128_000) return 120;
  if (contentLength >= 64_000) return 80;
  return 50;
}
