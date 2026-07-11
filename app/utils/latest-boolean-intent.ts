export type BooleanIntent = {
  token: number;
  value: boolean;
};

export function createLatestBooleanIntent(initialValue: boolean) {
  let appliedValue = initialValue;
  let desiredValue = initialValue;
  let latestToken = 0;
  let pendingToken: number | undefined;

  return {
    next(): BooleanIntent {
      desiredValue = !desiredValue;
      latestToken += 1;
      pendingToken = latestToken;
      return { token: latestToken, value: desiredValue };
    },

    isCurrent(token: number) {
      return token === latestToken;
    },

    markApplied(value: boolean) {
      appliedValue = value;
    },

    settle(token: number, succeeded: boolean) {
      if (token !== latestToken) return false;

      pendingToken = undefined;
      if (succeeded) {
        appliedValue = desiredValue;
      }
      desiredValue = appliedValue;
      return true;
    },

    syncCommitted(value: boolean) {
      if (pendingToken === undefined) {
        appliedValue = value;
        desiredValue = value;
      }
    },

    value() {
      return desiredValue;
    },
  };
}
