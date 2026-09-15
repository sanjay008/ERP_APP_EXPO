import { Linking, Platform } from "react-native";

export function isOpenableAddress(value?: string | null): boolean {
  const address = value?.trim();
  if (!address || address === "-") return false;
  return true;
}

export async function openMapsAddress(address?: string | null): Promise<void> {
  if (!isOpenableAddress(address)) return;

  const encoded = encodeURIComponent(address!.trim());
  const primaryUrl =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?q=${encoded}`
      : `geo:0,0?q=${encoded}`;
  const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  try {
    await Linking.openURL(primaryUrl);
  } catch {
    await Linking.openURL(fallbackUrl).catch(() => undefined);
  }
}
