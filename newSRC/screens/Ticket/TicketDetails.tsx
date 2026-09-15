import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { useScreenInsets } from "../../utils/screenInsets";
import axios from "axios";
import Svg, { Line } from "react-native-svg";
import WebView from "react-native-webview";
import { t } from "i18next";
import BoxIcon from "../../Components/BoxIcon";
import ApiFeedback from "../../Components/ApiFeedback";
import OptionBottomSheet, { OptionItem } from "../../Components/OptionBottomSheet";
import InputBottomSheet from "../../Components/InputBottomSheet";
import ConfirmBottomSheet from "../../Components/ConfirmBottomSheet";
import HtmlContent from "../../Components/HtmlContent";
import FallBackImage from "../../Components/FallBackImage";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { getData, removeHtmlTags } from "../../utils/storeData";
import { Keys } from "../../utils/Keys";
import apiClient, { BASE_URL } from "../../utils/client";
import { apiConstants } from "../../utils/apiConstants";
import { compressImages } from "../../utils/imageCompressor";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  pickTicketCamera,
  pickTicketDocuments,
  pickTicketGallery,
} from "../../utils/ticketFilePicker";


const SCREEN_WIDTH = Dimensions.get("window").width;
const DOC_ITEM_WIDTH = SCREEN_WIDTH / 3 - 22;
const DESCRIPTION_HTML_WIDTH = SCREEN_WIDTH - 60;
const NOTE_HTML_WIDTH = SCREEN_WIDTH - 100;
const DEFAULT_STATUS_COLOR = "#FF9142";

const FILE_OPTIONS: OptionItem[] = [
  { id: "camera", label: "Camera" },
  { id: "gallery", label: "Gallery" },
  { id: "files", label: "Files (PDF/DOC)" },
];

const formatNoteHtml = (html = "") => {
  if (!html.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(html)) return html;
  return `<p>${html}</p>`;
};

const isInprogressStatus = (statusName?: string) =>
  String(statusName || "").toLowerCase().replace(/\s/g, "") === "inprogress";

const translateDayToDutch = (log = "") => {
  const dayMap: Record<string, string> = {
    Monday: "Maandag",
    Tuesday: "Dinsdag",
    Wednesday: "Woensdag",
    Thursday: "Donderdag",
    Friday: "Vrijdag",
    Saturday: "Zaterdag",
    Sunday: "Zondag",
  };
  let translatedLog = log;
  Object.keys(dayMap).forEach((day) => {
    if (log.includes(day)) {
      translatedLog = log.replace(day, dayMap[day]);
    }
  });
  return translatedLog;
};

const getDirectDropboxLink = (sharedLink?: string) => {
  if (!sharedLink) return "";
  try {
    if (sharedLink.includes("dropboxusercontent.com")) return sharedLink;
    if (sharedLink.includes("db.tt")) {
      return sharedLink.replace("db.tt", "dl.dropboxusercontent.com");
    }
    if (sharedLink.includes("dropbox.com")) {
      let cleaned = sharedLink
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace("dropbox.com", "dl.dropboxusercontent.com")
        .replace(/[?&](dl|raw)=[^&]*/g, "");
      cleaned += cleaned.includes("?") ? "&raw=1" : "?raw=1";
      return cleaned;
    }
    return sharedLink;
  } catch {
    return "";
  }
};

const hexToRgba = (hex: string, alpha: number) => {
  let normalized = hex.trim().replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (normalized.length !== 6) {
    normalized = DEFAULT_STATUS_COLOR.replace("#", "");
  }
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DashedDivider = React.memo(() => (
  <Svg height={1} width="100%">
    <Line
      x1="0"
      y1="0.5"
      x2="100%"
      y2="0.5"
      stroke="#E2E2E2"
      strokeWidth={1}
      strokeDasharray="4,4"
    />
  </Svg>
));

type DetailRowProps = {
  label: string;
  value?: string;
  html?: string;
};

const DetailRow = React.memo(({ label, value, html }: DetailRowProps) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    {html ? (
      <HtmlContent
        html={html}
        variant="description"
        contentWidth={DESCRIPTION_HTML_WIDTH}
      />
    ) : (
      <Text style={styles.detailValue} numberOfLines={3}>
        {value || "-"}
      </Text>
    )}
    <DashedDivider />
  </View>
));

type TicketDocument = {
  id: string | number;
  file_extension?: string;
  shared_link?: string;
};

type StatusItem = {
  id: string | number;
  status_name: string;
  color?: string;
};

type NoteItem = {
  id: string | number;
  comment?: string;
  note?: string;
  created_at?: string;
  ticket_status?: number;
  user?: { username?: string; profile_image?: string };
};

type FileItem = {
  uri: string;
  name: string;
  type: string;
};

function parseTicketParam(raw?: string) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function TicketDetails() {
  const params = useLocalSearchParams<{
    id?: string;
    item?: string;
    fromNotification?: string;
    notificationKey?: string;
  }>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const incomingItem = useMemo(() => parseTicketParam(params.item), [params.item]);
  const notificationKey = params.notificationKey;
  const { top, footerPadding } = useScreenInsets();
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const normalizedItem = useMemo(() => {
    const resolvedId = params.id ?? incomingItem?.id ?? incomingItem?.ticket_id;
    const resolvedProjectId = incomingItem?.project_id ?? incomingItem?.project_data?.id;
    const resolvedStatusId =
      incomingItem?.status_id ??
      incomingItem?.status ??
      incomingItem?.ticket_status_data?.id ??
      incomingItem?.ticketstatus?.id;

    const statusData =
      incomingItem?.ticket_status_data ||
      incomingItem?.ticketstatus ||
      (resolvedStatusId
        ? {
          id: resolvedStatusId,
          status_name: incomingItem.status_name || incomingItem.status_to || "",
          color: incomingItem.status_color || incomingItem.color_code,
        }
        : null);

    return {
      ...incomingItem,
      id: resolvedId,
      ticket_id: incomingItem?.ticket_id ?? resolvedId,
      project_id: resolvedProjectId,
      status_id: resolvedStatusId,
      status: incomingItem?.status ?? resolvedStatusId,
      ticket_status_data: statusData,
      ticket_title: incomingItem?.ticket_title || incomingItem?.title || "",
      type: incomingItem?.type ?? "0",
      ticket_documents: incomingItem?.ticket_documents || [],
    };
  }, [incomingItem, params.id]);

  const [mainItem, setMainItem] = useState(normalizedItem);
  const [loading, setLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [noteData, setNoteData] = useState<NoteItem[]>([]);
  const [newDocuments, setNewDocuments] = useState<FileItem[]>([]);

  const [fileSheetVisible, setFileSheetVisible] = useState(false);
  const [noteSheetVisible, setNoteSheetVisible] = useState(false);
  const [noteEditorKey, setNoteEditorKey] = useState(0);
  const [statusChangingId, setStatusChangingId] = useState<string | number | null>(null);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);

  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentMode, setCommentMode] = useState<"comment" | "status">("comment");
  const [pendingStatus, setPendingStatus] = useState<StatusItem | null>(null);

  const [selectedDoc, setSelectedDoc] = useState<{ uri: string; isImage: boolean } | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<TicketDocument | null>(null);

  const [statusData, setStatusData] = useState<StatusItem[]>([]);
  const isUploadingRef = useRef(false);
  const { permissions, fetchPermissions } = useAppData();

  const isFromNotification = useMemo(
    () =>
      params.fromNotification === "true" ||
      incomingItem?.fromNotification === "true" ||
      incomingItem?.fromNotification === true,
    [params.fromNotification, incomingItem?.fromNotification]
  );

  const ticketId =
    params.id ??
    normalizedItem?.id ??
    normalizedItem?.ticket_id ??
    mainItem?.id ??
    mainItem?.ticket_id;

  const statusColor =
    mainItem?.ticket_status_data?.color || mainItem?.color_code || DEFAULT_STATUS_COLOR;

  useEffect(() => {
    setMainItem(normalizedItem);
  }, [ticketId, notificationKey]);

  useEffect(() => {
    fetchPermissions().catch((error) => {
        console.log("Error fetching permission:", error);
    });
  }, [fetchPermissions]);


  const fetchTicketData = useCallback(async () => {
    if (!ticketId) return;

    try {
      clearApiError();
      const response = await apiClient.post(apiConstants.get_tickets);
      if (response?.data?.status) {
        const current = response?.data?.data?.find(
          (el: any) => String(el?.id ?? el?.ticket_id) === String(ticketId)
        );
        if (current) {
          setMainItem(current);
        }
      }
    } catch (error) {
      captureApiError(error);
    }
  }, [ticketId, clearApiError, captureApiError]);

  const fetchNotes = useCallback(async () => {
    if (!ticketId) return;

    try {
      const response = await apiClient.post(apiConstants.get_ticketnotes, {
        ticket_id: ticketId,
      });
      if (response?.data?.status) {
        setNoteData(response.data.data || []);
      }
    } catch (error) {
      console.log("Error fetching notes:", error);
    }
  }, [ticketId]);

  const fetchStatusList = useCallback(async () => {
    try {
      const response = await apiClient.post(apiConstants.getstatus, {
        slug: "ticket",
      });
      if (response?.data?.status) {
        setStatusData(response.data.data || []);
      }
    } catch (error) {
      console.log("Error fetching status:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!ticketId) return;

      let isActive = true;
      setLoading(true);
      Promise.all([
        fetchTicketData(),
        fetchNotes(),
        fetchStatusList(),
      ])
        .catch((error) => {
          captureApiError(error);
        })
        .finally(() => {
          if (isActive) setLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, [ticketId, fetchTicketData, fetchNotes, fetchStatusList])
  );

  const changeStatus = useCallback(
    async (statusId: string | number, refreshAfter = true) => {
      if (!ticketId) return;
      if (String(mainItem?.ticket_status_data?.id) === "154") return;

      setStatusChangingId(statusId);
      try {
        const response = await apiClient.post(apiConstants.ticket_update, {
          ticket_id: String(ticketId),
          status: String(statusId),
          created_at: new Date().toISOString(),
        });
        if (response?.data?.status && refreshAfter) {
          await Promise.all([fetchTicketData(), fetchNotes()]);
        }
      } catch (error) {
        console.log("Error updating status:", error);
      } finally {
        setStatusChangingId(null);
      }
    },
    [ticketId, mainItem?.ticket_status_data?.id, fetchTicketData, fetchNotes]
  );

  const uploadDocuments = useCallback(async () => {
    if (!ticketId || isUploadingRef.current || newDocuments.length === 0) return;

    isUploadingRef.current = true;
    setDocumentLoading(true);
    try {
      const userData = await getData(Keys.USERDATA);
      if (!userData?.data?.user || !userData?.data?.relaties) {
        throw new Error("Invalid user data");
      }

      const formData = new FormData();
      formData.append("relaties_id", userData.data.relaties.id);
      formData.append("user_id", userData.data.user.id);
      formData.append("role", userData.data.user.role);
      formData.append("ticket_id", ticketId);
      formData.append("token", userData.data.user.verify_token);

      newDocuments.forEach((docItem, index) => {
        const uri = docItem.uri;
        if (!uri) return;

        const name =
          docItem.name ||
          `upload_${Date.now()}_${index}.${uri.includes(".") ? uri.split(".").pop() : "jpg"}`;
        const type =
          docItem.type ||
          (name.endsWith(".pdf")
            ? "application/pdf"
            : name.endsWith(".doc") || name.endsWith(".docx")
              ? "application/msword"
              : name.endsWith(".png")
                ? "image/png"
                : "image/jpeg");

        formData.append("doc[]", { uri, name, type } as any);
      });

      const response = await axios.post(apiConstants.ticket_update, formData, {
        headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
      });

      if (response.data.status) {
        setNewDocuments([]);
        await fetchTicketData();
      }
    } catch (error) {
      console.log("Error uploading documents:", error);
    } finally {
      isUploadingRef.current = false;
      setDocumentLoading(false);
    }
  }, [ticketId, newDocuments, fetchTicketData]);

  useEffect(() => {
    if (newDocuments.length > 0 && isFocused) {
      uploadDocuments();
    }
  }, [newDocuments, isFocused, uploadDocuments]);

  const addComment = useCallback(
    async (statusId?: string | number) => {
      if (!ticketId) return;

      setNoteLoading(true);
      try {
        const response = await apiClient.post(apiConstants.add_ticketnote, {
          ticket_id: String(ticketId),
          note: formatNoteHtml(comment),
          comment_type: "Ticket_note",
          ...(statusId != null ? { ticket_status: String(statusId) } : {}),
        });

        if (response?.data?.status) {
          setNoteSheetVisible(false);
          setComment("");
          setCommentError("");
          setPendingStatus(null);
          if (statusId) {
            await changeStatus(statusId, false);
            await Promise.all([fetchTicketData(), fetchNotes()]);
          } else {
            await fetchNotes();
          }
        }
      } catch (error) {
        console.log("Error adding note:", error);
      } finally {
        setNoteLoading(false);
      }
    },
    [ticketId, comment, fetchNotes, fetchTicketData, changeStatus]
  );

  const handleDeleteFile = useCallback(async () => {
    if (!selectedFile || !ticketId) return;

    setDeleteLoading(true);
    try {
      const response = await apiClient.post(apiConstants.deleteTicketDocument, {
        ticket_id: ticketId,
        id: selectedFile.id,
      });

      if (response?.data?.status) {
        setDeleteSheetVisible(false);
        setSelectedFile(null);
        await fetchTicketData();
      }
    } catch (error) {
      console.log("Error deleting file:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedFile, ticketId, fetchTicketData]);

  const handleBack = useCallback(() => {
    if (isFromNotification || !router.canGoBack()) {
      router.replace("/(app)/(tabs)/menu");
      return;
    }
    router.back();
  }, [router, isFromNotification]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selectedDoc) {
        setSelectedDoc(null);
        return true;
      }
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack, selectedDoc]);

  const appendPickedFiles = useCallback(async (assets: { uri: string; name: string; type: string }[]) => {
    const compressed = await compressImages(assets);
    setNewDocuments((prev) => [...prev, ...compressed]);
  }, []);

  const openCamera = useCallback(async () => {
    const result = await pickTicketCamera();
    if (result.ok) await appendPickedFiles(result.assets);
  }, [appendPickedFiles]);

  const openGallery = useCallback(async () => {
    const result = await pickTicketGallery();
    if (result.ok) await appendPickedFiles(result.assets);
  }, [appendPickedFiles]);

  const openDocument = useCallback(async () => {
    const result = await pickTicketDocuments();
    if (result.ok) await appendPickedFiles(result.assets);
  }, [appendPickedFiles]);

  const handleFileOptionConfirm = useCallback(
    (option: OptionItem) => {
      if (option.id === "camera") openCamera();
      else if (option.id === "gallery") openGallery();
      else if (option.id === "files") openDocument();
    },
    [openCamera, openDocument, openGallery]
  );

  const onEdit = useCallback(() => {
    router.push({
      pathname: "/(app)/tickets/create",
      params: {
        mode: "edit",
        item: JSON.stringify(mainItem),
      },
    });
  }, [mainItem, router]);

  const onStatusPress = useCallback(
    (statusItem: StatusItem) => {
      if (isInprogressStatus(statusItem.status_name)) {
        changeStatus(statusItem.id);
        return;
      }
      setCommentMode("status");
      setPendingStatus(statusItem);
      setComment("");
      setCommentError("");
      setNoteEditorKey((prev) => prev + 1);
      setNoteSheetVisible(true);
    },
    [changeStatus]
  );

  const openNoteSheet = useCallback(() => {
    setCommentMode("comment");
    setPendingStatus(null);
    setComment("");
    setCommentError("");
    setNoteEditorKey((prev) => prev + 1);
    setNoteSheetVisible(true);
  }, []);

  const onNoteSave = useCallback(() => {
    if (!removeHtmlTags(comment)) {
      setCommentError(t("Please Enter Note"));
      return;
    }
    if (commentMode === "comment") {
      addComment();
      return;
    }
    if (pendingStatus) {
      addComment(pendingStatus.id);
    }
  }, [comment, commentMode, pendingStatus, addComment, t]);

  const canUpdate = useMemo(
    () => String(permissions?.project_tickets_view?.update) === "1",
    [permissions]
  );

  const isClosed = String(mainItem?.ticket_status_data?.id) === "154";

  const filteredStatusData = useMemo(
    () =>
      statusData.filter((statusItem) => {
        if (String(mainItem?.ticket_status_data?.id) === "154") {
          return (
            String(statusItem.id) !== "153" &&
            String(statusItem.id) !== "152" &&
            statusItem.status_name !== "New"
          );
        }
        return statusItem.status_name !== "New";
      }),
    [statusData, mainItem?.ticket_status_data?.id]
  );

  const documents = (mainItem?.ticket_documents || []) as TicketDocument[];

  const documentRows = useMemo(() => {
    const rows: TicketDocument[][] = [];
    for (let index = 0; index < documents.length; index += 3) {
      rows.push(documents.slice(index, index + 3));
    }
    return rows;
  }, [documents]);
  const projectName =
    mainItem?.project_data?.project_name || mainItem?.project_name || "-";
  const typeName = mainItem?.type || "-";
  const actionByName = mainItem?.action_relatie_data?.display_name || "-";
  const dateText = mainItem?.inprogress_log
    ? translateDayToDutch(mainItem.inprogress_log)
    : "-";
  const descriptionHtml = mainItem?.ticket_description || "";

  const closeDateText = mainItem?.close_date || "";

  const orderCreatedText = mainItem?.created_by_text || "";

  const renderDocItem = useCallback(
    ({ item: docItem }: { item: TicketDocument }) => {
      const ext = (docItem?.file_extension || "").toLowerCase();
      const isPdf = ext.includes("pdf");
      const isImage = /(jpe?g|png|webp|gif|heic|heif)/.test(ext);
      const directLink = getDirectDropboxLink(docItem?.shared_link);

      return (
        <Pressable
          style={styles.docItem}
          onPress={() => setSelectedDoc({ uri: directLink, isImage })}
        >
          <Image
            defaultSource={Images.DefaultImage}
            source={isPdf ? Images.PdfLogo : { uri: directLink }}
            style={styles.docImage}
            resizeMode="cover"
          />
          {canUpdate ? (
            <Pressable
              onPress={() => {
                setSelectedFile(docItem);
                setDeleteSheetVisible(true);
              }}
              style={styles.docDeleteBtn}
            >
              <Image source={Images.CloseIcon} style={styles.docDeleteIcon} />
            </Pressable>
          ) : null}
        </Pressable>
      );
    },
    [canUpdate]
  );

  const renderNoteItem = useCallback(({ item }: { item: NoteItem }) => {
    const bgColor =
      item?.ticket_status === 153
        ? "#FFF3E0"
        : item?.ticket_status === 154
          ? "#E8F5E9"
          : Colors.SquareBtnBG;
    const noteHtml = item?.comment || item?.note || "";

    return (
      <View style={[styles.noteCard, { backgroundColor: bgColor }]}>
        <FallBackImage
          source={{ uri: item?.user?.profile_image }}
          style={styles.noteAvatar}
        />
        <View style={styles.noteContent}>
          <Text style={styles.noteUser}>{item?.user?.username || ""}</Text>
          <Text style={styles.noteDate}>{item.created_at}</Text>
          <HtmlContent
            html={noteHtml}
            variant="note"
            contentWidth={NOTE_HTML_WIDTH}
            containerStyle={styles.noteHtml}
          />
        </View>
      </View>
    );
  }, []);

  if (selectedDoc) {
    return (
      <View style={[styles.previewContainer, { paddingTop: top }]}>
        <Pressable style={styles.previewClose} onPress={() => setSelectedDoc(null)}>
          <Image source={Images.CloseIcon} style={styles.previewCloseIcon} />
        </Pressable>
        {selectedDoc.isImage ? (
          <Image
            source={{ uri: selectedDoc.uri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        ) : (
          <WebView source={{ uri: selectedDoc.uri }} style={styles.flex1} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.header}>
        <BoxIcon Icon={Images.BackIcon} onPress={handleBack} />
        <Text style={styles.headerTitle}>{t("Ticket Details")}</Text>
        {canUpdate && !isClosed ? (
          <BoxIcon Icon={Images.EditVector} onPress={onEdit} />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {loading ? (
        <View style={styles.loaderWrap} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : null}

      {!loading && apiError && !mainItem?.id ? (
        <ApiFeedback error={apiError} onRetry={fetchTicketData} />
      ) : (
      <View style={styles.body}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!loading}
        nestedScrollEnabled
      >
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: hexToRgba(statusColor, 0.15),
                borderColor: statusColor,
              },
            ]}
          >
            <View style={styles.idBadge}>
              <Text
                style={styles.idText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {mainItem?.id || "-"}
              </Text>
            </View>
            <Text style={styles.summaryTitle} numberOfLines={2}>
              {mainItem?.ticket_title || mainItem?.title ? t(mainItem.ticket_title || mainItem.title || "-") : t("-")}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusBadgeText}>
                {mainItem?.ticket_status_data?.status_name
                  ? t(mainItem.ticket_status_data.status_name)
                  : mainItem?.status_name
                    ? t(mainItem.status_name)
                    : t("-")}
              </Text>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <DetailRow label={t("Projects")} value={projectName} />
            <DetailRow label={t("Type")} value={typeName} />
            <DetailRow label={t("Action By")} value={actionByName} />
            <DetailRow label={t("Status Updated")} value={dateText} />
            {closeDateText ? (
              <DetailRow label={t("Closed Date")} value={closeDateText} />
            ) : null}
            {orderCreatedText ? (
              <DetailRow label={t("Order Created By")} value={orderCreatedText} />
            ) : null}
            <DetailRow label={t("Description")} html={descriptionHtml} />
          </View>

          {canUpdate ? (
            <View style={styles.statusSection}>
              <Text style={styles.statusLabel}>{t("Status")}</Text>
              <View style={styles.statusRow}>
                {filteredStatusData.map((statusItem) => {
                  const isSelected =
                    (mainItem?.ticket_status_data?.id != null &&
                      String(statusItem.id) === String(mainItem.ticket_status_data.id)) ||
                    (mainItem?.status_id != null &&
                      String(statusItem.id) === String(mainItem.status_id));

                  return (
                    <Pressable
                      key={String(statusItem.id)}
                      disabled={isClosed || statusChangingId !== null}
                      onPress={() => onStatusPress(statusItem)}
                      style={[
                        styles.statusBtn,
                        {
                          backgroundColor: isSelected
                            ? statusItem.color || Colors.primary
                            : "#D5DDE5",
                          opacity:
                            statusChangingId !== null &&
                            String(statusChangingId) !== String(statusItem.id)
                              ? 0.6
                              : 1,
                        },
                      ]}
                    >
                      {String(statusChangingId) === String(statusItem.id) ? (
                        <ActivityIndicator
                          color={isSelected ? Colors.white : Colors.primary}
                          size="small"
                        />
                      ) : (
                        <Text
                          style={[
                            styles.statusBtnText,
                            { color: isSelected ? Colors.white : Colors.black },
                          ]}
                        >
                          {t(statusItem.status_name)}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {documentLoading ? (
            <View style={styles.docLoader}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : null}

        {documentRows.length > 0 ? (
          <View style={styles.docList}>
            {documentRows.map((row, rowIndex) => (
              <View key={`doc-row-${rowIndex}`} style={styles.docRow}>
                {row.map((docItem) => (
                  <View key={String(docItem.id)}>{renderDocItem({ item: docItem })}</View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {noteData.length > 0 ? (
          <>
            <Text style={styles.notesTitle}>{t("Opmerkingen")} :</Text>
            <View style={styles.notesList}>
              {noteData.map((noteItem, index) => (
                <View key={String(noteItem.id ?? index)}>
                  {renderNoteItem({ item: noteItem })}
                  {index < noteData.length - 1 ? <View style={styles.noteSeparator} /> : null}
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: footerPadding }]}>
        <Pressable style={styles.bottomBtn} onPress={() => setFileSheetVisible(true)}>
          <Image source={Images.camera} style={styles.bottomBtnIcon} />
          <Text style={styles.bottomBtnText}>{t("Camera")}</Text>
        </Pressable>
        <Pressable style={styles.bottomBtn} onPress={openNoteSheet}>
          <Image source={Images.NoteIcon} style={styles.bottomBtnIconNoTint} />
          <Text style={styles.bottomBtnText}>{t("Add Note")}</Text>
        </Pressable>
      </View>
      </View>
      )}

      {fileSheetVisible ? (
        <OptionBottomSheet
          visible={fileSheetVisible}
          title={t("Select Option")}
          confirmText={t("Select")}
          options={FILE_OPTIONS}
          onClose={() => setFileSheetVisible(false)}
          onConfirm={handleFileOptionConfirm}
        />
      ) : null}

      {noteSheetVisible ? (
        <InputBottomSheet
          visible={noteSheetVisible}
          title={t("New Note Add")}
          fieldLabel={t("New Note")}
          placeholder={t("Type here...")}
          value={comment}
          error={commentError}
          loading={noteLoading}
          editorKey={noteEditorKey}
          onChange={(html) => {
            setComment(html);
            setCommentError("");
          }}
          onClose={() => {
            if (noteLoading) {
              return;
            }
            setNoteSheetVisible(false);
            setComment("");
            setCommentError("");
            setPendingStatus(null);
          }}
          onSave={onNoteSave}
          saveText={t("Save Note")}
        />
      ) : null}

      {deleteSheetVisible ? (
        <ConfirmBottomSheet
          visible={deleteSheetVisible}
          title={t("Delete File")}
          message={t("Are you sure you want to delete this file?")}
          confirmText={t("Yes, Delete")}
          cancelText={t("Cancel")}
          loading={deleteLoading}
          onClose={() => {
            setDeleteSheetVisible(false);
            setSelectedFile(null);
          }}
          onConfirm={handleDeleteFile}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  headerSpacer: {
    width: 40,
  },
  loaderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 15,
    gap: 16,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  idBadge: {
    ...listScreenStyles.idBox,
    marginRight: 12,
  },
  idText: listScreenStyles.idText,
  summaryTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  statusBadge: {
    ...listScreenStyles.statusBadge,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: FONTS.OutfitSemiBold,
  },
  detailsSection: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    gap: 4,
  },
  detailRow: {
    paddingVertical: 12,
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: FONTS.OutfitRegular,
    color: Colors.placeholder,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  statusSection: {
    gap: 10,
  },
  statusLabel: {
    fontSize: 13,
    fontFamily: FONTS.OutfitRegular,
    color: Colors.placeholder,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusBtn: {
    minWidth: "31%",
    flexGrow: 1,
    minHeight: 40,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  statusBtnText: {
    fontSize: 12,
    fontFamily: FONTS.OutfitSemiBold,
    textAlign: "center",
  },
  docLoader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  docList: {
    gap: 10,
  },
  docRow: {
    gap: 10,
  },
  docItem: {
    width: DOC_ITEM_WIDTH,
    height: DOC_ITEM_WIDTH,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  docImage: {
    width: "100%",
    height: "100%",
  },
  docDeleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.dicline,
    borderRadius: 12,
    padding: 4,
  },
  docDeleteIcon: {
    width: 12,
    height: 12,
    tintColor: Colors.white,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 15,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minHeight: 50,
  },
  bottomBtnIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.white,
  },
  bottomBtnIconNoTint: {
    width: 20,
    height: 20,
  },
  bottomBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: FONTS.OutfitSemiBold,
  },
  notesTitle: {
    fontSize: 16,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
    marginTop: 4,
  },
  notesList: {
    gap: 10,
    marginTop: 8,
  },
  noteSeparator: {
    height: 8,
  },
  noteCard: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  noteAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  noteContent: {
    flex: 1,
    gap: 4,
  },
  noteUser: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  noteDate: {
    fontSize: 12,
    fontFamily: FONTS.OutfitRegular,
    color: Colors.placeholder,
  },
  noteHtml: {
    marginTop: 2,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  previewClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: Colors.dicline,
    padding: 8,
    borderRadius: 20,
  },
  previewCloseIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.white,
  },
  previewImage: {
    flex: 1,
    width: "100%",
  },
});
