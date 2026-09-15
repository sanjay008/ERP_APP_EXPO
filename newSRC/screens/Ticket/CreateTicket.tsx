import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useScreenInsets } from "../../utils/screenInsets";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import axios from "axios";
import { t } from "i18next";
import BoxIcon from "../../Components/BoxIcon";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet, {
  SheetOption,
} from "../../Components/SelectionBottomSheet";
import OptionBottomSheet, { OptionItem } from "../../Components/OptionBottomSheet";
import RichDescriptionEditor from "../../Components/RichDescriptionEditor";
import FallBackImage from "../../Components/FallBackImage";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { getData, removeHtmlTags } from "../../utils/storeData";
import { Keys } from "../../utils/Keys";
import apiClient, { BASE_URL } from "../../utils/client";
import { apiConstants } from "../../utils/apiConstants";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { compressImages } from "../../utils/imageCompressor";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  pickTicketCamera,
  pickTicketDocuments,
  pickTicketGallery,
} from "../../utils/ticketFilePicker";

const newflow = false;

type SheetType = "project" | "type" | "action" | null;

const FILE_OPTIONS: OptionItem[] = [
  { id: "camera", label: "Camera" },
  { id: "gallery", label: "Gallery" },
  { id: "files", label: "Files (PDF/DOC)" },
];

type ProjectItem = {
  project_id: string | number;
  project_name: string;
};

type ProjectTypeItem = {
  id: string | number;
  type_name: string;
};

type MemberItem = {
  id: string | number;
  display_name: string;
};

type FileItem = {
  uri?: string;
  name: string;
  type: string;
  file_extension?: string;
  shared_link?: string;
  original_uploaded_filename?: string;
  id?: string | number;
  isLocal?: boolean;
};

const getDropboxDirectLink = (url?: string) => {
  if (!url) return "";
  try {
    if (url.includes("dropboxusercontent.com")) return url;
    if (url.includes("db.tt")) return url.replace("db.tt", "dl.dropboxusercontent.com");
    if (url.includes("dropbox.com")) {
      let cleaned = url
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace("dropbox.com", "dl.dropboxusercontent.com")
        .replace(/[?&](dl|raw)=[^&]*/g, "");
      cleaned += cleaned.includes("?") ? "&raw=1" : "?raw=1";
      return cleaned;
    }
    return url;
  } catch {
    return "";
  }
};

const guessMimeType = (extension = "") => {
  const ext = extension.toLowerCase().replace(".", "");
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "doc" || ext === "docx") return "application/msword";
  return "image/jpeg";
};

const normalizeTicketDocuments = (documents: any[] = []): FileItem[] =>
  documents.map((doc) => {
    const extension = (doc?.file_extension || "").toLowerCase();
    const isLocal = Boolean(
      doc?.uri &&
        (doc.uri.startsWith("file://") ||
          doc.uri.startsWith("content://") ||
          doc.uri.startsWith("ph://"))
    );

    return {
      id: doc?.id,
      uri: doc?.uri || "",
      name: doc?.name || doc?.original_uploaded_filename || `document_${doc?.id || Date.now()}`,
      type: doc?.type || doc?.mimeType || guessMimeType(extension),
      file_extension: doc?.file_extension,
      shared_link: doc?.shared_link,
      original_uploaded_filename: doc?.original_uploaded_filename,
      isLocal,
    };
  });

const normalizeEditItem = (rawItem?: any, routeTypeee?: string) => {
  if (!rawItem) return null;

  const isEdit = rawItem?.typeee === "edit" || routeTypeee === "edit";
  if (!isEdit) return { ...rawItem, typeee: rawItem?.typeee };

  const projectId = rawItem?.project_id ?? rawItem?.project_data?.id;
  const projectName = rawItem?.project_name ?? rawItem?.project_data?.project_name;

  return {
    ...rawItem,
    typeee: "edit",
    project_id: projectId,
    project_name: projectName,
    ticket_title: rawItem?.ticket_title || rawItem?.title || "",
    ticket_description: rawItem?.ticket_description || "",
    ticket_documents: rawItem?.ticket_documents || [],
  };
};

const getFilePreviewMeta = (file: FileItem) => {
  const type = (file?.type || "").toLowerCase();
  const ext = (file?.file_extension || "").toLowerCase();
  const previewUri = file?.uri || getDropboxDirectLink(file?.shared_link);

  const isImage =
    type.includes("image") ||
    ext.includes("image") ||
    ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].some((value) =>
      ext.includes(value)
    );

  const isPdf = type.includes("pdf") || ext.includes("pdf");

  return { previewUri, isImage, isPdf };
};

const formatToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function parseTicketParam(raw?: string) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function CreateTicket() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; item?: string; typeee?: string }>();
  const routeItem = useMemo(() => parseTicketParam(params.item), [params.item]);
  const routeTypeee = params.mode === "edit" ? "edit" : params.typeee;
  const editItem = useMemo(
    () => normalizeEditItem(routeItem, routeTypeee),
    [routeItem, routeTypeee]
  );
  const isEdit = editItem?.typeee === "edit";
  const descriptionContentKey = useMemo(
    () =>
      isEdit
        ? `edit-${editItem?.id}-${editItem?.ticket_description ?? ""}`
        : "create",
    [isEdit, editItem?.id, editItem?.ticket_description]
  );
  const { setToast } = useContext(RegisterBackContext);
  const { top, footerPadding } = useScreenInsets();

  const statusName =
    editItem?.ticket_status_data?.status_name || editItem?.status_name || t("Concept");
  const statusColor =
    editItem?.ticket_status_data?.color || editItem?.color_code || Colors.conceptStatus;

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(() => {
    const projectId = editItem?.project_id;
    const projectName = editItem?.project_name;
    return projectId
      ? { project_id: projectId, project_name: projectName || "" }
      : null;
  });
  const [selectedType, setSelectedType] = useState<ProjectTypeItem | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<MemberItem[]>([]);
  const [ticketTitle, setTicketTitle] = useState(editItem?.ticket_title || "");
  const [description, setDescription] = useState(editItem?.ticket_description || "");
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>(() =>
    normalizeTicketDocuments(editItem?.ticket_documents || [])
  );

  useEffect(() => {
    if (!isEdit) return;
    setTicketTitle(editItem?.ticket_title || "");
    setDescription(editItem?.ticket_description || "");
  }, [isEdit, editItem?.id, editItem?.ticket_title, editItem?.ticket_description]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [fileSheetVisible, setFileSheetVisible] = useState(false);

  const editItemRef = useRef(editItem);
  editItemRef.current = editItem;
  const initialDataLoadedRef = useRef(false);

  const showToast = useCallback(
    (text: string, type: "success" | "error" = "success") => {
      setToast({ top: 45, text, type, visible: true });
    },
    [setToast]
  );

  const getErrorMessage = useCallback(
    (error: unknown) => getApiErrorMessage(error, t("Something went wrong")),
    [t]
  );

  const projectOptions = useMemo<SheetOption[]>(
    () =>
      projects.map((project) => ({
        id: project.project_id,
        label: project.project_name || "-",
        raw: project,
      })),
    [projects]
  );

  const typeOptions = useMemo<SheetOption[]>(
    () =>
      projectTypes.map((typeItem) => ({
        id: typeItem.id,
        label: typeItem.type_name || "-",
        raw: typeItem,
      })),
    [projectTypes]
  );

  const memberOptions = useMemo<SheetOption[]>(
    () =>
      members.map((member) => ({
        id: member.id,
        label: member.display_name || "-",
        raw: member,
      })),
    [members]
  );

  const fetchMembers = useCallback(
    async (projectId: string | number, prefillFromEdit = false) => {
      try {
        const response = await apiClient.post(apiConstants.get_ticketprojects, {
          project_id: projectId,
        });
        if (response?.data?.status) {
          const memberList = response?.data?.data?.members || [];
          setMembers(memberList);

          if (!prefillFromEdit) {
            return;
          }

          const item = editItemRef.current;
          const actionByIds = item?.action_by
            ? Array.isArray(item.action_by)
              ? item.action_by
              : String(item.action_by)
                  .split(",")
                  .map((id: string) => id.trim())
            : item?.action_relatie_data?.id
              ? [item.action_relatie_data.id]
              : [];

          if (actionByIds.length === 0) {
            return;
          }

          const preselected = memberList.filter((member: MemberItem) =>
            actionByIds.some((id: string | number) => String(id) === String(member.id))
          );

          if (preselected.length > 0) {
            setSelectedMembers(newflow ? preselected : [preselected[0]]);
            return;
          }

          if (item?.action_relatie_data?.display_name) {
            setSelectedMembers([
              {
                id: item.action_relatie_data.id || item.action_relatie_data.display_name,
                display_name: item.action_relatie_data.display_name,
              },
            ]);
          }
        }
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    },
    [getErrorMessage, showToast]
  );

  useEffect(() => {
    if (initialDataLoadedRef.current) {
      return;
    }
    initialDataLoadedRef.current = true;

    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const response = await apiClient.post(apiConstants.getprojectsDetails);
        if (cancelled || !response?.data?.status) {
          return;
        }

        setProjects(response?.data?.data || []);
        setProjectTypes(response?.data?.logboek_type || []);

        const item = editItemRef.current;
        if (item?.type) {
          const matched = (response?.data?.logboek_type || []).find(
            (typeItem: ProjectTypeItem) =>
              String(typeItem.id) === String(item.type) ||
              typeItem.type_name === item.type
          );
          if (matched) {
            setSelectedType(matched);
          } else if (typeof item.type === "string") {
            setSelectedType({
              id: item.type_id || item.type,
              type_name: item.type,
            });
          }
        }

        if (item?.project_id) {
          await fetchMembers(item.project_id, true);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(getErrorMessage(error), "error");
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [fetchMembers, getErrorMessage, showToast]);

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validate = useCallback(() => {
    const nextErrors: Record<string, string> = {};
    if (!ticketTitle.trim()) {
      nextErrors.ticketTitle = t("Ticket name is required");
    }
    if (!removeHtmlTags(description)) {
      nextErrors.description = t("Description is required");
    }
    if (!selectedProject) {
      nextErrors.projectName = t("Project Name is required");
    }
    if (!selectedType) {
      nextErrors.projectType = t("Project Type is required");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [description, selectedProject, selectedType, ticketTitle]);

  const appendActionByIds = useCallback(
    (formData: FormData) => {
      if (newflow) {
        selectedMembers.forEach((member) => {
          formData.append("action_by[]", String(member.id));
        });
        return;
      }
      formData.append("action_by", selectedMembers[0]?.id ? String(selectedMembers[0].id) : "");
    },
    [selectedMembers]
  );

  const submitCreate = useCallback(async () => {
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      const userData = await getData(Keys.USERDATA);
      const formData = new FormData();
      formData.append("relaties_id", String(userData.data.relaties.id));
      formData.append("user_id", String(userData.data.user.id));
      formData.append("token", userData.data.user.verify_token);
      formData.append("role", userData.data.user.role);
      formData.append("project_name", selectedProject?.project_name || "");
      formData.append("project_id", String(selectedProject?.project_id || ""));
      appendActionByIds(formData);
      formData.append("ticket_title", ticketTitle.trim());
      formData.append("ticket_description", description);
      formData.append("type", String(selectedType?.id || ""));
      formData.append("date", formatToday());

      selectedFiles
        .filter((file) => file?.uri)
        .forEach((file) => {
          formData.append("doc[]", {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as any);
        });

      const response = await axios.post(
        apiConstants.ticket_create,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response?.data?.status) {
        showToast(response?.data?.message || t("Ticket created successfully"), "success");
        router.back();
      } else {
        showToast(response?.data?.message || t("Something went wrong"), "error");
      }
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [
    appendActionByIds,
    description,
    getErrorMessage,
    router,
    selectedFiles,
    selectedProject,
    selectedType,
    showToast,
    ticketTitle,
    validate,
  ]);

  const submitEdit = useCallback(async () => {
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      const userData = await getData(Keys.USERDATA);
      const formData = new FormData();
      formData.append("relaties_id", String(userData.data.relaties.id));
      formData.append("user_id", String(userData.data.user.id));
      formData.append("role", userData.data.user.role);
      formData.append("ticket_id", String(editItem?.id));
      formData.append("token", userData.data.user.verify_token);

      if (selectedProject) {
        formData.append("project_name", selectedProject.project_name);
        formData.append("project_id", String(selectedProject.project_id));
      }

      appendActionByIds(formData);
      formData.append("ticket_title", ticketTitle.trim());
      formData.append("ticket_description", description);
      formData.append("type", String(selectedType?.id || ""));

      selectedFiles
        .filter((file) => file.isLocal && file.uri)
        .forEach((file) => {
          formData.append("doc[]", {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as any);
        });

      const response = await axios.post(
        apiConstants.ticket_update,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response?.data?.status) {
        showToast(response?.data?.message || t("Ticket updated successfully"), "success");
        router.back();
      } else {
        showToast(response?.data?.message || t("Something went wrong"), "error");
      }
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [
    appendActionByIds,
    description,
    getErrorMessage,
    editItem,
    router,
    selectedFiles,
    selectedProject,
    selectedType,
    showToast,
    ticketTitle,
    validate,
  ]);

  const handleSubmit = useCallback(() => {
    if (isEdit) {
      submitEdit();
      return;
    }
    submitCreate();
  }, [isEdit, submitCreate, submitEdit]);

  const appendSelectedFiles = useCallback(async (assets: { uri: string; name: string; type: string }[]) => {
    const compressed = await compressImages(assets);
    setSelectedFiles((prev) => [
      ...prev,
      ...compressed.map((file) => ({ ...file, isLocal: true })),
    ]);
  }, []);

  const openCamera = useCallback(async () => {
    const result = await pickTicketCamera();
    if (result.ok) await appendSelectedFiles(result.assets);
  }, [appendSelectedFiles]);

  const openGallery = useCallback(async () => {
    const result = await pickTicketGallery();
    if (result.ok) await appendSelectedFiles(result.assets);
  }, [appendSelectedFiles]);

  const openDocument = useCallback(async () => {
    const result = await pickTicketDocuments();
    if (result.ok) {
      await appendSelectedFiles(result.assets);
      return;
    }
    if (result.reason === "error") {
      showToast(t("Something went wrong"), "error");
    }
  }, [appendSelectedFiles, showToast, t]);

  const handleFileSelection = useCallback(() => {
    if (loading) {
      return;
    }
    setFileSheetVisible(true);
  }, [loading]);

  const handleFileOptionConfirm = useCallback(
    (option: OptionItem) => {
      if (option.id === "camera") {
        openCamera();
      } else if (option.id === "gallery") {
        openGallery();
      } else if (option.id === "files") {
        openDocument();
      }
    },
    [openCamera, openDocument, openGallery]
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const sheetConfig = useMemo(() => {
    if (activeSheet === "project") {
      return {
        title: "Select Project Name",
        searchPlaceholder: "Search project name",
        confirmText: "Select Project",
        options: projectOptions,
        selectedIds: selectedProject ? [selectedProject.project_id] : [],
        multiSelect: false,
      };
    }
    if (activeSheet === "type") {
      return {
        title: "Select Project Type",
        searchPlaceholder: "Search project type",
        confirmText: "Select Type",
        options: typeOptions,
        selectedIds: selectedType ? [selectedType.id] : [],
        multiSelect: false,
      };
    }
    if (activeSheet === "action") {
      return {
        title: "Select Action By",
        searchPlaceholder: "Search action by",
        confirmText: "Select Action",
        options: memberOptions,
        selectedIds: selectedMembers.map((member) => member.id),
        multiSelect: newflow,
      };
    }
    return null;
  }, [
    activeSheet,
    memberOptions,
    projectOptions,
    selectedMembers,
    selectedProject,
    selectedType,
    typeOptions,
  ]);

  const handleSheetConfirm = useCallback(
    (selected: SheetOption[]) => {
      if (activeSheet === "project") {
        const project = selected[0]?.raw as ProjectItem;
        if (project) {
          setSelectedProject(project);
          setSelectedMembers([]);
          setMembers([]);
          clearError("projectName");
          fetchMembers(project.project_id, false);
        }
      }
      if (activeSheet === "type") {
        const typeItem = selected[0]?.raw as ProjectTypeItem;
        if (typeItem) {
          setSelectedType(typeItem);
          clearError("projectType");
        }
      }
      if (activeSheet === "action") {
        setSelectedMembers(selected.map((row) => row.raw as MemberItem));
        clearError("actionBy");
      }
    },
    [activeSheet, clearError, fetchMembers]
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.header}>
        <BoxIcon Icon={Images.BackIcon} onPress={() => router.back()} />
        <Text style={styles.headerTitle}>
          {isEdit ? t("Update Ticket") : t("Create New Ticket")}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>
            {isEdit ? t(statusName) : t("Concept")}
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormSelectField
          label={t("Project Name")}
          required
          placeholder={t("Select project name")}
          value={selectedProject?.project_name}
          onPress={() => setActiveSheet("project")}
          error={errors.projectName}
          disabled={loading}
        />

        <FormSelectField
          label={t("Project Type")}
          required
          placeholder={t("Select project type")}
          value={selectedType?.type_name}
          onPress={() => setActiveSheet("type")}
          error={errors.projectType}
          disabled={loading}
        />

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>
            {t("Ticket Title")}
            <Text style={styles.required}> *</Text>
          </Text>
          <View style={[styles.inputWithIcon, errors.ticketTitle && styles.errorBorder]}>
            <FallBackImage
              source={Images.userVector}
              style={styles.userIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.inputField}
              placeholder={t("Enter ticket title")}
              placeholderTextColor={Colors.placeholder}
              value={ticketTitle}
              editable={!loading}
              onChangeText={(text) => {
                setTicketTitle(text);
                clearError("ticketTitle");
              }}
            />
          </View>
          {errors.ticketTitle ? <Text style={styles.errorText}>{errors.ticketTitle}</Text> : null}
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>
            {t("Description")}
            <Text style={styles.required}> *</Text>
          </Text>
          <RichDescriptionEditor
            value={description}
            onChange={(html) => {
              setDescription(html);
              clearError("description");
            }}
            placeholder={t("Type here...")}
            error={Boolean(errors.description)}
            disabled={loading}
            contentKey={descriptionContentKey}
          />
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
        </View>

        <FormSelectField
          label={t("Action By")}
          placeholder={t("Select action")}
          value={
            selectedMembers.length > 0
              ? selectedMembers.map((member) => member.display_name).join(", ")
              : ""
          }
          onPress={() => {
            if (!selectedProject) {
              showToast(t("select project"), "error");
              return;
            }
            setActiveSheet("action");
          }}
          error={errors.actionBy}
          disabled={loading}
        />

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>{t("Document")}</Text>
          <View style={styles.fileRow}>
            <TouchableOpacity
              style={[styles.chooseFileBtn, loading && styles.disabledBtn]}
              onPress={handleFileSelection}
              disabled={loading}
            >
              <Text style={styles.chooseFileText}>{t("Choose File")}</Text>
            </TouchableOpacity>
            <Text style={styles.fileName} numberOfLines={1}>
              {selectedFiles.length > 0
                ? `${selectedFiles.length} file(s) selected`
                : t("No file chosen")}
            </Text>
          </View>
        </View>

        {selectedFiles.length > 0 ? (
          <View style={styles.previewRow}>
            {selectedFiles.map((file, index) => {
              const { previewUri, isImage, isPdf } = getFilePreviewMeta(file);
              const fileKey = file.id ? String(file.id) : `${file.name}-${index}`;

              return (
                <View key={fileKey} style={styles.previewItem}>
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => removeFile(index)}
                    disabled={loading}
                  >
                    <Text style={styles.removeBtnText}>×</Text>
                  </Pressable>
                  {isImage && previewUri ? (
                    <Image source={{ uri: previewUri }} style={styles.previewImage} />
                  ) : isPdf ? (
                    <Image source={Images.PdfLogo} style={styles.previewDocIcon} resizeMode="contain" />
                  ) : (
                    <View style={styles.filePlaceholder}>
                      <Text style={styles.filePlaceholderText}>DOC</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: footerPadding }]}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEdit ? t("Update Ticket") : t("Create Ticket")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <SelectionBottomSheet
        visible={activeSheet !== null}
        title={sheetConfig?.title || ""}
        searchPlaceholder={sheetConfig?.searchPlaceholder || ""}
        confirmText={sheetConfig?.confirmText || ""}
        options={sheetConfig?.options || []}
        selectedIds={sheetConfig?.selectedIds || []}
        multiSelect={sheetConfig?.multiSelect || false}
        onClose={() => setActiveSheet(null)}
        onConfirm={handleSheetConfirm}
      />

      <OptionBottomSheet
        visible={fileSheetVisible}
        title={t("Select Option")}
        confirmText={t("Select")}
        options={FILE_OPTIONS}
        onClose={() => setFileSheetVisible(false)}
        onConfirm={handleFileOptionConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
    marginLeft: 10,
  },
  statusBadge: {
    ...listScreenStyles.statusBadge,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: 130,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  contentContainer: {
    gap: 18,
    paddingBottom: 30,
  },
  fieldWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  required: {
    color: Colors.dicline,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  userIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.placeholder,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.black,
    padding: 0,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.black,
    minHeight: 110,
    backgroundColor: Colors.white,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  chooseFileBtn: {
    backgroundColor: Colors.SquareBtnBG,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  disabledBtn: {
    opacity: 0.55,
  },
  chooseFileText: {
    fontSize: 13,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.primary,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.OutfitRegular,
    color: Colors.placeholder,
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  previewItem: {
    width: 88,
    height: 88,
    position: "relative",
  },
  previewImage: {
    width: 88,
    height: 88,
    borderRadius: 8,
    backgroundColor: Colors.SquareBtnBG,
  },
  previewDocIcon: {
    width: 88,
    height: 88,
    borderRadius: 8,
    backgroundColor: Colors.SquareBtnBG,
  },
  filePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 8,
    backgroundColor: Colors.SquareBtnBG,
    alignItems: "center",
    justifyContent: "center",
  },
  filePlaceholderText: {
    fontSize: 12,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.placeholder,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    zIndex: 2,
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: Colors.dicline,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 16,
    fontFamily: FONTS.OutfitBold,
  },
  errorBorder: {
    borderColor: Colors.dicline,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTS.OutfitRegular,
    color: Colors.dicline,
  },
  footer: {
    paddingHorizontal: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  submitBtnDisabled: {
    opacity: 0.85,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: FONTS.OutfitSemiBold,
  },
});
