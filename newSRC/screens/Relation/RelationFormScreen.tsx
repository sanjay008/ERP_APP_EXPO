import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import AuthInput from "../../Components/Auth/AuthInput";
import AuthSelect from "../../Components/Auth/AuthSelect";
import AuthButton from "../../Components/Auth/AuthButton";
import CountryPicker from "../../Components/Auth/CountryPicker";
import { GooglePlacesField } from "../../Components/GooglePlacesInput";
import AppDatePickerSheet from "../../Components/AppDatePickerSheet";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import ApiFeedback from "../../Components/ApiFeedback";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fieldInitialValue,
  fetchQuickRelationForm,
  findCountryCodeField,
  getQuickRelationFieldKind,
  isDutchWhatsAppValid,
  isQuickRelationFieldRequired,
  isRelationFlagOn,
  optionLabel,
  optionValue,
  parseQuickRelationItem,
  saveQuickRelation,
  type QuickRelationField,
  type QuickRelationFormData,
  type QuickRelationItem,
  type QuickRelationOption,
} from "../../services/relationService";
import { useAuthStore } from "../../store/authStore";
import { AppApiError } from "../../utils/apiError";
import { getApiErrorMessage } from "../../utils/validation";
import { mergeApiCountries, normalizeCallingCode } from "../../utils/countryListHelper";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../../utils/screenInsets";
import { authTypography } from "../../utils/authTypography";
import { AppColors } from "../../utils/theme";

function formatDate(value: Date) {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}-${month}-${year}`;
}

function parseDate(value: string) {
  if (!value) return new Date();
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) return new Date();
  return new Date(year, month - 1, day);
}

function toSheetOptions(options: QuickRelationOption[]): SheetOption[] {
  return options
    .map((option) => ({
      id: optionValue(option),
      label: optionLabel(option),
      raw: option,
    }))
    .filter((option) => option.id !== "" || option.label !== "");
}

function buildInitialValues(
  fields: QuickRelationField[],
  defaultCountryCode?: string
) {
  const values: Record<string, string> = {};
  fields.forEach((field) => {
    values[field.name] = fieldInitialValue(field);
  });

  const fallbackCode = normalizeCallingCode(defaultCountryCode);
  if (fallbackCode) {
    fields
      .filter((field) => String(field.name || "").toLowerCase().includes("country_code"))
      .forEach((field) => {
        if (!normalizeCallingCode(values[field.name])) {
          values[field.name] = fallbackCode;
        }
      });
  }

  return values;
}

export default function RelationFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();
  const params = useLocalSearchParams<{
    item?: string;
    category_id?: string;
    popup_text?: string;
    default_country_code?: string;
    is_employee_client?: string;
    is_customer_client?: string;
    is_employee_of_company?: string;
  }>();

  const item = useMemo<QuickRelationItem>(() => {
    const parsed = parseQuickRelationItem(params.item);
    return {
      ...(parsed ?? {}),
      category_id: parsed?.category_id ?? Number(params.category_id),
      popup_text: parsed?.popup_text || params.popup_text,
      default_country_code: parsed?.default_country_code || params.default_country_code,
      is_employee_client: parsed?.is_employee_client ?? params.is_employee_client,
      is_customer_client: parsed?.is_customer_client ?? params.is_customer_client,
      is_employee_of_company: parsed?.is_employee_of_company ?? params.is_employee_of_company,
    };
  }, [params]);

  const screenTitle = item.popup_text || item.title || t("Relation");
  const defaultCountryCode = normalizeCallingCode(item.default_country_code) || "31";
  const countries = useAuthStore((state) => state.countries);
  const mergedCountries = useMemo(() => mergeApiCountries(countries), [countries]);

  const [form, setForm] = useState<QuickRelationFormData | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [dateField, setDateField] = useState<string | null>(null);

  const loadForm = useCallback(async () => {
    if (item.id == null || item.id === "") {
      setForm(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      clearApiError();
      const response = await fetchQuickRelationForm(item.id);
      const data = response.data;
      setForm(data);
      setValues(buildInitialValues(data.fields, item.default_country_code));
      setErrors({});
    } catch (error) {
      captureApiError(error);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [captureApiError, clearApiError, item.default_country_code, item.id]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const visibleFields = useMemo(
    () => (form?.fields ?? []).filter((field) => getQuickRelationFieldKind(field) !== "hidden"),
    [form]
  );

  const setFieldValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const selectedSheetField = visibleFields.find((field) => field.name === activeField);
  const selectedSheetOptions = toSheetOptions(
    selectedSheetField?.options_key ? form?.options?.[selectedSheetField.options_key] ?? [] : []
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    (form?.fields ?? []).forEach((field) => {
      const kind = getQuickRelationFieldKind(field);
      if (kind === "hidden") return;
      const value = String(values[field.name] ?? "").trim();
      if (isQuickRelationFieldRequired(field) && !value) {
        nextErrors[field.name] = t("This field is required");
      }
      if (kind === "whatsapp") {
        const countryField = findCountryCodeField(form?.fields ?? [], field.name);
        const countryCode =
          normalizeCallingCode(countryField ? values[countryField.name] : defaultCountryCode) ||
          defaultCountryCode;
        const isNlPrefixOnly = countryCode === "31" && value === "06";
        if (isNlPrefixOnly && !isQuickRelationFieldRequired(field)) {
          return;
        }
        if (countryCode === "31" && value && !isDutchWhatsAppValid(value)) {
          nextErrors[field.name] = t(
            "A Dutch WhatsApp number must be 10 digits starting with 0."
          );
        }
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!form || item.id == null || item.id === "") return;
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload: Record<string, string> = {};
      form.fields.forEach((field) => {
        const kind = getQuickRelationFieldKind(field);
        const raw = values[field.name] ?? "";
        const countryField = findCountryCodeField(form.fields, field.name);
        const countryCode =
          normalizeCallingCode(countryField ? values[countryField.name] : defaultCountryCode) ||
          defaultCountryCode;
        payload[field.name] =
          kind === "whatsapp" && countryCode === "31" && raw.trim() === "06" && !isQuickRelationFieldRequired(field)
            ? ""
            : raw;
      });

      const response = await saveQuickRelation(item.id, payload);
      const createdUser = isRelationFlagOn(response.data?.user_created);
      setToast({
        top: 45,
        text: createdUser
          ? t("User created. A welcome email was sent.")
          : response.message || t("Relation saved"),
        type: "success",
        visible: true,
      });
      router.back();
    } catch (error) {
      if (error instanceof AppApiError && error.fieldErrors) {
        setErrors(error.fieldErrors);
      }
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderPhoneField = (field: QuickRelationField, kind: "phone" | "whatsapp") => {
    const countryField = findCountryCodeField(form?.fields ?? [], field.name);
    const countryCode =
      normalizeCallingCode(countryField ? values[countryField.name] : defaultCountryCode) ||
      defaultCountryCode;

    return (
      <View key={field.name} style={styles.field}>
        <Text style={authTypography.label}>
          {field.label || field.name}
          {isQuickRelationFieldRequired(field) ? (
            <Text style={authTypography.required}> *</Text>
          ) : null}
        </Text>
        <CountryPicker
          value={values[field.name] || ""}
          setValue={(text) => setFieldValue(field.name, text)}
          countryCode={countryCode}
          countries={mergedCountries}
          placeholder={
            kind === "whatsapp" ? t("Enter whatsapp number") : t("Enter phone number")
          }
          onSelect={(country) => {
            if (countryField) {
              setFieldValue(countryField.name, country.countrycode);
            }
          }}
        />
        {errors[field.name] ? (
          <Text style={[authTypography.error, styles.errorSpacing]}>{errors[field.name]}</Text>
        ) : null}
      </View>
    );
  };

  const renderField = (field: QuickRelationField) => {
    const kind = getQuickRelationFieldKind(field);
    const required = isQuickRelationFieldRequired(field);
    const label = field.label || field.name;
    const value = values[field.name] || "";
    const error = errors[field.name];

    if (kind === "whatsapp" || kind === "phone") {
      return renderPhoneField(field, kind);
    }

    if (kind === "address") {
      return (
        <GooglePlacesField
          key={field.name}
          label={label}
          required={required}
          value={value}
          onChangeText={(text) => setFieldValue(field.name, text)}
          placeholder={t("Enter address")}
          error={error}
          containerStyle={{ marginBottom: 0 }}
        />
      );
    }

    if (kind === "select") {
      const options = toSheetOptions(form?.options?.[field.options_key || ""] ?? []);
      const selected = options.find((option) => String(option.id) === value);
      return (
        <AuthSelect
          key={field.name}
          label={label}
          value={selected?.label || ""}
          placeholder={t("Select")}
          error={error}
          onPress={() => setActiveField(field.name)}
        />
      );
    }

    if (kind === "date") {
      return (
        <View key={field.name} style={styles.field}>
          <Text style={authTypography.label}>
            {label}
            {required ? <Text style={authTypography.required}> *</Text> : null}
          </Text>
          <Pressable
            style={[styles.dateField, error ? styles.dateFieldError : null]}
            onPress={() => setDateField(field.name)}
          >
            <Ionicons name="calendar-outline" size={18} color={AppColors.subtitle} />
            <Text style={[authTypography.input, styles.dateText, !value && authTypography.placeholder]}>
              {value || t("Select date")}
            </Text>
          </Pressable>
          {error ? <Text style={[authTypography.error, styles.errorSpacing]}>{error}</Text> : null}
        </View>
      );
    }

    return (
      <AuthInput
        key={field.name}
        label={label}
        required={required}
        value={value}
        onChangeText={(text) => {
          if (kind === "number") {
            setFieldValue(field.name, text.replace(/[^0-9]/g, ""));
            return;
          }
          setFieldValue(field.name, text);
        }}
        placeholder={label}
        error={error}
        keyboardType={kind === "email" ? "email-address" : kind === "number" ? "number-pad" : "default"}
        autoCapitalize={kind === "email" ? "none" : "sentences"}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={screenTitle} onBack={() => router.back()} />

      {loading ? (
        <ApiFeedback loading />
      ) : apiError && !form ? (
        <ApiFeedback error={apiError} onRetry={loadForm} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={getKeyboardAvoidBehavior()}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
            keyboardShouldPersistTaps="handled"
          >
            {visibleFields.map(renderField)}
            <AuthButton
              title={submitting ? t("Loading...") : t("Save")}
              onPress={handleSave}
              disabled={submitting || !form}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <SelectionBottomSheet
        visible={Boolean(selectedSheetField)}
        title={selectedSheetField?.label || t("Select")}
        searchPlaceholder={t("Search")}
        confirmText={t("Done")}
        options={selectedSheetOptions}
        selectedIds={selectedSheetField ? [values[selectedSheetField.name] || ""] : []}
        onClose={() => setActiveField(null)}
        onConfirm={(selected) => {
          if (selectedSheetField) {
            setFieldValue(selectedSheetField.name, selected[0] ? String(selected[0].id) : "");
          }
          setActiveField(null);
        }}
      />
      <AppDatePickerSheet
        visible={Boolean(dateField)}
        value={parseDate(dateField ? values[dateField] || "" : "")}
        onConfirm={(date) => {
          if (dateField) setFieldValue(dateField, formatDate(date));
          setDateField(null);
        }}
        onClose={() => setDateField(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FB" },
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  field: { marginBottom: 0 },
  errorSpacing: { marginTop: 6 },
  dateField: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: AppColors.white,
  },
  dateFieldError: { borderColor: "#EF4444" },
  dateText: { flex: 1, paddingVertical: 12 },
});
