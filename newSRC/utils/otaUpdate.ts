import * as Updates from "expo-updates";

const OTA_SPLASH_TIMEOUT_MS = 15000;

let splashInFlight: Promise<boolean> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("OTA splash timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Splash-only OTA: check → download → reload before auth routing.
 * Returns false when there is no update or when check/download fails,
 * so splash can continue to the normal session route.
 * When an update is applied, reloadAsync() restarts the JS bundle and
 * this promise does not resolve on the current launch.
 */
export async function applyOtaUpdateOnSplash(): Promise<boolean> {
  if (__DEV__) return false;
  if (splashInFlight) return splashInFlight;

  splashInFlight = (async () => {
    try {
      if (!Updates.isEnabled) return false;

      const result = await withTimeout(Updates.checkForUpdateAsync(), OTA_SPLASH_TIMEOUT_MS);
      if (!result.isAvailable) return false;

      await withTimeout(Updates.fetchUpdateAsync(), OTA_SPLASH_TIMEOUT_MS);
      await Updates.reloadAsync();
      return true;
    } catch (error) {
      console.log("OTA splash update skipped:", error);
      return false;
    } finally {
      splashInFlight = null;
    }
  })();

  return splashInFlight;
}
