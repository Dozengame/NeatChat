const UNSAFE_MERGE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function merge(target: any, source: any) {
  if (!source || typeof source !== "object") return target;

  Object.keys(source).forEach(function (key) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) return;
    if (UNSAFE_MERGE_KEYS.has(key)) {
      throw new Error(`Unsafe object key: ${key}`);
    }

    if (source[key] && typeof source[key] === "object") {
      const currentTarget =
        target[key] && typeof target[key] === "object" ? target[key] : {};
      target[key] = currentTarget;
      merge(currentTarget, source[key]);
      return;
    }
    target[key] = source[key];
  });

  return target;
}
