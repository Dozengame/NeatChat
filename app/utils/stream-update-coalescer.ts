export function createStreamUpdateCoalescer(
  publish: () => void,
  intervalMs = 50,
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
        pendingTimer = setTimeout(publishPending, intervalMs);
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
