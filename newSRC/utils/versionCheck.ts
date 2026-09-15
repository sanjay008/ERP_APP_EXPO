import Constants from "expo-constants";
import { Platform } from "react-native";

const IOS_APP_ID = "6523437695";
const ANDROID_PACKAGE = "com.erpportaal";

export function getCurrentAppVersion(): string {
  return Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? "1.0.0";
}

export function parseVersion(version: string): number[] {
  if (!version) return [0, 0, 0];
  return version.split(".").map((part) => parseInt(part, 10) || 0);
}

export function isUpdateAvailable(latest: string, current: string): boolean {
  const latestParts = parseVersion(latest);
  const currentParts = parseVersion(current);
  const length = Math.max(latestParts.length, currentParts.length);

  for (let index = 0; index < length; index += 1) {
    const latestValue = latestParts[index] ?? 0;
    const currentValue = currentParts[index] ?? 0;
    if (latestValue > currentValue) return true;
    if (latestValue < currentValue) return false;
  }

  return false;
}

async function fetchIosLatestVersion(): Promise<string | null> {
  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${IOS_APP_ID}&country=nl`
  );
  const json = await response.json();
  return json?.results?.[0]?.version ?? null;
}

async function fetchAndroidLatestVersion(): Promise<string | null> {
  const response = await fetch(
    `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&hl=en`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
      },
    }
  );
  const html = await response.text();
  const match = html.match(/\[\[\["([\d.]+?)"\]\]/);
  return match?.[1] ?? null;
}

export async function checkStoreUpdateAvailable(): Promise<boolean> {
  try {
    const current = getCurrentAppVersion();
    const latest =
      Platform.OS === "ios"
        ? await fetchIosLatestVersion()
        : await fetchAndroidLatestVersion();

    if (!latest) return false;
    return isUpdateAvailable(latest, current);
  } catch {
    return false;
  }
}

export function getStoreUrl(): string {
  return Platform.OS === "ios"
    ? `https://apps.apple.com/nl/app/erp-portaal/id${IOS_APP_ID}`
    : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&hl=nl`;
}
