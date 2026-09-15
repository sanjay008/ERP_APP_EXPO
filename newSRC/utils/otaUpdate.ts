import * as Updates from "expo-updates";

let inFlight: Promise<boolean> | null = null;
let pendingReload = false;

/**
 * Downloads an OTA bundle if available.
 * Does NOT call reloadAsync immediately — that kills Android on first open
 * (looks like a crash; second open then works).
 *
 * Downloaded update applies on next cold start, or when
 * `reloadForPendingOtaUpdate()` runs (e.g. app went to background).
 */
export async function applyOtaUpdateIfAvailable(): Promise<boolean> {
  if (__DEV__) return false;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      if (!Updates.isEnabled) return false;

      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return false;

      await Updates.fetchUpdateAsync();
      pendingReload = true;
      return true;
    } catch (error) {
      console.log("OTA auto-update skipped:", error);
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Apply a previously downloaded OTA when it is safe (e.g. app backgrounding). */
export async function reloadForPendingOtaUpdate(): Promise<boolean> {
  if (__DEV__ || !pendingReload) return false;

  try {
    if (!Updates.isEnabled) return false;
    pendingReload = false;
    await Updates.reloadAsync();
    return true;
  } catch (error) {
    pendingReload = true;
    console.log("OTA reload skipped:", error);
    return false;
  }
}
