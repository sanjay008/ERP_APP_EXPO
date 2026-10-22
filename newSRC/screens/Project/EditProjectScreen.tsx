import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import SelectionBottomSheet from "../../Components/SelectionBottomSheet";
import OptionBottomSheet from "../../Components/OptionBottomSheet";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import FallBackImage from "../../Components/FallBackImage";
import { RegisterBackContext } from "../../constants/GoBackContext";
import {
  fetchProjectDetails,
  projectPersonId,
  removeProjectRelation,
  requestProjectsRefresh,
  updateProject,
  type ProjectDetail,
  type ProjectImageFile,
  type ProjectPerson,
  type ProjectRelationType,
} from "../../services/projectService";
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
  const { top, footerPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);
  const params = useLocalSearchParams<{ id?: string }>();

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
  const [currencySheet, setCurrencySheet] = useState(false);
  const [imageSheet, setImageSheet] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!params.id) return;
    try {
      if (!silent) setLoading(true);
      setApiError(null);
      const [detailsRes, currencyRes] = await Promise.all([
        fetchProjectDetails(params.id),
        fetchCompanyCurrencies(),
      ]);
      const next = Array.isArray(detailsRes?.data) ? detailsRes.data[0] : null;
      if (!next) throw new Error(t("Something went wrong"));
      setDetail(next);
      setProjectName(next.project_name || "");
      setBudget(next.budject == null ? "" : String(next.budject));
      setCurrencyCode(String(next.budject_currency_data?.code || next.budject_currency || ""));
      setImage(null);
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
    if (!params.id || !detail) return;
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

    if (!Object.keys(changes).length) {
      router.back();
      return;
    }

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
    if (relatieId == null || relatieId === "") return;
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
              {relatieId != null && relatieId !== "" ? (
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
              ) : null}
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>--</Text>
      )}
    </View>
  );

  const imageUri = image?.uri || detail?.project_image;

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

            {renderPeople(t("Customer"), detail?.relaties_owners, "owner")}
            {renderPeople(t("Contact"), detail?.connected_relaties, "contact")}
            {renderPeople(t("Executor"), detail?.relaties_members, "member")}
          </KeyboardAwareScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(footerPadding, 12) }]}>
            <TouchableOpacity
              style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
              onPress={() => {
                void handleSave();
              }}
              disabled={saving}
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
    paddingBottom: 30,
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
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.diclinelite,
  },
  removeIcon: {
    width: 10,
    height: 10,
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
