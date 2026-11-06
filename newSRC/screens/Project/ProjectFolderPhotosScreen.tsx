import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import OptionBottomSheet from "../../Components/OptionBottomSheet";
import DocumentPreviewModal from "../Documents/DocumentPreviewModal";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchProjectFiles,
  projectFolderName,
  uploadProjectPhoto,
  type ProjectFileItem,
  type ProjectUploadFile,
} from "../../services/projectService";
import { hasPermission } from "../../utils/permissionFlags";
import { useScreenInsets } from "../../utils/screenInsets";
import { pickProjectPhotos } from "../../utils/projectPhotoPicker";
import { parseApiError } from "../../utils/apiError";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { projectFileLabel, projectFileUrl } from "./ProjectFilesSections";

export default function ProjectFolderPhotosScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { permissions } = useAppData();
  const { setToast } = useContext(RegisterBackContext);
  const params = useLocalSearchParams<{ projectId?: string; folder?: string }>();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const folder = Array.isArray(params.folder) ? params.folder[0] : params.folder || "";

  const canCreate = hasPermission(permissions, "project_photos_mobile", "create");
  const { apiError, clearApiError, captureApiError } = useApiErrorState();
  const [photos, setPhotos] = useState<ProjectFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sourceSheet, setSourceSheet] = useState(false);
  const [preview, setPreview] = useState<ProjectFileItem | null>(null);

  const loadPhotos = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      clearApiError();
      const data = await fetchProjectFiles(projectId);
      setPhotos(
        data.photos.filter((item) => projectFolderName(item) === folder)
      );
    } catch (error) {
      captureApiError(error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [captureApiError, clearApiError, folder, projectId]);

  useFocusEffect(
    useCallback(() => {
      void loadPhotos();
    }, [loadPhotos])
  );

  const addPhotos = async (source: "camera" | "gallery") => {
    if (!projectId || !folder) return;
    const picked = await pickProjectPhotos(source);
    if (!picked.ok) {
      if (picked.reason === "permission") {
        setToast({
          top: 45,
          text: t("Permission required to access photos"),
          type: "error",
          visible: true,
        });
      }
      return;
    }

    const files: ProjectUploadFile[] = picked.assets.map((asset) => ({
      uri: asset.uri,
      type: asset.type || "image/jpeg",
      name: asset.name || `photo_${Date.now()}.jpg`,
    }));

    try {
      setUploading(true);
      await uploadProjectPhoto(projectId, folder, files);
      await loadPhotos();
    } catch (error) {
      setToast({
        top: 45,
        text: parseApiError(error, t("Something went wrong")).message,
        type: "error",
        visible: true,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={folder || t("Photos")}
        onBack={() => router.back()}
        createOnPress={canCreate ? () => setSourceSheet(true) : undefined}
      />

      {loading || apiError ? (
        <ApiFeedback loading={loading} error={apiError} onRetry={loadPhotos} />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
          {canCreate ? (
            <Pressable
              style={styles.addRow}
              onPress={() => setSourceSheet(true)}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={AppColors.primary} />
              ) : (
                <Ionicons name="add-circle-outline" size={22} color={AppColors.primary} />
              )}
              <Text style={styles.addText}>{t("Upload photos")}</Text>
            </Pressable>
          ) : null}

          {photos.length ? (
            <View style={styles.grid}>
              {photos.map((photo, index) => {
                const url = projectFileUrl(photo);
                return (
                  <Pressable
                    key={`photo-${photo.id ?? index}`}
                    style={styles.cell}
                    onPress={() => {
                      if (url) setPreview(photo);
                    }}
                  >
                    {url ? (
                      <Image source={{ uri: url }} style={styles.image} />
                    ) : (
                      <View style={styles.fallback}>
                        <Ionicons name="image-outline" size={22} color={AppColors.subtitle} />
                      </View>
                    )}
                    <Text style={styles.caption} numberOfLines={1}>
                      {projectFileLabel(photo, t("Photo"))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.empty}>{t("No photos")}</Text>
          )}
        </ScrollView>
      )}

      <OptionBottomSheet
        visible={sourceSheet}
        title={t("Choose Camera or Gallery")}
        options={[
          { id: "camera", label: t("Camera (1 photo, crop)") },
          { id: "gallery", label: t("Gallery (multiple)") },
        ]}
        onClose={() => setSourceSheet(false)}
        onConfirm={(option) => {
          setSourceSheet(false);
          if (option.id === "camera" || option.id === "gallery") {
            void addPhotos(option.id);
          }
        }}
      />

      <DocumentPreviewModal
        visible={Boolean(preview)}
        title={preview ? projectFileLabel(preview, t("Photo")) : t("Photo")}
        imageUri={preview ? projectFileUrl(preview) : null}
        downloadUrl={preview ? projectFileUrl(preview) : null}
        onClose={() => setPreview(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.primary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cell: {
    width: "30%",
    gap: 6,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#F3F5F8",
  },
  fallback: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#F3F5F8",
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.black,
  },
  empty: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.subtitle,
    textAlign: "center",
    marginTop: 24,
  },
});
