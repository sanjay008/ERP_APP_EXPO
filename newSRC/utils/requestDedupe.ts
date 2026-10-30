const inflight = new Map<string, Promise<unknown>>();

/** Collapse identical in-flight async work (e.g. React Strict Mode double mount). */
export function dedupeAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    if (inflight.get(key) === promise) {
      inflight.delete(key);
    }
  });

  inflight.set(key, promise);
  return promise;
}

/** Drop pending shared requests after account/session switch. */
export function clearInflightRequests() {
  inflight.clear();
}
