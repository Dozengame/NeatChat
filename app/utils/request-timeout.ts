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

interface StreamingRequestLifecycleOptions {
  controller: AbortController;
  timeoutMs: number;
  getMessage: () => string;
  getResponse: () => Response;
  onFinish: (message: string, response: Response) => void;
  onError?: (error: Error) => void;
}

function createTimeoutError(timeoutMs: number) {
  const error = new Error(`Request timed out after ${timeoutMs} ms`);
  error.name = "TimeoutError";
  return error;
}

export function createAbortTimeout({
  controller,
  timeoutMs,
  onTimeout = () => controller.abort(createTimeoutError(timeoutMs)),
}: AbortTimeoutOptions) {
  const timeoutId = setTimeout(onTimeout, timeoutMs);
  return () => clearTimeout(timeoutId);
}

export function createStreamingRequestLifecycle({
  controller,
  timeoutMs,
  getMessage,
  getResponse,
  onFinish,
  onError,
}: StreamingRequestLifecycleOptions) {
  let settled = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const cancelTimer = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };
  const cleanup = () => {
    cancelTimer();
    controller.signal.removeEventListener("abort", handleAbort);
  };
  const fail = (value: unknown) => {
    if (settled) return;
    const error = value instanceof Error ? value : new Error(String(value));
    settled = true;
    cleanup();
    if (!controller.signal.aborted) controller.abort(error);
    onError?.(error);
  };
  const finish = ({ allowEmpty = false } = {}) => {
    if (settled) return;
    const message = getMessage();
    if (!message && !allowEmpty) {
      fail(new Error("empty response from server"));
      return;
    }
    settled = true;
    cleanup();
    onFinish(message, getResponse());
  };
  const refresh = () => {
    if (settled || controller.signal.aborted) return;
    cancelTimer();
    timeoutId = setTimeout(() => {
      if (settled || controller.signal.aborted) return;
      controller.abort(createTimeoutError(timeoutMs));
    }, timeoutMs);
  };

  function handleAbort() {
    const reason = controller.signal.reason;
    if (reason instanceof Error && reason.name === "TimeoutError") {
      fail(reason);
    } else {
      finish({ allowEmpty: true });
    }
  }

  controller.signal.addEventListener("abort", handleAbort, { once: true });
  if (controller.signal.aborted) {
    handleAbort();
  } else {
    refresh();
  }

  return {
    cancel: cleanup,
    fail,
    finish,
    isSettled: () => settled,
    refresh,
  };
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
        if (!controller.signal.aborted) {
          controller.abort(createTimeoutError(timeoutOptions.timeoutMs));
        }
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
