export type TicketFileAsset = {
  uri: string;
  name: string;
  type: string;
  file_extension?: string;
};

type PickResult =
  | { ok: true; assets: TicketFileAsset[] }
  | { ok: false; reason: "cancelled" | "permission" | "unavailable" | "error" };

function guessExtension(name: string, mimeType?: string | null) {
  const fromName = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";
  if (fromName) return fromName;
  if (!mimeType) return "jpg";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

function askAddAnotherPhoto(): Promise<boolean> {
  return new Promise((resolve) => {
    // Lazy require keeps this util free of top-level RN cycles in tests.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Alert } = require("react-native") as typeof import("react-native");
    Alert.alert("Camera", "Add another photo?", [
      { text: "No", style: "cancel", onPress: () => resolve(false) },
      { text: "Yes", onPress: () => resolve(true) },
    ]);
  });
}

export async function pickTicketCamera(): Promise<PickResult> {
  try {
    const ImagePicker = await import("expo-image-picker");
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { ok: false, reason: "permission" };

    const collected: TicketFileAsset[] = [];
    let keepCapturing = true;

    while (keepCapturing) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) {
        break;
      }

      collected.push(
        ...result.assets.map((asset, index) => {
          const name = asset.fileName || `camera_${Date.now()}_${index}.jpg`;
          return {
            uri: asset.uri,
            name,
            type: asset.mimeType ?? "image/jpeg",
            file_extension: guessExtension(name, asset.mimeType),
          };
        })
      );

      keepCapturing = await askAddAnotherPhoto();
    }

    if (!collected.length) return { ok: false, reason: "cancelled" };
    return { ok: true, assets: collected };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function pickTicketGallery(): Promise<PickResult> {
  try {
    const ImagePicker = await import("expo-image-picker");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { ok: false, reason: "permission" };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (result.canceled || !result.assets?.length) {
      return { ok: false, reason: "cancelled" };
    }

    return {
      ok: true,
      assets: result.assets.map((asset, index) => {
        const name = asset.fileName || `gallery_${Date.now()}_${index}.jpg`;
        return {
          uri: asset.uri,
          name,
          type: asset.mimeType ?? "image/jpeg",
          file_extension: guessExtension(name, asset.mimeType),
        };
      }),
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function pickTicketDocuments(): Promise<PickResult> {
  try {
    const DocumentPicker = await import("expo-document-picker");
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword", "image/*"],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return { ok: false, reason: "cancelled" };
    }

    return {
      ok: true,
      assets: result.assets.map((asset, index) => {
        const name = asset.name || `document_${Date.now()}_${index}`;
        return {
          uri: asset.uri,
          name,
          type: asset.mimeType ?? "application/octet-stream",
          file_extension: guessExtension(name, asset.mimeType),
        };
      }),
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}
