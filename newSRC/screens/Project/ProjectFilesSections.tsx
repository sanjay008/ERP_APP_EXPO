import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import FallBackImage from "../../Components/FallBackImage";
import OptionBottomSheet from "../../Components/OptionBottomSheet";
import SimpleBox from "../../Components/SimpleBox";
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
import { useKeyboardHeight, useScreenInsets } from "../../utils/screenInsets";
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

type BusyKey = "document" | "folder" | `photo:${string}` | null;

export function projectFileUrl(item: ProjectFileItem) {
  const raw =
    item.shared_link ||
    item.view_url ||
    item.file_path ||
    "";
  return getDropboxDirectLink(raw) || raw;
}

export function projectFileLabel(item: ProjectFileItem, fallback = "Document") {
  const raw = String(item.title || item.name || "").trim();
  if (raw && !/^https?:\/\//i.test(raw) && !raw.includes("/")) return raw;
  const fromUrl = String(item.shared_link || raw)
    .split("?")[0]
    .split("/")
    .pop();
  if (fromUrl) {
    try {
      return decodeURIComponent(fromUrl);
    } catch {
      return fromUrl;
    }
  }
  return fallback;
}

export function projectFileShortLabel(item: ProjectFileItem, max = 10) {
  const label = projectFileLabel(item, "").trim();
  if (!label) return "";
  if (label.length <= max) return label;
  return `${label.slice(0, max)}…`;
}

function fileExtension(item: ProjectFileItem) {
  const source = `${item.file_extension || ""} ${item.title || ""} ${item.name || ""} ${item.shared_link || ""} ${item.view_url || ""} ${item.file_path || ""}`.toLowerCase();
  return source.match(/\.([a-z0-9]+)(?:\?|$|&|\/)/)?.[1] || String(item.file_extension || "").replace(/^\./, "").toLowerCase();
}

const DOC_EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip", "rar"];

export function projectFileThumb(item: ProjectFileItem) {
  const ext = fileExtension(item);
  const url = projectFileUrl(item);
  const type = String(item.file_type || "").toLowerCase();
  if (type === "pdf" || ext === "pdf") return { kind: "pdf" as const, uri: url };
  if (DOC_EXTS.includes(ext) && type !== "image") return { kind: "doc" as const, uri: url };
  if (url) return { kind: "image" as const, uri: url };
  return { kind: "doc" as const, uri: "" };
}

async function openSharedLink(url: string) {
  if (!url) return;
  const supported = await Linking.canOpenURL(url);
  if (supported) await Linking.openURL(url);
  else await Linking.openURL(url).catch(() => undefined);
}

function OverlayLoader({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <ActivityIndicator color={AppColors.primary} />
    </View>
  );
}

function AddButton({
  onPress,
  loading,
  disabled,
}: {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[styles.addBtn, (disabled || loading) && styles.addBtnDisabled]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={AppColors.white} size="small" />
      ) : (
        <FallBackImage source={Images.plusIcon} style={styles.addIcon} resizeMode="contain" />
      )}
    </Pressable>
  );
}

export default function ProjectFilesSections({ projectId }: Props) {
  const { t } = useTranslation();
  const { setToast } = useContext(RegisterBackContext);
  const { footerPadding } = useScreenInsets();
  const keyboardHeight = useKeyboardHeight();
  const loadedOnce = useRef(false);

  const [files, setFiles] = useState<ProjectFilesData>({
    folders: [],
    documents: [],
    photos: [],
  });
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<BusyKey>(null);
  const [folderCount, setFolderCount] = useState("1");
  const [folderName, setFolderName] = useState("");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("");
  const [sourceSheet, setSourceSheet] = useState(false);

  const busy = Boolean(busyKey);
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
      loadedOnce.current = true;
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
      void loadFiles(loadedOnce.current);
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
      setBusyKey("document");
      await uploadProjectDocument(projectId, picked.assets);
      await loadFiles(true);
    } catch (error) {
      showError(error);
    } finally {
      setBusyKey(null);
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
      setBusyKey("folder");
      await createProjectPhotoFolders(projectId, count, name);
      setFolderName("");
      setFolderCount("1");
      setCreateFolderOpen(false);
      await loadFiles(true);
    } catch (error) {
      showError(error);
    } finally {
      setBusyKey(null);
    }
  };

  const startPhotoUpload = (folder: string) => {
    if (busy || !folder) return;
    setUploadFolder(folder);
    setSourceSheet(true);
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
      setBusyKey(`photo:${folder}`);
      await uploadProjectPhoto(projectId, folder, filesToSend);
      await loadFiles(true);
    } catch (error) {
      showError(error);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t("Documents")}</Text>
        <AddButton
          onPress={() => void uploadDocuments()}
          loading={busyKey === "document"}
          disabled={busy && busyKey !== "document"}
        />
      </View>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={AppColors.primary} />
        ) : files.documents.length ? (
          <View style={styles.docGrid}>
            {files.documents.map((item, index) => {
              const url = projectFileUrl(item);
              const thumb = projectFileThumb(item);
              const shortName = projectFileShortLabel(item, 10);
              return (
                <Pressable
                  key={`doc-${item.id ?? index}`}
                  style={styles.docCell}
                  onPress={() => void openSharedLink(url)}
                  disabled={!url}
                >
                  <View style={styles.docThumb}>
                    <FallBackImage
                      source={
                        thumb.kind === "image" && thumb.uri
                          ? { uri: thumb.uri }
                          : thumb.kind === "pdf"
                            ? Images.PdfLogo
                            : Images.documentlogo
                      }
                      fallbackImage={thumb.kind === "pdf" ? Images.PdfLogo : Images.documentlogo}
                      style={thumb.kind === "image" ? styles.docThumbImage : styles.docThumbIcon}
                      resizeMode={thumb.kind === "image" ? "cover" : "contain"}
                    />
                  </View>
                  {shortName ? (
                    <Text style={styles.docName} numberOfLines={1}>
                      {shortName}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.empty}>{t("No documents")}</Text>
        )}
        <OverlayLoader visible={busyKey === "document"} />
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t("Photos")}</Text>
        <AddButton
          onPress={() => {
            if (!busy) setCreateFolderOpen(true);
          }}
          loading={busyKey === "folder"}
          disabled={busy && busyKey !== "folder"}
        />
      </View>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={AppColors.primary} />
        ) : folderNames.length ? (
          Object.entries(photosByFolder).map(([name, photos], index) => (
            <View key={name} style={[styles.folderCard, index === 0 && styles.folderCardFirst]}>
              <View style={styles.folderHead}>
                <View style={styles.folderIconWrap}>
                  <Ionicons name="folder" size={16} color={AppColors.primary} />
                </View>
                <Text style={styles.folderTitle} numberOfLines={1}>
                  {name}
                </Text>
                <AddButton
                  onPress={() => startPhotoUpload(name)}
                  loading={busyKey === `photo:${name}`}
                  disabled={busy && busyKey !== `photo:${name}`}
                />
              </View>
              {photos.length ? (
                <View style={styles.photoGrid}>
                  {photos.map((photo, photoIndex) => {
                    const url = projectFileUrl(photo);
                    return (
                      <Pressable
                        key={`photo-${photo.id ?? photoIndex}`}
                        style={styles.photoCell}
                        onPress={() => void openSharedLink(url)}
                      >
                        {url ? (
                          <Image source={{ uri: url }} style={styles.photo} />
                        ) : (
                          <View style={styles.photoFallback}>
                            <Ionicons name="image-outline" size={18} color={AppColors.subtitle} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.empty}>{t("No photos")}</Text>
              )}
              <OverlayLoader visible={busyKey === `photo:${name}`} />
            </View>
          ))
        ) : (
          <Text style={styles.empty}>{t("No photos")}</Text>
        )}
      </View>

      <Modal
        visible={createFolderOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => {
          if (busyKey === "folder") return;
          setCreateFolderOpen(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (busyKey === "folder") return;
              setCreateFolderOpen(false);
            }}
          />
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: footerPadding + (Platform.OS === "android" ? keyboardHeight : 0) },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("Create folder")}</Text>
              <SimpleBox
                Icon={Images.CloseIcon}
                onPress={() => {
                  if (busyKey === "folder") return;
                  setCreateFolderOpen(false);
                }}
                style={styles.closeBtn}
                IconStyle={{ width: 14, height: 14, tintColor: Colors.white }}
              />
            </View>
            <Text style={styles.label}>{t("How many folders")}</Text>
            <TextInput
              style={styles.input}
              value={folderCount}
              onChangeText={(text) => setFolderCount(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={Colors.placeholder}
              editable={busyKey !== "folder"}
            />
            <Text style={styles.label}>{t("Folder name")}</Text>
            <TextInput
              style={styles.input}
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Koppeling"
              placeholderTextColor={Colors.placeholder}
              editable={busyKey !== "folder"}
            />
            <Pressable
              style={[styles.saveBtn, busyKey === "folder" && styles.saveBtnDisabled]}
              onPress={() => void saveFolders()}
              disabled={busyKey === "folder"}
            >
              {busyKey === "folder" ? (
                <ActivityIndicator color={AppColors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{t("Create folder")}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: {
    opacity: 0.7,
  },
  addIcon: {
    width: 14,
    height: 14,
    tintColor: AppColors.white,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: CONNECTION_UI.cardBorder,
    padding: 14,
    marginBottom: CONNECTION_UI.cardGap,
    overflow: "hidden",
    ...LIST_CARD_SHADOW,
  },
  empty: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.subtitle,
  },
  docGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  docCell: {
    width: 72,
    alignItems: "center",
    gap: 6,
  },
  docThumb: {
    width: 72,
    height: 72,
    borderRadius: 4,
    backgroundColor: "#F4F7FA",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  docThumbImage: {
    width: "100%",
    height: "100%",
  },
  docThumbIcon: {
    width: 28,
    height: 28,
  },
  docName: {
    width: "100%",
    textAlign: "center",
    fontFamily: FONTS.LexendMedium,
    fontSize: 11,
    color: AppColors.black,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.dicline,
    borderColor: Colors.dicline,
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
    borderRadius: 7,
    paddingHorizontal: 14,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
    backgroundColor: AppColors.white,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 7,
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
  folderCardFirst: {
    marginTop: 0,
  },
  folderCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#EEF1F5",
    borderRadius: 7,
    padding: 12,
    backgroundColor: "#FBFCFD",
    overflow: "hidden",
  },
  folderHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  folderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  folderTitle: {
    flex: 1,
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
    borderRadius: 4,
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
