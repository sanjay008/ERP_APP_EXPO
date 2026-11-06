import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import FallBackImage from "../../Components/FallBackImage";
import HtmlContent from "../../Components/HtmlContent";
import SimpleBox from "../../Components/SimpleBox";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useAppData } from "../../context/AppDataContext";
import {
  collectProjectFolderNames,
  createProjectPhotoFolders,
  fetchProjectFiles,
  projectFolderName,
  uploadProjectDocument,
  type ProjectFileItem,
  type ProjectFilesData,
} from "../../services/projectService";
import { getDropboxDirectLink } from "../../services/eventService";
import { parseApiError } from "../../utils/apiError";
import { ignoreHardwareBack } from "../../utils/modalBack";
import { useKeyboardLiftStyle } from "../../utils/keyboardShift";
import { hasPermission } from "../../utils/permissionFlags";
import { useScreenInsets } from "../../utils/screenInsets";
import { pickTicketDocuments } from "../../utils/ticketFilePicker";
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
  const title = String(item.title || "").trim();
  if (title) return title;
  const raw = String(item.name || "").trim();
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

export function projectFileComment(item: ProjectFileItem) {
  return String(item.comment || "").trim();
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
  const router = useRouter();
  const { permissions } = useAppData();
  const { setToast } = useContext(RegisterBackContext);
  const { footerPadding } = useScreenInsets();
  const loadedOnce = useRef(false);

  const canReadDocuments = hasPermission(permissions, "project_documents_mobile", "read");
  const canCreateDocuments = hasPermission(permissions, "project_documents_mobile", "create");
  const canReadPhotos = hasPermission(permissions, "project_photos_mobile", "read");
  const canCreatePhotos = hasPermission(permissions, "project_photos_mobile", "create");

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
  const sheetLift = useKeyboardLiftStyle(createFolderOpen);

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

  return (
    <>
      {canReadDocuments ? (
        <>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t("Documents")}</Text>
        {canCreateDocuments ? (
          <AddButton
            onPress={() => void uploadDocuments()}
            loading={busyKey === "document"}
            disabled={busy && busyKey !== "document"}
          />
        ) : null}
      </View>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={AppColors.primary} />
        ) : files.documents.length ? (
          <View style={styles.docGrid}>
            {files.documents.map((item, index) => {
              const url = projectFileUrl(item);
              const thumb = projectFileThumb(item);
              const title = projectFileShortLabel(item, 10);
              const comment = projectFileComment(item);
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
                  {title ? (
                    <Text style={styles.docName} numberOfLines={1}>
                      {title}
                    </Text>
                  ) : null}
                  {comment ? <HtmlContent html={comment} variant="note" /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.empty}>{t("No documents")}</Text>
        )}
        <OverlayLoader visible={busyKey === "document"} />
      </View>
        </>
      ) : null}

      {canReadPhotos ? (
        <>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t("Photos")}</Text>
        {canCreatePhotos ? (
          <AddButton
            onPress={() => {
              if (!busy) setCreateFolderOpen(true);
            }}
            loading={busyKey === "folder"}
            disabled={busy && busyKey !== "folder"}
          />
        ) : null}
      </View>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={AppColors.primary} />
        ) : folderNames.length ? (
          folderNames.map((name) => {
            const count = photosByFolder[name]?.length ?? 0;
            return (
              <Pressable
                key={name}
                style={styles.folderRow}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/projects/photos",
                    params: {
                      projectId: String(projectId ?? ""),
                      folder: name,
                    },
                  })
                }
              >
                <View style={styles.folderIconWrap}>
                  <Ionicons name="folder" size={16} color={AppColors.primary} />
                </View>
                <Text style={styles.folderTitle} numberOfLines={1}>
                  {name}
                </Text>
                {count > 0 ? <Text style={styles.folderCount}>{count}</Text> : null}
                <Ionicons name="chevron-forward" size={18} color={AppColors.subtitle} />
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.empty}>{t("No photos")}</Text>
        )}
      </View>
        </>
      ) : null}

      <Modal
        visible={createFolderOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={ignoreHardwareBack}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalBackdrop} />
          <Animated.View
            style={[styles.modalSheet, { paddingBottom: footerPadding }, sheetLift]}
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
          </Animated.View>
        </View>
      </Modal>

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
  fileComment: {
    width: "100%",
    textAlign: "center",
    fontFamily: FONTS.LexendRegular,
    fontSize: 10,
    lineHeight: 13,
    color: AppColors.subtitle,
  },
  commentInput: {
    height: 88,
    paddingTop: 12,
    paddingBottom: 12,
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
  modalTitleWrap: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.subtitle,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.dicline,
    borderColor: Colors.dicline,
  },
  photoSheetBody: {
    gap: 12,
    paddingBottom: 4,
  },
  folderSelectBlock: {
    gap: 8,
  },
  folderSelect: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 7,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: AppColors.white,
  },
  folderSelectIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  folderSelectText: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  folderSelectPlaceholder: {
    color: Colors.placeholder,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pendingThumb: {
    width: 52,
    height: 52,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: CONNECTION_UI.surface,
  },
  pendingImage: {
    width: "100%",
    height: "100%",
  },
  pendingMore: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF1F5",
  },
  pendingMoreText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 12,
    color: AppColors.black,
  },
  actionList: {
    gap: 10,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#EEF1F5",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FBFCFD",
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconPrimary: {
    backgroundColor: AppColors.primary,
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  actionHint: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
  },
  detailsWrap: {
    gap: 10,
  },
  optionalNote: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    marginBottom: 2,
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
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
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
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  folderCount: {
    minWidth: 24,
    textAlign: "center",
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: AppColors.primary,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoCell: {
    width: 72,
    alignItems: "center",
    gap: 6,
  },
  photoThumb: {
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
