interface AbortTimeoutOptions {
  controller: AbortController;
  timeoutMs: number;
  onTimeout?: () => void;
}

interface AbortTimeoutOperationOptions<T> extends AbortTimeoutOptions {
  operation: () => T | Promise<T>;
}

interface AbortTimeoutResponseOptions<T> extends AbortTimeoutOptions {
  operation: () => Response | Promise<Response>;
  consume: (response: Response) => T | Promise<T>;
}

export function createAbortTimeout({
  controller,
  timeoutMs,
  onTimeout = () => controller.abort(),
}: AbortTimeoutOptions) {
  const timeoutId = setTimeout(onTimeout, timeoutMs);
  return () => clearTimeout(timeoutId);
}

function getAbortReason(signal: AbortSignal) {
  if (signal.reason instanceof Error) return signal.reason;
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

export async function withAbortTimeout<T>({
  operation,
  controller,
  ...timeoutOptions
}: AbortTimeoutOperationOptions<T>): Promise<T> {
  if (controller.signal.aborted) {
    throw getAbortReason(controller.signal);
  }
  let removeAbortListener: () => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    const rejectAborted = () => reject(getAbortReason(controller.signal));
    if (controller.signal.aborted) {
      rejectAborted();
      return;
    }
    controller.signal.addEventListener("abort", rejectAborted, { once: true });
    removeAbortListener = () =>
      controller.signal.removeEventListener("abort", rejectAborted);
  });
  const cancelTimeout = createAbortTimeout({
    controller,
    ...timeoutOptions,
    onTimeout: () => {
      try {
        timeoutOptions.onTimeout?.();
      } finally {
        if (!controller.signal.aborted) controller.abort();
      }
    },
  });
  const operationResult = Promise.resolve().then(operation);
  try {
    const result = await Promise.race([aborted, operationResult]);
    if (controller.signal.aborted) {
      throw getAbortReason(controller.signal);
    }
    return result;
  } finally {
    cancelTimeout();
    removeAbortListener();
  }
}

export async function withAbortTimeoutResponse<T>({
  operation,
  consume,
  ...timeoutOptions
}: AbortTimeoutResponseOptions<T>): Promise<{
  response: Response;
  body: T;
}> {
  return withAbortTimeout({
    ...timeoutOptions,
    operation: async () => {
      const response = await operation();
      const body = await consume(response);
      return { response, body };
    },
  });
}
