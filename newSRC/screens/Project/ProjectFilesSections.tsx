import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import FallBackImage from "../../Components/FallBackImage";
import OptionBottomSheet from "../../Components/OptionBottomSheet";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import { RegisterBackContext } from "../../constants/GoBackContext";
import {
  collectProjectFolderNames,
  createProjectPhotoFolders,
  fetchProjectFiles,
  projectFolderName,
  uploadProjectDocument,
  uploadProjectPhoto,
  type ProjectFileItem,
  type ProjectFilesData,
  type ProjectUploadFile,
} from "../../services/projectService";
import { getDropboxDirectLink } from "../../services/eventService";
import { parseApiError } from "../../utils/apiError";
import { pickTicketDocuments, pickTicketGallery } from "../../utils/ticketFilePicker";
import { pickProfileImage } from "../../utils/profileImagePicker";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { CONNECTION_UI } from "../../utils/connectionTheme";
import { LIST_CARD_SHADOW } from "../../utils/listScreenStyles";
import { Images } from "../../utils/Images";
import { Colors } from "../../utils/colors";

type Props = {
  projectId?: string | number;
};

function fileLabel(item: ProjectFileItem) {
  return item.title || item.name || item.folder_name || "--";
}

function fileUrl(item: ProjectFileItem) {
  return getDropboxDirectLink(item.shared_link) || item.shared_link || "";
}

async function openSharedLink(url: string) {
  if (!url) return;
  const supported = await Linking.canOpenURL(url);
  if (supported) await Linking.openURL(url);
  else await Linking.openURL(url).catch(() => undefined);
}

export default function ProjectFilesSections({ projectId }: Props) {
  const { t } = useTranslation();
  const { setToast } = useContext(RegisterBackContext);

  const [files, setFiles] = useState<ProjectFilesData>({
    folders: [],
    documents: [],
    photos: [],
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [folderCount, setFolderCount] = useState("3");
  const [folderName, setFolderName] = useState("");
  const [uploadFolder, setUploadFolder] = useState("");
  const [folderSheet, setFolderSheet] = useState(false);
  const [sourceSheet, setSourceSheet] = useState(false);

  const folderNames = useMemo(() => collectProjectFolderNames(files), [files]);
  const photosByFolder = useMemo(() => {
    const groups: Record<string, ProjectFileItem[]> = {};
    folderNames.forEach((name) => {
      groups[name] = [];
    });
    files.photos.forEach((photo) => {
      const name = projectFolderName(photo) || t("Photos");
      if (!groups[name]) groups[name] = [];
      groups[name].push(photo);
    });
    return groups;
  }, [files.photos, folderNames, t]);

  const loadFiles = useCallback(async (silent = false) => {
    if (projectId == null || projectId === "") return;
    try {
      if (!silent) setLoading(true);
      setFiles(await fetchProjectFiles(projectId));
    } catch (error) {
      setToast({
        top: 45,
        text: parseApiError(error, t("Something went wrong")).message,
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, setToast, t]);

  useFocusEffect(
    useCallback(() => {
      void loadFiles();
    }, [loadFiles])
  );

  const showError = (error: unknown) => {
    setToast({
      top: 45,
      text: parseApiError(error, t("Something went wrong")).message,
      type: "error",
      visible: true,
    });
  };

  const uploadDocuments = async () => {
    if (projectId == null || projectId === "" || busy) return;
    const picked = await pickTicketDocuments();
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
    try {
      setBusy(true);
      await uploadProjectDocument(projectId, picked.assets);
      await loadFiles(true);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  const saveFolders = async () => {
    if (projectId == null || projectId === "" || busy) return;
    const count = Number(folderCount);
    const name = folderName.trim();
    if (!name || !Number.isInteger(count) || count < 1) {
      setToast({
        top: 45,
        text: t("This field is required"),
        type: "error",
        visible: true,
      });
      return;
    }
    try {
      setBusy(true);
      await createProjectPhotoFolders(projectId, count, name);
      setFolderName("");
      await loadFiles(true);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  const startPhotoUpload = () => {
    if (busy) return;
    if (!folderNames.length) return;
    setFolderSheet(true);
  };

  const uploadPhotos = async (source: "camera" | "gallery", folder: string) => {
    if (projectId == null || projectId === "" || !folder) return;
    let filesToSend: ProjectUploadFile[] = [];

    if (source === "camera") {
      const picked = await pickProfileImage("camera");
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
      filesToSend = [
        {
          uri: picked.asset.uri,
          type: picked.asset.type || "image/jpeg",
          name: picked.asset.name || `camera_${Date.now()}.jpg`,
        },
      ];
    } else {
      const picked = await pickTicketGallery();
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
      filesToSend = picked.assets;
    }

    try {
      setBusy(true);
      await uploadProjectPhoto(projectId, folder, filesToSend);
      await loadFiles(true);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  const folderOptions: SheetOption[] = folderNames.map((name) => ({
    id: name,
    label: name,
  }));

  return (
    <>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t("Documents")}</Text>
        <Pressable onPress={() => void uploadDocuments()} hitSlop={8} style={styles.addBtn} disabled={busy}>
          <FallBackImage source={Images.plusIcon} style={styles.addIcon} resizeMode="contain" />
        </Pressable>
      </View>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={AppColors.primary} />
        ) : files.documents.length ? (
          files.documents.map((item, index) => {
            const url = fileUrl(item);
            return (
              <Pressable
                key={`doc-${item.id ?? index}`}
                style={styles.docRow}
                onPress={() => void openSharedLink(url)}
                disabled={!url}
              >
                <Text style={styles.docName} numberOfLines={2}>
                  {fileLabel(item)}
                </Text>
                {url ? <Text style={styles.docLink}>{t("Open")}</Text> : null}
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.empty}>{t("No documents")}</Text>
        )}
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t("Photos")}</Text>
        {folderNames.length ? (
          <Pressable onPress={startPhotoUpload} hitSlop={8} style={styles.addBtn} disabled={busy}>
            <FallBackImage source={Images.plusIcon} style={styles.addIcon} resizeMode="contain" />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={AppColors.primary} />
        ) : !folderNames.length ? (
          <View style={styles.wizard}>
            <Text style={styles.label}>{t("How many folders")}</Text>
            <TextInput
              style={styles.input}
              value={folderCount}
              onChangeText={(text) => setFolderCount(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="3"
              placeholderTextColor={Colors.placeholder}
            />
            <Text style={styles.label}>{t("Folder name")}</Text>
            <TextInput
              style={styles.input}
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Koppeling"
              placeholderTextColor={Colors.placeholder}
            />
            <Pressable
              style={[styles.saveBtn, busy && styles.saveBtnDisabled]}
              onPress={() => void saveFolders()}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={AppColors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{t("Save")}</Text>
              )}
            </Pressable>
          </View>
        ) : (
          Object.entries(photosByFolder).map(([name, photos]) => (
            <View key={name} style={styles.folderBlock}>
              <Text style={styles.folderTitle}>{name}</Text>
              {photos.length ? (
                <View style={styles.photoGrid}>
                  {photos.map((photo, index) => {
                    const url = fileUrl(photo);
                    return (
                      <Pressable
                        key={`photo-${photo.id ?? index}`}
                        style={styles.photoCell}
                        onPress={() => void openSharedLink(url)}
                      >
                        {url ? (
                          <Image source={{ uri: url }} style={styles.photo} />
                        ) : (
                          <View style={styles.photoFallback}>
                            <Text style={styles.empty} numberOfLines={2}>
                              {fileLabel(photo)}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.empty}>--</Text>
              )}
            </View>
          ))
        )}
      </View>

      <SelectionBottomSheet
        visible={folderSheet}
        title={t("Select folder")}
        searchPlaceholder={t("Search")}
        confirmText={t("Done")}
        options={folderOptions}
        selectedIds={uploadFolder ? [uploadFolder] : []}
        onClose={() => setFolderSheet(false)}
        onConfirm={(selected) => {
          const name = selected[0] ? String(selected[0].id) : "";
          setFolderSheet(false);
          if (!name) return;
          setUploadFolder(name);
          setSourceSheet(true);
        }}
      />
      <OptionBottomSheet
        visible={sourceSheet}
        title={t("Choose Camera or Gallery")}
        options={[
          { id: "camera", label: t("Camera") },
          { id: "gallery", label: t("Gallery") },
        ]}
        onClose={() => setSourceSheet(false)}
        onConfirm={(option) => {
          setSourceSheet(false);
          if (option.id === "camera" || option.id === "gallery") {
            void uploadPhotos(option.id, uploadFolder);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    width: 14,
    height: 14,
    tintColor: AppColors.white,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: CONNECTION_UI.cardRadius,
    borderWidth: 1,
    borderColor: CONNECTION_UI.cardBorder,
    padding: CONNECTION_UI.cardPadding,
    marginBottom: CONNECTION_UI.cardGap,
    ...LIST_CARD_SHADOW,
  },
  empty: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.subtitle,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  docName: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  docLink: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: AppColors.primary,
  },
  wizard: {
    gap: 10,
  },
  label: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
    backgroundColor: AppColors.white,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: {
    opacity: 0.85,
  },
  saveBtnText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
  },
  folderBlock: {
    marginBottom: 14,
    gap: 8,
  },
  folderTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoCell: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: CONNECTION_UI.surface,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
});
