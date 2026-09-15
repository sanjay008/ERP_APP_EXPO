import ImageResizer from "@bam.tech/react-native-image-resizer";

const MAX_DIMENSION = 640;
const COMPRESS_QUALITY = 15;

const isImageFile = (file) => {
  if (!file) return false;
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/")) return true;
  if (type === "image") return true;
  const uriOrName = (file.name || file.uri || "").toLowerCase();
  return /\.(jpe?g|png|webp|heic|heif)$/.test(uriOrName);
};

const ensureJpgName = (name) => {
  if (!name) return `image_${Date.now()}.jpg`;
  return name.replace(/\.(jpe?g|png|webp|heic|heif)$/i, ".jpg");
};

export const compressImage = async (file) => {
  if (!isImageFile(file)) return file;

  try {
    const result = await ImageResizer.createResizedImage(
      file.uri,
      MAX_DIMENSION,
      MAX_DIMENSION,
      "JPEG",
      COMPRESS_QUALITY,
      0,
      null,
      false,
      { mode: "contain", onlyScaleDown: true }
    );

    return {
      ...file,
      uri: result.uri,
      name: ensureJpgName(file.name),
      type: "image/jpeg",
      size: result.size,
    };
  } catch (err) {
    console.log("Image compression failed, using original:", err?.message);
    return file;
  }
};

export const compressImages = async (files = []) => {
  return Promise.all(files.map((file) => compressImage(file)));
};
