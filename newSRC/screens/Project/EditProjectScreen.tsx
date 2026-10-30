import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
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
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import SelectionBottomSheet from "../../Components/SelectionBottomSheet";
import OptionBottomSheet from "../../Components/OptionBottomSheet";
import ConfirmBottomSheet from "../../Components/ConfirmBottomSheet";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import FallBackImage from "../../Components/FallBackImage";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useAppData } from "../../context/AppDataContext";
import { hasPermission } from "../../utils/permissionFlags";
import {
  collectProjectFolderNames,
  fetchProjectDetails,
  fetchProjectFiles,
  projectFileId,
  projectFolderName,
  projectPersonId,
  removeProjectFile,
  removeProjectRelation,
  requestProjectsRefresh,
  updateProject,
  type ProjectDetail,
  type ProjectFileItem,
  type ProjectFilesData,
  type ProjectImageFile,
  type ProjectPerson,
  type ProjectRelationType,
} from "../../services/projectService";
import {
  projectFileComment,
  projectFileLabel,
  projectFileShortLabel,
  projectFileThumb,
  projectFileUrl,
} from "./ProjectFilesSections";
import { fetchCompanyCurrencies, type CurrencyOption } from "../../services/taskService";
import { pickProfileImage } from "../../utils/profileImagePicker";
import { AppApiError, parseApiError, type ParsedApiError } from "../../utils/apiError";
import { useScreenInsets } from "../../utils/screenInsets";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";

function sameValue(left: unknown, right: unknown) {
  return String(left ?? "").trim() === String(right ?? "").trim();
}

export default function EditProjectScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { permissions } = useAppData();
  const { top, footerPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);
  const params = useLocalSearchParams<{ id?: string }>();

  const canUpdateProject = hasPermission(permissions, "project_mobile", "update");
  const canDeleteDocument = hasPermission(permissions, "project_documents_mobile", "delete");
  const canDeletePhoto = hasPermission(permissions, "project_photos_mobile", "delete");

  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [apiError, setApiError] = useState<ParsedApiError | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [projectName, setProjectName] = useState("");
  const [budget, setBudget] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [image, setImage] = useState<ProjectImageFile | null>(null);
  const [files, setFiles] = useState<ProjectFilesData>({
    folders: [],
    documents: [],
    photos: [],
  });
  const [currencySheet, setCurrencySheet] = useState(false);
  const [imageSheet, setImageSheet] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    type: "document" | "photo";
    file: ProjectFileItem;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!params.id) return;
    try {
      if (!silent) setLoading(true);
      setApiError(null);
      const [detailsRes, currencyRes, filesRes] = await Promise.all([
        fetchProjectDetails(params.id),
        fetchCompanyCurrencies(),
        fetchProjectFiles(params.id).catch(() => ({
          folders: [],
          documents: [],
          photos: [],
        })),
      ]);
      const next = Array.isArray(detailsRes?.data) ? detailsRes.data[0] : null;
      if (!next) throw new Error(t("Something went wrong"));
      setDetail(next);
      setProjectName(next.project_name || "");
      setBudget(next.budject == null ? "" : String(next.budject));
      setCurrencyCode(String(next.budject_currency_data?.code || next.budject_currency || ""));
      setImage(null);
      setFiles(filesRes);
      if (currencyRes?.status && Array.isArray(currencyRes.data)) {
        setCurrencies(currencyRes.data);
      }
    } catch (error) {
      setApiError(parseApiError(error, t("Something went wrong")));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [params.id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedCurrency = useMemo(
    () => currencies.find((item) => String(item.code) === currencyCode),
    [currencies, currencyCode]
  );

  const originalCurrency = String(
    detail?.budject_currency_data?.code || detail?.budject_currency || ""
  );
  const originalBudget = detail?.budject == null ? "" : String(detail.budject);
  const originalName = detail?.project_name || "";

  const hasChanges = useMemo(() => {
    if (!detail) return false;
    if (!sameValue(projectName.trim(), originalName)) return true;
    if (!sameValue(budget, originalBudget)) return true;
    if (!sameValue(currencyCode, originalCurrency)) return true;
    if (image) return true;
    return false;
  }, [budget, currencyCode, detail, image, originalBudget, originalCurrency, originalName, projectName]);

  const pickImage = async (source: "camera" | "gallery") => {
    const result = await pickProfileImage(source);
    if (result.ok) {
      setImage({
        uri: result.asset.uri,
        type: result.asset.type || "image/jpeg",
        name: result.asset.name || `project_${Date.now()}.jpg`,
      });
      return;
    }
    if (result.reason === "cancelled") return;
    setToast({
      top: 45,
      text:
        result.reason === "permission"
          ? t("Permission required to access photos")
          : t("Something went wrong"),
      type: "error",
      visible: true,
    });
  };

  const handleSave = async () => {
    if (!canUpdateProject || !params.id || !detail) return;
    const name = projectName.trim();
    if (!name) {
      setErrors({ project_name: t("This field is required") });
      return;
    }

    const changes: {
      project_name?: string;
      budject?: string;
      budject_currency?: string;
      project_image?: ProjectImageFile;
    } = {};

    if (!sameValue(name, originalName)) changes.project_name = name;
    if (!sameValue(budget, originalBudget)) changes.budject = budget.trim();
    if (!sameValue(currencyCode, originalCurrency)) changes.budject_currency = currencyCode;
    if (image) changes.project_image = image;

    if (!Object.keys(changes).length) return;

    try {
      setSaving(true);
      await updateProject(params.id, changes);
      requestProjectsRefresh();
      router.back();
    } catch (error) {
      const fieldErrors = error instanceof AppApiError ? error.fieldErrors : undefined;
      if (fieldErrors) setErrors(fieldErrors);
      else {
        setToast({
          top: 45,
          text: parseApiError(error, t("Something went wrong")).message,
          type: "error",
          visible: true,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (person: ProjectPerson, type: ProjectRelationType) => {
    if (!params.id) return;
    const relatieId = projectPersonId(person);
    if (relatieId == null || relatieId === "") {
      setToast({
        top: 45,
        text: t("Something went wrong"),
        type: "error",
        visible: true,
      });
      return;
    }
    try {
      setRemovingId(`${type}-${relatieId}`);
      await removeProjectRelation(params.id, type, relatieId);
      requestProjectsRefresh();
      await load(true);
    } catch (error) {
      setToast({
        top: 45,
        text: parseApiError(error, t("Something went wrong")).message,
        type: "error",
        visible: true,
      });
    } finally {
      setRemovingId("");
    }
  };

  const photosByFolder = useMemo(() => {
    const groups: Record<string, ProjectFileItem[]> = {};
    collectProjectFolderNames(files).forEach((name) => {
      groups[name] = [];
    });
    files.photos.forEach((photo) => {
      const name = projectFolderName(photo) || t("Photos");
      if (!groups[name]) groups[name] = [];
      groups[name].push(photo);
    });
    return groups;
  }, [files, t]);

  const askRemoveFile = (type: "document" | "photo", file: ProjectFileItem) => {
    const fileId = projectFileId(file);
    if (fileId == null || fileId === "") {
      setToast({
        top: 45,
        text: t("Something went wrong"),
        type: "error",
        visible: true,
      });
      return;
    }
    setPendingFile({ type, file });
  };

  const handleRemoveFile = async () => {
    if (!params.id || !pendingFile) return;
    const fileId = projectFileId(pendingFile.file);
    if (fileId == null || fileId === "") return;
    const removedType = pendingFile.type;
    const removedId = String(fileId);
    try {
      setDeleteLoading(true);
      await removeProjectFile(params.id, fileId, removedType);
      setPendingFile(null);
      setFiles((prev) => ({
        folders: prev.folders,
        documents:
          removedType === "document"
            ? prev.documents.filter((item) => String(projectFileId(item) ?? "") !== removedId)
            : prev.documents,
        photos:
          removedType === "photo"
            ? prev.photos.filter((item) => String(projectFileId(item) ?? "") !== removedId)
            : prev.photos,
      }));
      const next = await fetchProjectFiles(params.id);
      setFiles((prev) => ({
        folders: next.folders.length ? next.folders : prev.folders,
        documents: next.documents,
        photos: next.photos,
      }));
    } catch (error) {
      const fieldErrors = error instanceof AppApiError ? error.fieldErrors : undefined;
      const text =
        fieldErrors?.project_id ||
        fieldErrors?.file_id ||
        fieldErrors?.type ||
        (error instanceof AppApiError
          ? error.message
          : parseApiError(error, t("Something went wrong")).message);
      setToast({
        top: 45,
        text,
        type: "error",
        visible: true,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderPeople = (
    title: string,
    people: ProjectPerson[] | undefined,
    type: ProjectRelationType
  ) => (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {people?.length ? (
        people.map((person, index) => {
          const relatieId = projectPersonId(person);
          const busy = removingId === `${type}-${relatieId}`;
          return (
            <View key={`${type}-${relatieId ?? index}`} style={styles.personRow}>
              <View style={styles.personAvatar}>
                <FallBackImage
                  source={person.profile_img ? { uri: person.profile_img } : undefined}
                  style={styles.personImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.personName} numberOfLines={1}>
                {person.display_name || "-"}
              </Text>
              <Pressable
                onPress={() => void handleRemove(person, type)}
                disabled={Boolean(removingId)}
                hitSlop={8}
                style={styles.removeBtn}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={Colors.dicline} />
                ) : (
                  <FallBackImage
                    source={Images.CloseIcon}
                    style={styles.removeIcon}
                    resizeMode="contain"
                  />
                )}
              </Pressable>
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>--</Text>
      )}
    </View>
  );

  const imageUri = image?.uri || detail?.project_image;

  if (!canUpdateProject) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Edit project")} onBack={() => router.back()} compact />

      {loading ? (
        <ApiFeedback loading />
      ) : apiError && !detail ? (
        <ApiFeedback error={apiError} onRetry={load} />
      ) : (
        <>
          <KeyboardAwareScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            enableOnAndroid
            enableAutomaticScroll
            extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable style={styles.imageWrap} onPress={() => setImageSheet(true)}>
              <FallBackImage
                source={imageUri ? { uri: imageUri } : undefined}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageBadge}>
                <FallBackImage source={Images.camera} style={styles.imageBadgeIcon} resizeMode="contain" />
              </View>
            </Pressable>

            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>
                {t("Project name")}
                <Text style={styles.required}> *</Text>
              </Text>
              <View style={[styles.inputWithIcon, errors.project_name ? styles.errorBorder : null]}>
                <FallBackImage source={Images.EditVector} style={styles.fieldIcon} resizeMode="contain" />
                <TextInput
                  style={styles.inputField}
                  value={projectName}
                  onChangeText={(text) => {
                    setProjectName(text);
                    if (errors.project_name) setErrors((prev) => ({ ...prev, project_name: "" }));
                  }}
                  placeholder={t("Project name")}
                  placeholderTextColor={Colors.placeholder}
                  multiline={false}
                />
              </View>
              {errors.project_name ? <Text style={styles.errorText}>{errors.project_name}</Text> : null}
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>{t("Budget")}</Text>
              <View style={styles.budgetRow}>
                <View style={[styles.inputWithIcon, styles.budgetInput, errors.budject ? styles.errorBorder : null]}>
                  <TextInput
                    style={styles.inputField}
                    value={budget}
                    onChangeText={(text) => {
                      setBudget(text.replace(/[^0-9.,]/g, ""));
                      if (errors.budject) setErrors((prev) => ({ ...prev, budject: "" }));
                    }}
                    placeholder={t("Budget")}
                    placeholderTextColor={Colors.placeholder}
                    keyboardType="decimal-pad"
                    multiline={false}
                  />
                </View>
                <Pressable
                  style={[styles.currencyBox, errors.budject_currency ? styles.errorBorder : null]}
                  onPress={() => setCurrencySheet(true)}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      !(selectedCurrency?.symbol || selectedCurrency?.code || currencyCode) &&
                        styles.placeholder,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedCurrency?.symbol || selectedCurrency?.code || currencyCode || t("Select")}
                  </Text>
                </Pressable>
              </View>
              {errors.budject ? <Text style={styles.errorText}>{errors.budject}</Text> : null}
            </View>

            {renderPeople(t("Owner"), detail?.relaties_owners, "owner")}
            {renderPeople(t("Contact"), detail?.connected_relaties, "contact")}
            {renderPeople(t("Member"), detail?.relaties_members, "member")}

            <View style={styles.block}>
              <Text style={styles.blockTitle}>{t("Documents")}</Text>
              {files.documents.length ? (
                <View style={styles.docGrid}>
                  {files.documents.map((item, index) => {
                    const fileId = projectFileId(item);
                    const removing =
                      deleteLoading &&
                      pendingFile?.type === "document" &&
                      String(projectFileId(pendingFile.file) ?? "") === String(fileId ?? "");
                    const thumb = projectFileThumb(item);
                    const title = projectFileShortLabel(item, 10);
                    const comment = projectFileComment(item);
                    return (
                      <View key={`doc-${fileId ?? index}`} style={styles.docCell}>
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
                          {canDeleteDocument ? (
                            <Pressable
                              onPress={() => askRemoveFile("document", item)}
                              disabled={deleteLoading}
                              hitSlop={6}
                              style={styles.photoRemove}
                            >
                              {removing ? (
                                <ActivityIndicator size="small" color={Colors.dicline} />
                              ) : (
                                <FallBackImage
                                  source={Images.CloseIcon}
                                  style={styles.photoRemoveIcon}
                                  resizeMode="contain"
                                />
                              )}
                            </Pressable>
                          ) : null}
                        </View>
                        {title ? (
                          <Text style={styles.docName} numberOfLines={1}>
                            {title}
                          </Text>
                        ) : null}
                        {comment ? (
                          <Text style={styles.fileComment} numberOfLines={2}>
                            {comment}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>{t("No documents")}</Text>
              )}
            </View>

            <View style={styles.block}>
              <Text style={styles.blockTitle}>{t("Photos")}</Text>
              {Object.keys(photosByFolder).length ? (
                Object.entries(photosByFolder).map(([name, photos]) => (
                  <View key={name} style={styles.folderBlock}>
                    <Text style={styles.folderTitle}>{name}</Text>
                    {photos.length ? (
                      <View style={styles.photoGrid}>
                        {photos.map((photo, index) => {
                          const url = projectFileUrl(photo);
                          const fileId = projectFileId(photo);
                          const title = projectFileShortLabel(photo, 10);
                          const comment = projectFileComment(photo);
                          const removing =
                            deleteLoading &&
                            pendingFile?.type === "photo" &&
                            String(projectFileId(pendingFile.file) ?? "") === String(fileId ?? "");
                          return (
                            <View key={`photo-${fileId ?? index}`} style={styles.photoCell}>
                              <View style={styles.photoThumb}>
                                {url ? (
                                  <Image source={{ uri: url }} style={styles.photo} />
                                ) : (
                                  <View style={styles.photoFallback}>
                                    <Text style={styles.emptyText} numberOfLines={2}>
                                      {projectFileLabel(photo, t("Photos"))}
                                    </Text>
                                  </View>
                                )}
                                {canDeletePhoto ? (
                                  <Pressable
                                    onPress={() => askRemoveFile("photo", photo)}
                                    disabled={deleteLoading}
                                    hitSlop={6}
                                    style={styles.photoRemove}
                                  >
                                    {removing ? (
                                      <ActivityIndicator size="small" color={Colors.dicline} />
                                    ) : (
                                      <FallBackImage
                                        source={Images.CloseIcon}
                                        style={styles.photoRemoveIcon}
                                        resizeMode="contain"
                                      />
                                    )}
                                  </Pressable>
                                ) : null}
                              </View>
                              {title ? (
                                <Text style={styles.docName} numberOfLines={1}>
                                  {title}
                                </Text>
                              ) : null}
                              {comment ? (
                                <Text style={styles.fileComment} numberOfLines={2}>
                                  {comment}
                                </Text>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>{t("No photos")}</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>{t("No photos")}</Text>
              )}
            </View>
          </KeyboardAwareScrollView>

          <View style={[styles.footer, { paddingBottom: footerPadding }]}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (saving || !hasChanges || !canUpdateProject) && styles.submitBtnDisabled,
              ]}
              onPress={() => {
                void handleSave();
              }}
              disabled={saving || !hasChanges || !canUpdateProject}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t("Save")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <SelectionBottomSheet
        visible={currencySheet}
        title={t("Select")}
        searchPlaceholder={t("Search")}
        confirmText={t("Done")}
        options={currencies.map((item) => ({
          id: item.code || "",
          label: [item.symbol, item.code].filter(Boolean).join(" ") || String(item.code || ""),
          raw: item,
        }))}
        selectedIds={currencyCode ? [currencyCode] : []}
        onClose={() => setCurrencySheet(false)}
        onConfirm={(selected) => {
          const next = selected[0]?.id;
          if (next != null && next !== "") setCurrencyCode(String(next));
          setCurrencySheet(false);
        }}
      />
      <ConfirmBottomSheet
        visible={Boolean(pendingFile)}
        title={t("Delete File")}
        message={t("Are you sure you want to delete this file?")}
        confirmText={t("Yes, Delete")}
        cancelText={t("Cancel")}
        loading={deleteLoading}
        onClose={() => {
          if (deleteLoading) return;
          setPendingFile(null);
        }}
        onConfirm={() => {
          void handleRemoveFile();
        }}
      />
      <OptionBottomSheet
        visible={imageSheet}
        title={t("Choose Camera or Gallery")}
        options={[
          { id: "camera", label: t("Camera") },
          { id: "gallery", label: t("Gallery") },
        ]}
        onClose={() => setImageSheet(false)}
        onConfirm={(option) => {
          setImageSheet(false);
          if (option.id === "camera" || option.id === "gallery") {
            void pickImage(option.id);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  contentContainer: {
    gap: 18,
    paddingBottom: 16,
  },
  imageWrap: {
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.gray,
    alignSelf: "flex-start",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBadgeIcon: {
    width: 12,
    height: 12,
    tintColor: Colors.white,
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
    height: 50,
    backgroundColor: Colors.white,
  },
  fieldIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.placeholder,
  },
  inputField: {
    flex: 1,
    height: 50,
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.black,
    padding: 0,
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  budgetInput: {
    flex: 1,
  },
  currencyBox: {
    width: 110,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  currencyText: {
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.black,
  },
  placeholder: {
    color: Colors.placeholder,
    fontFamily: FONTS.OutfitRegular,
  },
  block: {
    gap: 8,
  },
  blockTitle: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
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
    backgroundColor: Colors.gray,
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
    fontSize: 11,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.black,
  },
  fileComment: {
    width: "100%",
    textAlign: "center",
    fontSize: 10,
    lineHeight: 13,
    fontFamily: FONTS.OutfitRegular,
    color: Colors.placeholder,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.gray,
  },
  personImage: {
    width: "100%",
    height: "100%",
  },
  personName: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.black,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.diclinelite,
  },
  removeIcon: {
    width: 12,
    height: 12,
    tintColor: Colors.dicline,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.OutfitRegular,
    color: Colors.placeholder,
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 7,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: FONTS.OutfitSemiBold,
  },
  folderBlock: {
    gap: 8,
  },
  folderTitle: {
    fontSize: 13,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.black,
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
    backgroundColor: Colors.gray,
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
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.diclinelite,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveIcon: {
    width: 10,
    height: 10,
    tintColor: Colors.dicline,
  },
});
