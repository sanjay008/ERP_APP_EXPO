import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parseApiError } from "../../utils/apiError";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import AuthInput from "../../Components/Auth/AuthInput";
import AuthButton from "../../Components/Auth/AuthButton";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet, {
  type SheetOption,
} from "../../Components/SelectionBottomSheet";
import OptionBottomSheet, { type OptionItem } from "../../Components/OptionBottomSheet";
import {
  createTask,
  fetchCustomers,
  fetchPriorities,
  type PriorityOption,
  type RelatieOption,
} from "../../services/taskService";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";

type TaskFile = {
  uri: string;
  name: string;
  type: string;
};

function isImageFile(file?: TaskFile | null) {
  return Boolean(file?.type?.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file?.name || ""));
}

function isPdfFile(file?: TaskFile | null) {
  return Boolean(file?.type?.includes("pdf") || file?.name?.toLowerCase().endsWith(".pdf"));
}

async function pickTaskCamera(): Promise<TaskFile | null> {
  const ImagePicker = await import("expo-image-picker");
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName || "photo.jpg",
    type: asset.mimeType || "image/jpeg",
  };
}

async function pickTaskGallery(): Promise<TaskFile | null> {
  const ImagePicker = await import("expo-image-picker");
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
    allowsMultipleSelection: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName || "gallery.jpg",
    type: asset.mimeType || "image/jpeg",
  };
}

async function pickTaskDocument(): Promise<TaskFile | null> {
  const DocumentPicker = await import("expo-document-picker");
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name || "document.pdf",
    type: asset.mimeType || "application/pdf",
  };
}

export default function CreateTaskScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<RelatieOption[]>([]);
  const [priorities, setPriorities] = useState<PriorityOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<RelatieOption | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<PriorityOption | null>(null);
  const [selectedFile, setSelectedFile] = useState<TaskFile | null>(null);
  const [customerSheetVisible, setCustomerSheetVisible] = useState(false);
  const [prioritySheetVisible, setPrioritySheetVisible] = useState(false);
  const [fileSheetVisible, setFileSheetVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const formLoaded = customers.length > 0 || priorities.length > 0;

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      clearApiError();
      const [customerRes, priorityRes] = await Promise.all([
        fetchCustomers(),
        fetchPriorities(),
      ]);
      if (customerRes?.status && Array.isArray(customerRes.data)) {
        setCustomers(customerRes.data);
      }
      if (priorityRes?.status && Array.isArray(priorityRes.data)) {
        setPriorities(priorityRes.data);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [clearApiError, captureApiError]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  const customerOptions: SheetOption[] = useMemo(
    () =>
      customers.map((item) => ({
        id: item.id,
        label: item.display_name || item.bedrijfsnaam || String(item.id),
        raw: item,
      })),
    [customers]
  );

  const priorityOptions: SheetOption[] = useMemo(
    () =>
      priorities.map((item, index) => ({
        id: item.id ?? item.value ?? index,
        label: item.value || item.name || item.label || String(index),
        raw: item,
      })),
    [priorities]
  );

  const fileOptions: OptionItem[] = useMemo(
    () => [
      { id: "camera", label: t("Camera") },
      { id: "gallery", label: t("Gallery") },
      { id: "files", label: t("Files (PDF/DOC)") },
    ],
    [t]
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedCustomer) nextErrors.customer = t("Relaties selection is required");
    if (!title.trim()) nextErrors.title = t("Task name is required");
    if (!description.trim()) nextErrors.description = t("Description is required");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFileOption = useCallback(async (option: OptionItem) => {
    try {
      let file: TaskFile | null = null;
      if (option.id === "camera") file = await pickTaskCamera();
      else if (option.id === "gallery") file = await pickTaskGallery();
      else if (option.id === "files") file = await pickTaskDocument();
      if (file) setSelectedFile(file);
    } catch (error) {
      captureApiError(error);
    }
  }, [captureApiError]);

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      clearApiError();
      const response = await createTask({
        selected_relaties_id: selectedCustomer?.id,
        title: title.trim(),
        short_description: description.trim(),
        priority: selectedPriority?.value || selectedPriority?.name || "",
        document: selectedFile || "",
      });
      if (response?.status) {
        router.back();
        return;
      }
      captureApiError(response);
    } catch (error) {
      captureApiError(error);
      console.log("📝 TASK CREATE ERROR =>", parseApiError(error, t("Something went wrong")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Add Task")} />

      {loading && !formLoaded ? (
        <ApiFeedback loading />
      ) : apiError && !formLoaded ? (
        <ApiFeedback error={apiError} onRetry={loadFormData} />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={getKeyboardAvoidBehavior()}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: scrollPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.conceptWrap}>
              <View style={styles.conceptBadge}>
                <Text style={styles.conceptText}>{t("Concept")}</Text>
              </View>
            </View>

            <FormSelectField
              label={t("Relaties")}
              required
              placeholder={t("Select Relaties")}
              value={
                selectedCustomer
                  ? selectedCustomer.display_name || selectedCustomer.bedrijfsnaam
                  : undefined
              }
              onPress={() => setCustomerSheetVisible(true)}
              error={errors.customer}
            />

            <AuthInput
              label={t("Task Name")}
              required
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder={t("Enter task name")}
              error={errors.title}
            />

            <AuthInput
              label={t("Omschrijving")}
              required
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder={t("Enter description")}
              multiline
              style={{ minHeight: 100, textAlignVertical: "top" }}
              error={errors.description}
            />

            <FormSelectField
              label={t("Priority")}
              placeholder={t("Select priority")}
              value={
                selectedPriority
                  ? selectedPriority.value ||
                    selectedPriority.name ||
                    selectedPriority.label
                  : undefined
              }
              onPress={() => setPrioritySheetVisible(true)}
            />

            <View style={styles.docWrap}>
              <Text style={styles.docLabel}>{t("Document")}</Text>
              <Pressable
                style={styles.docField}
                onPress={() => setFileSheetVisible(true)}
              >
                <Text
                  style={[styles.docValue, !selectedFile && styles.docPlaceholder]}
                  numberOfLines={1}
                >
                  {selectedFile?.name || ""}
                </Text>
                <Ionicons name="images-outline" size={20} color={AppColors.primary} />
              </Pressable>
            </View>

            {selectedFile ? (
              <View style={styles.previewWrap}>
                <Pressable style={styles.removeBtn} onPress={() => setSelectedFile(null)}>
                  <Text style={styles.removeBtnText}>×</Text>
                </Pressable>
                {isImageFile(selectedFile) ? (
                  <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
                ) : isPdfFile(selectedFile) ? (
                  <Image source={Images.PdfLogo} style={styles.previewDocIcon} resizeMode="contain" />
                ) : (
                  <Image source={Images.documentlogo} style={styles.previewDocIcon} resizeMode="contain" />
                )}
              </View>
            ) : null}

            {apiError ? (
              <View style={styles.submitErrorBox}>
                <Text style={styles.submitErrorTitle}>{t("Something went wrong")}</Text>
                <Text style={styles.submitErrorText}>{t(apiError.message)}</Text>
              </View>
            ) : null}

            <AuthButton
              title={submitting ? t("Loading...") : t("Create Task")}
              onPress={handleSubmit}
              disabled={submitting}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <SelectionBottomSheet
        visible={customerSheetVisible}
        title={t("Relaties")}
        searchPlaceholder={t("Search Relaties")}
        confirmText={t("Apply")}
        options={customerOptions}
        selectedIds={selectedCustomer ? [selectedCustomer.id] : []}
        onClose={() => setCustomerSheetVisible(false)}
        onConfirm={(selected) => {
          setSelectedCustomer(selected[0]?.raw ?? null);
          setCustomerSheetVisible(false);
          if (errors.customer) {
            setErrors((prev) => ({ ...prev, customer: "" }));
          }
        }}
      />

      <SelectionBottomSheet
        visible={prioritySheetVisible}
        title={t("Priority")}
        searchPlaceholder={t("Search priority")}
        confirmText={t("Apply")}
        options={priorityOptions}
        selectedIds={
          selectedPriority
            ? [selectedPriority.id ?? selectedPriority.value ?? ""]
            : []
        }
        onClose={() => setPrioritySheetVisible(false)}
        onConfirm={(selected) => {
          setSelectedPriority(selected[0]?.raw ?? null);
          setPrioritySheetVisible(false);
        }}
      />

      <OptionBottomSheet
        visible={fileSheetVisible}
        title={t("Select Option")}
        confirmText={t("Select")}
        options={fileOptions}
        onClose={() => setFileSheetVisible(false)}
        onConfirm={handleFileOption}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  conceptWrap: {
    alignItems: "flex-end",
  },
  conceptBadge: {
    backgroundColor: "#858585",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  conceptText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: "#FFFFFF",
  },
  docWrap: {
    gap: 8,
  },
  docLabel: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: AppColors.black,
  },
  docField: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  docValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: AppColors.black,
  },
  docPlaceholder: {
    color: "#9CA3AF",
  },
  previewWrap: {
    width: 88,
    height: 88,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: 88,
    height: 88,
  },
  previewDocIcon: {
    width: 42,
    height: 42,
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 16,
  },
  submitErrorBox: {
    backgroundColor: "#FDECEC",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  submitErrorTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: "#D14343",
  },
  submitErrorText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: "#D14343",
  },
});
