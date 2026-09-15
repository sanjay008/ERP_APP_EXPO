import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  applyOtaUpdateIfAvailable,
  reloadForPendingOtaUpdate,
} from "../utils/otaUpdate";

/**
 * Downloads OTA on launch / foreground.
 * Reloads only when app goes to background so first open does not crash on Android.
 */
export function useOtaAutoReload() {
  const checkingRef = useRef(false);

  useEffect(() => {
    const runDownload = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        await applyOtaUpdateIfAvailable();
      } finally {
        checkingRef.current = false;
      }
    };

    runDownload();

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === "active") {
        runDownload();
        return;
      }
      if (state === "background" || state === "inactive") {
        void reloadForPendingOtaUpdate();
      }
    };

    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);
}
