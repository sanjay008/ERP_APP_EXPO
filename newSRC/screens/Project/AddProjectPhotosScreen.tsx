import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet from "../../Components/SelectionBottomSheet";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  collectProjectFolderNames,
  createProjectPhotoFolders,
  fetchProjectFiles,
  fetchProjects,
  projectFolderName,
  uploadProjectPhoto,
  type ProjectFileItem,
  type ProjectItem,
  type ProjectUploadFile,
} from "../../services/projectService";
import { hasPermission } from "../../utils/permissionFlags";
import { useScreenInsets } from "../../utils/screenInsets";
import { pickProjectPhotos } from "../../utils/projectPhotoPicker";
import { parseApiError } from "../../utils/apiError";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Colors } from "../../utils/colors";
import { projectFileUrl } from "./ProjectFilesSections";

type SheetKind = "project" | "folder" | null;

export default function AddProjectPhotosScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, footerPadding } = useScreenInsets();
  const { permissions } = useAppData();
  const { setToast } = useContext(RegisterBackContext);
  const params = useLocalSearchParams<{ title?: string }>();
  const titleParam = Array.isArray(params.title) ? params.title[0] : params.title;
  const canCreate = hasPermission(permissions, "project_photos_mobile", "create");

  const { apiError, clearApiError, captureApiError } = useApiErrorState();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [folder, setFolder] = useState("");
  const [folderPhotos, setFolderPhotos] = useState<ProjectFileItem[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [pending, setPending] = useState<ProjectUploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProject = projects.find((item) => String(item.id) === projectId);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      clearApiError();
      const response = await fetchProjects();
      if (response?.status && Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        setProjects([]);
      }
    } catch (error) {
      captureApiError(error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [captureApiError, clearApiError]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const applyFiles = useCallback((photos: ProjectFileItem[], names: string[], selected: string) => {
    setFolders(names);
    setFolderPhotos(photos.filter((item) => projectFolderName(item) === selected));
    setShowCreateFolder(names.length === 0);
  }, []);

  const loadFolders = useCallback(
    async (id: string, selected = "") => {
      if (!id) return;
      try {
        setFoldersLoading(true);
        setErrors((prev) => ({ ...prev, folders: "" }));
        const data = await fetchProjectFiles(id);
        const names = collectProjectFolderNames(data);
        const nextFolder = selected && names.includes(selected) ? selected : "";
        setFolder(nextFolder);
        applyFiles(data.photos, names, nextFolder);
      } catch (error) {
        setFolders([]);
        setFolder("");
        setFolderPhotos([]);
        setErrors((prev) => ({
          ...prev,
          folders: parseApiError(error, t("Something went wrong")).message,
        }));
      } finally {
        setFoldersLoading(false);
      }
    },
    [applyFiles, t]
  );

  const selectProject = (id: string) => {
    setProjectId(id);
    setFolder("");
    setPending([]);
    setFolderName("");
    setFolderPhotos([]);
    setErrors((prev) => ({ ...prev, project: "", folder: "", photos: "" }));
    void loadFolders(id);
  };

  const createFolder = async () => {
    if (!projectId || creatingFolder) return;
    const name = folderName.trim();
    if (!name) {
      setErrors((prev) => ({ ...prev, folderName: t("This field is required") }));
      return;
    }
    try {
      setCreatingFolder(true);
      setErrors((prev) => ({ ...prev, folderName: "", form: "" }));
      const before = new Set(folders);
      await createProjectPhotoFolders(projectId, 1, name);
      const data = await fetchProjectFiles(projectId);
      const names = collectProjectFolderNames(data);
      const created = names.find((item) => !before.has(item)) || (names.includes(name) ? name : names[0] || name);
      setFolder(created);
      setFolderName("");
      setShowCreateFolder(false);
      applyFiles(data.photos, names, created);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: parseApiError(error, t("Something went wrong")).message,
      }));
    } finally {
      setCreatingFolder(false);
    }
  };

  const addPhotos = async (source: "camera" | "gallery") => {
    if (!projectId) {
      setErrors((prev) => ({ ...prev, project: t("This field is required") }));
      return;
    }
    if (!folder) {
      setErrors((prev) => ({ ...prev, folder: t("This field is required") }));
      return;
    }
    const picked = await pickProjectPhotos(source);
    if (!picked.ok) {
      if (picked.reason === "permission") {
        setErrors((prev) => ({
          ...prev,
          photos: t("Permission required to access photos"),
        }));
      }
      return;
    }
    setPending((current) => {
      const known = new Set(current.map((item) => item.uri));
      const next = picked.assets
        .filter((asset) => !known.has(asset.uri))
        .map((asset) => ({
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          name: asset.name || `photo_${Date.now()}.jpg`,
        }));
      return [...current, ...next];
    });
    setErrors((prev) => ({ ...prev, photos: "", form: "" }));
  };

  const upload = async () => {
    if (uploading) return;
    if (!projectId) {
      setErrors((prev) => ({ ...prev, project: t("This field is required") }));
      return;
    }
    if (!folder) {
      setErrors((prev) => ({ ...prev, folder: t("This field is required") }));
      return;
    }
    if (!pending.length) {
      setErrors((prev) => ({ ...prev, photos: t("This field is required") }));
      return;
    }
    try {
      setUploading(true);
      setErrors((prev) => ({ ...prev, form: "" }));
      await uploadProjectPhoto(projectId, folder, pending);
      setPending([]);
      const data = await fetchProjectFiles(projectId);
      const names = collectProjectFolderNames(data);
      applyFiles(data.photos, names.length ? names : folders, folder);
      setToast({
        top: 45,
        text: t("Photos uploaded"),
        type: "success",
        visible: true,
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: parseApiError(error, t("Something went wrong")).message,
      }));
    } finally {
      setUploading(false);
    }
  };

  if (!canCreate) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={titleParam ? t(titleParam) : t("Project foto's")} onBack={() => router.back()} />

      {loading || apiError ? (
        <ApiFeedback loading={loading} error={apiError} onRetry={loadProjects} />
      ) : (
        <>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.content}
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FormSelectField
              label={t("Project")}
              required
              placeholder={t("Select project")}
              value={selectedProject?.project_name || ""}
              error={errors.project}
              onPress={() => setSheet("project")}
            />

            <FormSelectField
              label={t("Select folder")}
              required
              placeholder={folders.length ? t("Select folder") : t("Create a folder first")}
              value={folder}
              error={errors.folder || errors.folders}
              disabled={!projectId || foldersLoading}
              onPress={() => {
                if (!projectId) {
                  setErrors((prev) => ({ ...prev, project: t("This field is required") }));
                  return;
                }
                if (!folders.length) {
                  setShowCreateFolder(true);
                  return;
                }
                setSheet("folder");
              }}
            />
            {foldersLoading ? <ActivityIndicator color={AppColors.primary} /> : null}

            {projectId && !foldersLoading ? (
              <View style={styles.createBlock}>
                {!showCreateFolder && folders.length ? (
                  <Pressable onPress={() => setShowCreateFolder(true)}>
                    <Text style={styles.link}>{t("Create folder")}</Text>
                  </Pressable>
                ) : (
                  <>
                    <Text style={styles.label}>{t("Folder name")}</Text>
                    <TextInput
                      style={[styles.input, errors.folderName ? styles.inputError : null]}
                      value={folderName}
                      onChangeText={(value) => {
                        setFolderName(value);
                        if (errors.folderName) setErrors((prev) => ({ ...prev, folderName: "" }));
                      }}
                      placeholder={t("Folder name")}
                      placeholderTextColor={Colors.placeholder}
                      editable={!creatingFolder}
                    />
                    {errors.folderName ? <Text style={styles.error}>{errors.folderName}</Text> : null}
                    <Pressable
                      style={[styles.secondaryBtn, creatingFolder && styles.disabled]}
                      onPress={() => void createFolder()}
                      disabled={creatingFolder}
                    >
                      {creatingFolder ? (
                        <ActivityIndicator color={AppColors.primary} />
                      ) : (
                        <Text style={styles.secondaryBtnText}>{t("Create folder")}</Text>
                      )}
                    </Pressable>
                  </>
                )}
              </View>
            ) : null}

            <Text style={styles.label}>{t("Photos")}</Text>
            <View style={styles.actionRow}>
              <Pressable style={styles.actionBtn} onPress={() => void addPhotos("camera")} disabled={uploading}>
                <Ionicons name="camera-outline" size={20} color={AppColors.primary} />
                <Text style={styles.actionText}>{t("Camera (1 photo, crop)")}</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => void addPhotos("gallery")} disabled={uploading}>
                <Ionicons name="images-outline" size={20} color={AppColors.primary} />
                <Text style={styles.actionText}>{t("Gallery (multiple)")}</Text>
              </Pressable>
            </View>
            {errors.photos ? <Text style={styles.error}>{errors.photos}</Text> : null}

            {pending.length ? (
              <View style={styles.grid}>
                {pending.map((photo, index) => (
                  <View key={`${photo.uri}-${index}`} style={styles.cell}>
                    <Image source={{ uri: photo.uri }} style={styles.image} />
                    <Pressable
                      style={styles.remove}
                      onPress={() => setPending((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <Ionicons name="close" size={14} color={AppColors.white} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {folder && folderPhotos.length ? (
              <>
                <Text style={styles.label}>{t("Photos")}</Text>
                <View style={styles.grid}>
                  {folderPhotos.map((photo, index) => {
                    const url = projectFileUrl(photo);
                    return (
                      <View key={`saved-${photo.id ?? index}`} style={styles.cell}>
                        {url ? (
                          <Image source={{ uri: url }} style={styles.image} />
                        ) : (
                          <View style={styles.image} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
          </KeyboardAwareScrollView>

          <View style={[styles.footer, { paddingBottom: footerPadding }]}>
            <Pressable
              style={[styles.uploadBtn, (uploading || !pending.length) && styles.disabled]}
              onPress={() => void upload()}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <Text style={styles.uploadText}>{t("Upload photos")}</Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      <SelectionBottomSheet
        visible={sheet === "project"}
        title={t("Select project")}
        searchPlaceholder={t("Search")}
        confirmText={t("Done")}
        options={projects.map((item) => ({
          id: String(item.id),
          label: item.project_name || String(item.id),
        }))}
        selectedIds={projectId ? [projectId] : []}
        onClose={() => setSheet(null)}
        onConfirm={(selected) => {
          const id = selected[0] ? String(selected[0].id) : "";
          setSheet(null);
          if (id) selectProject(id);
        }}
      />
      <SelectionBottomSheet
        visible={sheet === "folder"}
        title={t("Select folder")}
        searchPlaceholder={t("Search")}
        confirmText={t("Done")}
        options={folders.map((name) => ({ id: name, label: name }))}
        selectedIds={folder ? [folder] : []}
        onClose={() => setSheet(null)}
        onConfirm={(selected) => {
          const name = selected[0] ? String(selected[0].id) : "";
          setSheet(null);
          setErrors((prev) => ({ ...prev, folder: "" }));
          if (projectId && name) void loadFolders(projectId, name);
        }}
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
    gap: 12,
    paddingBottom: 24,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  createBlock: {
    gap: 8,
  },
  link: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.primary,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: FONTS.LexendRegular,
    fontSize: 15,
    color: AppColors.black,
  },
  inputError: {
    borderColor: Colors.dicline,
  },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.primary,
  },
  actionRow: {
    gap: 8,
  },
  actionBtn: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cell: {
    width: "30%",
    aspectRatio: 1,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#F3F5F8",
  },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: Colors.dicline,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  uploadBtn: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.white,
  },
  disabled: {
    opacity: 0.6,
  },
});
