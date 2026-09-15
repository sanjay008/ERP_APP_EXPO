import { AppState, type AppStateStatus, Platform } from "react-native";

type NetworkStateLike = {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
};

/** Lightweight endpoints — any HTTP response means the device is online. */
const CONNECTIVITY_URLS = [
  "https://clients3.google.com/generate_204",
  "https://app.erpportaal.nl/api/",
] as const;

const CHECK_TIMEOUT_MS = 4500;
const POLL_ONLINE_MS = 15000;
const POLL_OFFLINE_MS = 3000;

export function isOnlineState(state: NetworkStateLike | null | undefined): boolean {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

async function probeUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    // Any response (2xx–5xx) means we reached the network.
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Detect online/offline without native NetInfo / ExpoNetwork modules.
 * Works in Expo Go and older custom builds that lack those native modules.
 */
export async function checkNetworkConnection(): Promise<boolean> {
  // On web, navigator.onLine is a useful first signal.
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }

  for (const url of CONNECTIVITY_URLS) {
    const ok = await probeUrl(url);
    if (ok) return true;
  }
  return false;
}

export function subscribeToNetworkChanges(
  listener: (isOnline: boolean) => void
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastOnline: boolean | null = null;

  const emit = (online: boolean) => {
    if (cancelled) return;
    if (lastOnline === online) return;
    lastOnline = online;
    listener(online);
  };

  const scheduleNext = (online: boolean) => {
    if (cancelled) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void runCheck();
    }, online ? POLL_ONLINE_MS : POLL_OFFLINE_MS);
  };

  const runCheck = async () => {
    if (cancelled) return;
    const online = await checkNetworkConnection();
    emit(online);
    scheduleNext(online);
  };

  // First check immediately.
  void runCheck();

  const onAppStateChange = (state: AppStateStatus) => {
    if (state === "active") {
      void runCheck();
    }
  };
  const appSub = AppState.addEventListener("change", onAppStateChange);

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
    appSub.remove();
  };
}
