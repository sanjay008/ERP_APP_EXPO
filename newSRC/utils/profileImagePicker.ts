import type { ProfileImageAsset } from "../services/profileService";

type PickResult =
  | { ok: true; asset: ProfileImageAsset }
  | { ok: false; reason: "cancelled" | "permission" | "unavailable" | "error" };

export async function pickProfileImage(source: "camera" | "gallery"): Promise<PickResult> {
  try {
    const ImagePicker = await import("expo-image-picker");

    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return { ok: false, reason: "permission" };
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return { ok: false, reason: "cancelled" };
    }

    const asset = result.assets[0];
    return {
      ok: true,
      asset: {
        uri: asset.uri,
        type: asset.mimeType ?? "image/jpeg",
        name: asset.fileName ?? "profile.jpg",
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ExponentImagePicker") || message.includes("native module")) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: false, reason: "error" };
  }
}
