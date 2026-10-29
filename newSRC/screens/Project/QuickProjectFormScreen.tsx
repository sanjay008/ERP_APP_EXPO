import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import FallBackImage from "../../Components/FallBackImage";
import { RegisterBackContext } from "../../constants/GoBackContext";
import {
  fetchQuickCreateForm,
  requestProjectsRefresh,
  saveQuickCreateProject,
  type QuickCreateCompany,
  type QuickCreatePerson,
} from "../../services/projectService";
import { AppApiError, parseApiError, type ParsedApiError } from "../../utils/apiError";
import { useScreenInsets } from "../../utils/screenInsets";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";

type SheetType = "company" | "person" | null;

function optionId(value: string | number) {
  return String(value);
}

export default function QuickProjectFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, footerPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const [companies, setCompanies] = useState<QuickCreateCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<ParsedApiError | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [companyEnabled, setCompanyEnabled] = useState(false);
  const [createOrder, setCreateOrder] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [personId, setPersonId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [orderTitle, setOrderTitle] = useState("");
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);

  const selectedCompany = useMemo(
    () => companies.find((item) => optionId(item.id) === companyId),
    [companies, companyId]
  );
  const persons = selectedCompany?.persons ?? [];
  const selectedPerson = useMemo(
    () => persons.find((item) => optionId(item.id) === personId),
    [persons, personId]
  );

  const companyOptions: SheetOption[] = useMemo(
    () => companies.map((item) => ({ id: item.id, label: item.name, raw: item })),
    [companies]
  );
  const personOptions: SheetOption[] = useMemo(
    () => persons.map((item) => ({ id: item.id, label: item.name, raw: item })),
    [persons]
  );

  const loadForm = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const response = await fetchQuickCreateForm();
      setCompanies(response.data.companies);
    } catch (error) {
      setApiError(parseApiError(error, t("Something went wrong")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const applySuggestedName = (name: string) => {
    const next = name.trim();
    if (!next) return;
    setProjectName(next);
    setErrors((prev) => ({ ...prev, project_name: "", ...(createOrder ? { order_title: "" } : {}) }));
    if (createOrder) setOrderTitle(next);
  };

  const onToggleCompany = (value: boolean) => {
    setCompanyEnabled(value);
    setErrors((prev) => ({ ...prev, company_id: "", person_id: "" }));
    if (!value) {
      setCompanyId("");
      setPersonId("");
    }
  };

  const onToggleOrder = (value: boolean) => {
    setCreateOrder(value);
    if (value) {
      const next = projectName.trim() || selectedPerson?.name || selectedCompany?.name || "";
      if (next) setOrderTitle(next);
    } else {
      setOrderTitle("");
      setErrors((prev) => ({ ...prev, order_title: "" }));
    }
  };

  const onSelectCompany = (company: QuickCreateCompany) => {
    setCompanyId(optionId(company.id));
    setPersonId("");
    setErrors((prev) => ({
      ...prev,
      company_id: "",
      person_id: company.persons.length ? "" : t("This field is required"),
    }));
    applySuggestedName(company.name);
  };

  const onSelectPerson = (person: QuickCreatePerson) => {
    setPersonId(optionId(person.id));
    setErrors((prev) => ({ ...prev, person_id: "" }));
    applySuggestedName(person.name);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!projectName.trim()) {
      next.project_name = t("This field is required");
    }
    if (companyEnabled && !companyId) {
      next.company_id = t("This field is required");
    }
    if (companyEnabled && !personId) {
      next.person_id = t("This field is required");
    }
    if (createOrder && !orderTitle.trim()) {
      next.order_title = t("This field is required");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const canSubmit =
    Boolean(projectName.trim()) &&
    (!createOrder || Boolean(orderTitle.trim())) &&
    (!companyEnabled || Boolean(companyId && personId));

  const handleSave = async () => {
    if (!canSubmit || !validate()) return;

    try {
      setSubmitting(true);
      const payload: Parameters<typeof saveQuickCreateProject>[0] = {
        company_enabled: companyEnabled ? 1 : 0,
        project_name: projectName.trim(),
        create_order: createOrder ? 1 : 0,
      };

      if (companyEnabled) {
        payload.company_id = companyId;
        payload.person_id = personId;
      }
      if (createOrder) {
        payload.order_title = orderTitle.trim();
      }

      const response = await saveQuickCreateProject(payload);
      requestProjectsRefresh();
      setToast({
        top: 45,
        text: response.message || t("Project created"),
        type: "success",
        visible: true,
      });
      router.back();
    } catch (error) {
      const fieldErrors = error instanceof AppApiError ? error.fieldErrors : undefined;
      if (fieldErrors) setErrors(fieldErrors);
      if (!fieldErrors) {
        setToast({
          top: 45,
          text: parseApiError(error, t("Something went wrong")).message,
          type: "error",
          visible: true,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderTextField = (
    name: "project_name" | "order_title",
    label: string,
    value: string,
    onChange: (text: string) => void
  ) => (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>
        {label}
        <Text style={styles.required}> *</Text>
      </Text>
      <View style={[styles.inputWithIcon, errors[name] ? styles.errorBorder : null]}>
        <FallBackImage source={Images.EditVector} style={styles.fieldIcon} resizeMode="contain" />
        <TextInput
          style={styles.inputField}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
          }}
          placeholder={label}
          placeholderTextColor={Colors.placeholder}
          multiline={false}
          numberOfLines={1}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>
      {errors[name] ? <Text style={styles.errorText}>{errors[name]}</Text> : null}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Quick Project")} onBack={() => router.back()} compact />

      {loading ? (
        <ApiFeedback loading />
      ) : apiError ? (
        <ApiFeedback error={apiError} onRetry={loadForm} />
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
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("Bedrijf")}</Text>
              <Switch
                value={companyEnabled}
                onValueChange={onToggleCompany}
                trackColor={{ false: "#D1D5DB", true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            {companyEnabled ? (
              <>
                <FormSelectField
                  label={t("Company")}
                  required
                  placeholder={t("Select company")}
                  value={selectedCompany?.name || ""}
                  error={errors.company_id}
                  onPress={() => setActiveSheet("company")}
                />
                {selectedCompany ? (
                  <FormSelectField
                    label={t("Person")}
                    required
                    placeholder={t("Select person")}
                    value={selectedPerson?.name || ""}
                    error={errors.person_id}
                    disabled={persons.length === 0}
                    onPress={() => setActiveSheet("person")}
                  />
                ) : null}
              </>
            ) : null}

            {renderTextField("project_name", t("Project name"), projectName, setProjectName)}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("Create order")}</Text>
              <Switch
                value={createOrder}
                onValueChange={onToggleOrder}
                trackColor={{ false: "#D1D5DB", true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            {createOrder
              ? renderTextField("order_title", t("Order title"), orderTitle, setOrderTitle)
              : null}
          </KeyboardAwareScrollView>

          <View style={[styles.footer, { paddingBottom: footerPadding }]}>
            <TouchableOpacity
              style={[styles.submitBtn, (submitting || !canSubmit) && styles.submitBtnDisabled]}
              onPress={() => {
                void handleSave();
              }}
              disabled={submitting || !canSubmit}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t("Save")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <SelectionBottomSheet
        visible={activeSheet === "company"}
        title={t("Select company")}
        searchPlaceholder={t("Search")}
        confirmText={t("Done")}
        options={companyOptions}
        selectedIds={companyId ? [companyId] : []}
        onClose={() => setActiveSheet(null)}
        onConfirm={(selected) => {
          const company = selected[0]?.raw as QuickCreateCompany | undefined;
          if (company) onSelectCompany(company);
          setActiveSheet(null);
        }}
      />
      <SelectionBottomSheet
        visible={activeSheet === "person"}
        title={t("Select person")}
        searchPlaceholder={t("Search")}
        confirmText={t("Done")}
        options={personOptions}
        selectedIds={personId ? [personId] : []}
        onClose={() => setActiveSheet(null)}
        onConfirm={(selected) => {
          const person = selected[0]?.raw as QuickCreatePerson | undefined;
          if (person) onSelectPerson(person);
          setActiveSheet(null);
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
  switchRow: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
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
    overflow: "hidden",
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
    margin: 0,
    includeFontPadding: false,
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
