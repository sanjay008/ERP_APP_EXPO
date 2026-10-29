import type { TicketFileAsset } from "./ticketFilePicker";

type PickResult =
  | { ok: true; assets: TicketFileAsset[] }
  | { ok: false; reason: "cancelled" | "permission" | "unavailable" | "error" };

function guessExtension(name: string, mimeType?: string | null) {
  const fromName = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";
  if (fromName) return fromName;
  if (!mimeType) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

function toAsset(
  asset: { uri: string; mimeType?: string | null; fileName?: string | null },
  prefix: string,
  index: number
): TicketFileAsset {
  const name = asset.fileName || `${prefix}_${Date.now()}_${index}.jpg`;
  return {
    uri: asset.uri,
    name,
    type: asset.mimeType ?? "image/jpeg",
    file_extension: guessExtension(name, asset.mimeType),
  };
}

/**
 * Project folder photos only.
 * Camera: one image with crop (allowsEditing).
 * Gallery: multi-select, no crop.
 * Does not affect profile / project header image pickers.
 */
export async function pickProjectPhotos(source: "camera" | "gallery"): Promise<PickResult> {
  try {
    const ImagePicker = await import("expo-image-picker");
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return { ok: false, reason: "permission" };
    }

    if (source === "camera") {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return { ok: false, reason: "cancelled" };
      }

      return { ok: true, assets: [toAsset(result.assets[0], "camera", 0)] };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: true,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.length) {
      return { ok: false, reason: "cancelled" };
    }

    return {
      ok: true,
      assets: result.assets.map((asset, index) => toAsset(asset, "gallery", index)),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ExponentImagePicker") || message.includes("native module")) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: false, reason: "error" };
  }
}
