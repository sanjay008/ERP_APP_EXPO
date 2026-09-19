import React, { useCallback, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AuthButton from "../../Components/Auth/AuthButton";
import AppDatePickerSheet from "../../Components/AppDatePickerSheet";
import ScreenHeader from "../../Components/ScreenHeader";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors as Colors } from "../../utils/theme";
import { Images } from "../../utils/Images";
import DocumentImageSourceSheet, {
  type ImageSourceChoice,
} from "./DocumentImageSourceSheet";
import { styles } from "./styles";
import {
  getMaxFiles,
  getMinPhotos,
  isCertificateDocumentType,
  isDocFlag,
  isMultiPhotoType,
  isPdfFile,
  type PickedDocumentFile,
  type QuickUploadType,
} from "./types";
import {
  extractDocumentApiError,
  isApiSuccess,
  loadDocumentAuthUser,
  quickUploadDocuments,
} from "./uploadDocumentsApi";

function assetToFile(asset: ImagePicker.ImagePickerAsset): PickedDocumentFile {
  const uri = asset.uri;
  const ext =
    uri?.split(".").pop()?.split("?")[0]?.toLowerCase() ||
    (asset.mimeType?.includes("png") ? "png" : "jpg");
  const mime = asset.mimeType || (ext === "png" ? "image/png" : "image/jpeg");
  return {
    uri,
    name:
      asset.fileName ||
      `document_${Date.now()}.${ext === "jpeg" ? "jpg" : ext}`,
    type: mime,
  };
}

function toYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseYmd(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
}

function parseDocumentTypeParam(raw: string | string[] | undefined): QuickUploadType | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as QuickUploadType;
    if (parsed && (parsed.type || parsed.slug)) return parsed;
  } catch {
    return undefined;
  }
  return undefined;
}

function emptySlots(count: number) {
  return Array.from({ length: count }, () => null as PickedDocumentFile | null);
}

export default function DocumentUploadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ documentType?: string }>();
  const { top, footerPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const documentType = useMemo(
    () => parseDocumentTypeParam(params.documentType),
    [params.documentType],
  );
  const minPhotos = getMinPhotos(documentType);
  const maxFiles = getMaxFiles(documentType);
  const requiresExpiry = isCertificateDocumentType(documentType)
    ? false
    : isDocFlag(documentType?.expire_date_required, true);
  const allowCamera = isDocFlag(documentType?.allow_camera, true);
  const acceptPdf = isDocFlag(documentType?.accept_pdf);
  const isMultiUpload = isMultiPhotoType(documentType);
  const typeName = documentType?.type || "";
  const typeSlug = documentType?.slug || "";
  const isSingleFile = !isMultiUpload && minPhotos === 1;

  const [photos, setPhotos] = useState<(PickedDocumentFile | null)[]>(() =>
    emptySlots(isMultiPhotoType(documentType) ? 1 : getMinPhotos(documentType)),
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryPickerOpen, setExpiryPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (isMultiUpload) {
      parts.push(t("Add multiple photos"));
    } else if (isSingleFile) {
      parts.push(acceptPdf ? t("Photo or PDF") : t("At least 1 photo"));
    } else {
      parts.push(t(`At least ${minPhotos} photos`));
    }
    if (requiresExpiry) parts.push(t("Expiry date required"));
    return parts.join(" · ");
  }, [acceptPdf, isMultiUpload, isSingleFile, minPhotos, requiresExpiry, t]);

  const applyPhotoAt = useCallback(
    (index: number, file: PickedDocumentFile) => {
      setPhotos((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push(null);
        next[index] = file;
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photos;
        delete next[`photo_${index}`];
        if (index === 0) delete next.front;
        if (index === 1) delete next.back;
        return next;
      });
    },
    [],
  );

  const appendPhotos = useCallback((files: PickedDocumentFile[]) => {
    if (!files.length) return;
    setPhotos((prev) => {
      const next = [...prev];
      const firstEmpty = next.findIndex((item) => !item);
      let cursor = firstEmpty >= 0 ? firstEmpty : next.length;
      files.forEach((file) => {
        if (cursor >= maxFiles) return;
        if (cursor < next.length) next[cursor] = file;
        else next.push(file);
        cursor += 1;
      });
      return next.slice(0, maxFiles);
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.photos;
      delete next.front;
      return next;
    });
  }, [maxFiles]);

  const addPhotoSlot = useCallback(() => {
    setPhotos((prev) => (prev.length >= maxFiles ? prev : [...prev, null]));
  }, [maxFiles]);

  const removePhotoSlot = useCallback((index: number) => {
    setPhotos((prev) => {
      if (prev.length <= 1) {
        const next = [...prev];
        next[index] = null;
        return next;
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  }, []);

  const openCamera = async (): Promise<PickedDocumentFile | null> => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      setToast({
        visible: true,
        text: t("Please allow camera access"),
        type: "error",
        top: 45,
      });
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
      exif: false,
    });

    if (result.canceled || !result.assets?.[0]) return null;
    return assetToFile(result.assets[0]);
  };

  const openGallery = async (multiple = false): Promise<PickedDocumentFile[]> => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setToast({
          visible: true,
          text: t("Permission denied"),
          type: "error",
          top: 45,
        });
        return [];
      }
    }

    const remaining = Math.max(1, maxFiles - photos.filter(Boolean).length);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? remaining : 1,
      exif: false,
    });

    if (result.canceled || !result.assets?.length) return [];
    return result.assets.map(assetToFile);
  };

  const openFiles = async (): Promise<PickedDocumentFile | null> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: acceptPdf ? ["application/pdf", "image/*"] : ["image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.name || `document_${Date.now()}.pdf`,
      type: asset.mimeType || "application/pdf",
    };
  };

  const openSourcePicker = (index: number) => {
    const onlyGallery = !allowCamera && !acceptPdf;
    if (onlyGallery) {
      void (async () => {
        const files = await openGallery(isMultiUpload);
        if (isMultiUpload) appendPhotos(files);
        else if (files[0]) applyPhotoAt(index, files[0]);
      })();
      return;
    }
    setPendingSlotIndex(index);
    setSourceSheetOpen(true);
  };

  const onSourceSelect = async (source: ImageSourceChoice) => {
    const index = pendingSlotIndex;
    setSourceSheetOpen(false);
    setPendingSlotIndex(null);
    if (index == null) return;

    await new Promise((resolve) => setTimeout(resolve, 400));

    const files =
      source === "camera"
        ? [await openCamera()].filter(Boolean) as PickedDocumentFile[]
        : source === "files"
          ? [await openFiles()].filter(Boolean) as PickedDocumentFile[]
          : await openGallery(isMultiUpload);

    if (!files.length) return;
    if (index < 0 || isMultiUpload) {
      if (index >= 0 && files[0]) applyPhotoAt(index, files[0]);
      appendPhotos(index >= 0 ? files.slice(1) : files);
      return;
    }
    applyPhotoAt(index, files[0]);
  };

  const slotErrorKey = (index: number) =>
    index === 0 ? "front" : index === 1 ? "back" : `photo_${index}`;

  const validate = () => {
    const next: Record<string, string> = {};
    const filled = photos.filter(Boolean);
    if (isMultiUpload) {
      if (!filled.length) next.photos = t("Photo is required");
    } else {
      for (let index = 0; index < minPhotos; index += 1) {
        if (photos[index]) continue;
        if (index === 0) {
          next.front = isSingleFile
            ? t("Photo is required")
            : t("Front photo is required");
        } else if (index === 1) {
          next.back = t("Back photo is required");
        } else {
          next[`photo_${index}`] = t("Photo is required");
        }
      }
    }
    if (requiresExpiry && !expiryDate) next.expiry_date = t("Expiry date is required");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onUpload = async () => {
    if (!documentType || !validate()) return;

    const filled = photos.filter((item): item is PickedDocumentFile => Boolean(item));
    if (!filled.length) return;

    setLoading(true);
    try {
      const userData = await loadDocumentAuthUser();

      if (isMultiUpload) {
        for (const [index, photo] of filled.entries()) {
          const stamp = `${toYmd(new Date())}-${Date.now().toString().slice(-4)}-${index + 1}`;
          const res = await quickUploadDocuments(userData, {
            type: typeName || typeSlug,
            expire_date: requiresExpiry ? expiryDate : undefined,
            filename: `${typeName || typeSlug} ${stamp}`,
            front_file: {
              ...photo,
              name: isPdfFile(photo) ? photo.name : `photo_${index + 1}.jpg`,
            },
          });
          if (!isApiSuccess(res)) {
            throw new Error(
              extractDocumentApiError(res) ||
                (typeof res?.message === "string" ? res.message : "") ||
                t("Something went wrong. Please try again."),
            );
          }
        }
        setToast({
          visible: true,
          text: t("Submitted successfully"),
          type: "success",
          top: 45,
        });
        router.back();
        return;
      }

      const frontPhoto = filled[0];
      const backPhoto = photos[1] || null;
      const stamp = `${toYmd(new Date())}-${Date.now().toString().slice(-4)}`;
      const res = await quickUploadDocuments(userData, {
        type: typeName || typeSlug,
        expire_date: requiresExpiry ? expiryDate : undefined,
        filename: `${typeName || typeSlug} ${stamp}`,
        front_file: {
          ...frontPhoto,
          name: isPdfFile(frontPhoto) ? frontPhoto.name : "photo_front.jpg",
        },
        back_file: backPhoto
          ? {
              ...backPhoto,
              name: isPdfFile(backPhoto) ? backPhoto.name : "photo_back.jpg",
            }
          : null,
      });

      if (isApiSuccess(res)) {
        setToast({
          visible: true,
          text: t(res?.message || "Submitted successfully"),
          type: "success",
          top: 45,
        });
        router.back();
        return;
      }

      setToast({
        visible: true,
        text:
          extractDocumentApiError(res) ||
          (typeof res?.message === "string" ? t(res.message) : "") ||
          t("Something went wrong. Please try again."),
        type: "error",
        top: 45,
      });
    } catch (error: any) {
      const apiMsg =
        extractDocumentApiError(error?.response?.data) ||
        getApiErrorMessage(error, t("Something went wrong. Please try again."));
      setToast({
        visible: true,
        text: apiMsg,
        type: "error",
        top: 45,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!documentType) {
    return (
      <View style={[styles.container, { paddingTop: top }]}>
        <ScreenHeader title={t("Upload Documents")} onBack={() => router.back()} />
        <View style={[styles.background, styles.content, { paddingBottom: footerPadding }]}>
          <Text style={styles.sectionHint}>
            {t("Something went wrong. Please try again.")}
          </Text>
          <AuthButton title={t("Back")} onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const slots = Array.from(
    { length: isMultiUpload ? photos.length : minPhotos },
    (_, index) => index,
  );
  const filledCount = photos.filter(Boolean).length;
  const photoHint = isMultiUpload
    ? t("Add photos of each certificate. You can add more than one.")
    : isSingleFile
      ? acceptPdf
        ? t("Add a photo or PDF of the certificate")
        : t("Add a clear photo of the document")
      : t("Add clear Front and Back photos of the document");

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t(typeName)} onBack={() => router.back()} />
      <View style={styles.background}>
        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>{t(typeName)}</Text>
            <Text style={styles.introText}>{subtitle}</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{acceptPdf ? t("Files") : t("Photos")}</Text>
              <Text style={styles.sectionMeta}>
                {`${filledCount}/${isMultiUpload ? maxFiles : minPhotos}`}
              </Text>
            </View>
            <Text style={styles.sectionHint}>{photoHint}</Text>
            {errors.photos ? <Text style={styles.fieldError}>{errors.photos}</Text> : null}

            <View style={styles.photoRow}>
              {slots.map((index) => {
                const photo = photos[index];
                const errKey = slotErrorKey(index);
                const slotError = errors[errKey];
                const slotLabel = isMultiUpload
                  ? `${t("Photo")} ${index + 1}`
                  : isSingleFile
                    ? t("Photo")
                    : index === 0
                      ? t("Front")
                      : index === 1
                        ? t("Back of document")
                        : `${t("Photo")} ${index + 1}`;
                return (
                  <View
                    key={`slot-${index}`}
                    style={[
                      styles.photoColumn,
                      (isSingleFile || isMultiUpload) && styles.photoColumnSingle,
                    ]}
                  >
                    <View style={styles.slotCaptionRow}>
                      <Text style={styles.slotCaption}>
                        {slotLabel}
                        {!isMultiUpload || index === 0 ? (
                          <Text style={styles.required}> *</Text>
                        ) : null}
                      </Text>
                      {isMultiUpload && photos.length > 1 ? (
                        <Pressable onPress={() => removePhotoSlot(index)} hitSlop={8}>
                          <Text style={styles.removePhotoText}>{t("Remove")}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.photoSlot,
                        photo ? styles.photoSlotFilled : null,
                        slotError ? styles.photoSlotError : null,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => openSourcePicker(index)}
                    >
                      {photo ? (
                        <>
                          {isPdfFile(photo) ? (
                            <View style={styles.pdfPreview}>
                              <Image
                                source={Images.PdfLogo}
                                style={styles.pdfPreviewIcon}
                                tintColor={Colors.primary}
                              />
                              <Text style={styles.pdfPreviewName} numberOfLines={2}>
                                {photo.name}
                              </Text>
                            </View>
                          ) : (
                            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                          )}
                          <View style={styles.photoOverlay}>
                            <View style={styles.retakeBtn}>
                              <Text style={styles.retakeText}>{t("Change")}</Text>
                            </View>
                          </View>
                        </>
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <View
                            style={[
                              styles.photoIconCircle,
                              slotError ? styles.photoIconCircleError : null,
                            ]}
                          >
                            <Image
                              source={Images.UploadPhoto}
                              style={styles.photoPlaceholderIcon}
                              tintColor={slotError ? Colors.red : Colors.primary}
                            />
                          </View>
                          <Text
                            style={[
                              styles.photoAction,
                              slotError ? styles.photoActionError : null,
                            ]}
                          >
                            {acceptPdf
                              ? t("Camera, Gallery or File")
                              : allowCamera
                                ? t("Camera or Gallery")
                                : t("Tap to select")}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {slotError ? <Text style={styles.fieldError}>{slotError}</Text> : null}
                  </View>
                );
              })}
            </View>
            {isMultiUpload && photos.length < maxFiles ? (
              <TouchableOpacity style={styles.addPhotosBtn} onPress={addPhotoSlot} activeOpacity={0.85}>
                <Text style={styles.addPhotosText}>{t("Add photo")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {requiresExpiry ? (
            <View style={styles.sectionCard}>
              <View style={styles.field}>
                <Text style={styles.label}>
                  {t("Expiry Date")}
                  <Text style={styles.required}> *</Text>
                </Text>
                <Pressable
                  style={[
                    styles.dateField,
                    expiryDate ? styles.dateFieldActive : null,
                    errors.expiry_date ? styles.dateFieldError : null,
                  ]}
                  onPress={() => {
                    setExpiryPickerOpen(true);
                    setErrors((prev) => {
                      if (!prev.expiry_date) return prev;
                      const next = { ...prev };
                      delete next.expiry_date;
                      return next;
                    });
                  }}
                >
                  <Image
                    source={Images.date}
                    style={styles.dateIcon}
                    tintColor={
                      errors.expiry_date
                        ? Colors.red
                        : expiryDate
                          ? Colors.primary
                          : Colors.darkText
                    }
                  />
                  {expiryDate ? (
                    <Text style={styles.dateText}>{formatDisplayDate(expiryDate)}</Text>
                  ) : (
                    <Text style={styles.datePlaceholder}>{t("Select Date")}</Text>
                  )}
                </Pressable>
                {errors.expiry_date ? (
                  <Text style={styles.fieldError}>{errors.expiry_date}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </KeyboardAwareScrollView>
        <View style={[styles.uploadFooter, { paddingBottom: footerPadding }]}>
          <AuthButton title={t("Upload")} onPress={onUpload} disabled={loading} />
        </View>
      </View>

      <AppDatePickerSheet
        visible={expiryPickerOpen}
        value={expiryDate ? parseYmd(expiryDate) : new Date()}
        onConfirm={(date) => {
          setExpiryDate(toYmd(date));
          setExpiryPickerOpen(false);
          setErrors((prev) => {
            const next = { ...prev };
            delete next.expiry_date;
            return next;
          });
        }}
        onClose={() => setExpiryPickerOpen(false)}
      />

      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : null}

      <DocumentImageSourceSheet
        visible={sourceSheetOpen}
        showCamera={allowCamera}
        showGallery
        showFiles={acceptPdf}
        onClose={() => {
          setSourceSheetOpen(false);
          setPendingSlotIndex(null);
        }}
        onSelect={(source) => {
          void onSourceSelect(source);
        }}
      />
    </View>
  );
}
