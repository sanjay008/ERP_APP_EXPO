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
import type { PickedDocumentFile, QuickUploadType } from "./types";
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

export default function DocumentUploadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ documentType?: string }>();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const documentType = useMemo(
    () => parseDocumentTypeParam(params.documentType),
    [params.documentType],
  );
  const minPhotos = Math.max(1, Number(documentType?.min_photos || 2));
  const requiresExpiry = documentType?.expire_date_required !== false;
  const allowCamera = documentType?.allow_camera !== false;
  const typeName = documentType?.type || "";
  const typeSlug = documentType?.slug || "";

  const [photos, setPhotos] = useState<(PickedDocumentFile | null)[]>([null, null]);
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryPickerOpen, setExpiryPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    parts.push(
      minPhotos === 1 ? t("At least 1 photo") : t(`At least ${minPhotos} photos`),
    );
    if (requiresExpiry) parts.push(t("Expiry date required"));
    return parts.join(" · ");
  }, [minPhotos, requiresExpiry, t]);

  const applyPhotoAt = useCallback(
    (index: number, file: PickedDocumentFile) => {
      setPhotos((prev) => {
        const next = [...prev];
        while (next.length < minPhotos) next.push(null);
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
    [minPhotos],
  );

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

  const openGallery = async (): Promise<PickedDocumentFile | null> => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setToast({
          visible: true,
          text: t("Permission denied"),
          type: "error",
          top: 45,
        });
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: false,
      exif: false,
    });

    if (result.canceled || !result.assets?.[0]) return null;
    return assetToFile(result.assets[0]);
  };

  const openSourcePicker = (index: number) => {
    if (!allowCamera) {
      void (async () => {
        const file = await openGallery();
        if (file) applyPhotoAt(index, file);
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

    const file = source === "camera" ? await openCamera() : await openGallery();
    if (!file) return;
    applyPhotoAt(index, file);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!photos[0]) next.front = t("Front photo is required");
    if (!photos[1]) next.back = t("Back photo is required");
    if (requiresExpiry && !expiryDate) next.expiry_date = t("Expiry date is required");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onUpload = async () => {
    if (!documentType || !validate()) return;

    const frontPhoto = photos[0];
    const backPhoto = photos[1];
    if (!frontPhoto || !backPhoto) return;

    setLoading(true);
    try {
      const userData = await loadDocumentAuthUser();
      const res = await quickUploadDocuments(userData, {
        type: typeName || typeSlug,
        expire_date: requiresExpiry ? expiryDate : undefined,
        front_file: {
          ...frontPhoto,
          name: "photo_front.jpg",
        },
        back_file: {
          ...backPhoto,
          name: "photo_back.jpg",
        },
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
        <View style={[styles.background, styles.content]}>
          <Text style={styles.sectionHint}>
            {t("Something went wrong. Please try again.")}
          </Text>
          <AuthButton title={t("Back")} onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const slots = [0, 1];
  const slotErrorKey = (index: number) =>
    index === 0 ? "front" : index === 1 ? "back" : `photo_${index}`;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t(typeName)} onBack={() => router.back()} />
      <View style={styles.background}>
        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>{t(typeName)}</Text>
            <Text style={styles.introText}>{subtitle}</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("Photos")}</Text>
              <Text style={styles.sectionMeta}>{`${photos.filter(Boolean).length}/2`}</Text>
            </View>
            <Text style={styles.sectionHint}>
              {t("Add clear Front and Back photos of the document")}
            </Text>

            <View style={styles.photoRow}>
              {slots.map((index) => {
                const photo = photos[index];
                const errKey = slotErrorKey(index);
                const slotError = errors[errKey];
                const slotLabel =
                  index === 0
                    ? t("Front")
                    : index === 1
                      ? t("Back of document")
                      : `${t("Photo")} ${index + 1}`;
                return (
                  <View key={`slot-${index}`} style={styles.photoColumn}>
                    <Text style={styles.slotCaption}>
                      {slotLabel}
                      <Text style={styles.required}> *</Text>
                    </Text>
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
                          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
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
                            {allowCamera ? t("Camera or Gallery") : t("Tap to select")}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {slotError ? <Text style={styles.fieldError}>{slotError}</Text> : null}
                  </View>
                );
              })}
            </View>
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

          <AuthButton title={t("Upload")} onPress={onUpload} disabled={loading} />
        </KeyboardAwareScrollView>
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
