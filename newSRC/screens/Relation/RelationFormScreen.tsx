import React, { useContext, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import BoxIcon from "../../Components/BoxIcon";
import FormSelectField from "../../Components/FormSelectField";
import CountryPicker from "../../Components/Auth/CountryPicker";
import GooglePlacesInput, { type GooglePlacePrediction } from "../../Components/GooglePlacesInput";
import AppDatePickerSheet from "../../Components/AppDatePickerSheet";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import ApiFeedback from "../../Components/ApiFeedback";
import FallBackImage from "../../Components/FallBackImage";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useAppData } from "../../context/AppDataContext";
import { hasPermission } from "../../utils/permissionFlags";
import {
  findCountryCodeField,
  formatDisplayDate,
  getQuickRelationFieldKind,
  isQuickRelationFieldRequired,
  optionLabel,
  optionValue,
  parseRelationDate,
  toDisplayDate,
  type QuickRelationField,
  type QuickRelationOption,
} from "../../services/relationService";
import { useRelationFormStore } from "../../store/relationFormStore";
import { useAuthStore } from "../../store/authStore";
import { mergeApiCountries, normalizeCallingCode } from "../../utils/countryListHelper";
import { useKeyboardHeight } from "../../utils/screenInsets";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { listScreenStyles } from "../../utils/listScreenStyles";

function toSheetOptions(options: QuickRelationOption[]): SheetOption[] {
  return options
    .map((option) => ({
      id: optionValue(option),
      label: optionLabel(option),
      raw: option,
    }))
    .filter((option) => option.id !== "" || option.label !== "");
}

function fieldIcon(field: QuickRelationField) {
  const kind = getQuickRelationFieldKind(field);
  const name = String(field.name || "").toLowerCase();
  if (kind === "email") return Images.ConnectionMail;
  if (kind === "address") return Images.ConnectionLocation;
  if (kind === "date") return Images.date;
  if (kind === "phone" || kind === "whatsapp") return Images.ConnectionPhone;
  if (name.includes("bedrijf") || name.includes("company")) return Images.BagVector;
  if (name.includes("voornaam") || name.includes("achternaam") || name.includes("name")) {
    return Images.userVector;
  }
  if (kind === "number") return Images.CalendarVector;
  return Images.EditVector;
}

export default function RelationFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { permissions } = useAppData();
  const { setToast } = useContext(RegisterBackContext);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const params = useLocalSearchParams<{
    item?: string;
    category_id?: string;
    popup_text?: string;
    default_country_code?: string;
    is_employee_client?: string;
    is_customer_client?: string;
    is_employee_of_company?: string;
  }>();

  const canReadRelations = hasPermission(permissions, "quick_relations_mobile", "read");
  const canCreateRelations = hasPermission(permissions, "quick_relations_mobile", "create");

  const item = useRelationFormStore((state) => state.item);
  const form = useRelationFormStore((state) => state.form);
  const values = useRelationFormStore((state) => state.values);
  const errors = useRelationFormStore((state) => state.errors);
  const loading = useRelationFormStore((state) => state.loading);
  const submitting = useRelationFormStore((state) => state.submitting);
  const apiError = useRelationFormStore((state) => state.apiError);
  const activeField = useRelationFormStore((state) => state.activeField);
  const dateField = useRelationFormStore((state) => state.dateField);
  const setItemFromParams = useRelationFormStore((state) => state.setItemFromParams);
  const loadForm = useRelationFormStore((state) => state.loadForm);
  const setFieldValue = useRelationFormStore((state) => state.setFieldValue);
  const applyGoogleAddress = useRelationFormStore((state) => state.applyGoogleAddress);
  const setActiveField = useRelationFormStore((state) => state.setActiveField);
  const setDateField = useRelationFormStore((state) => state.setDateField);
  const save = useRelationFormStore((state) => state.save);
  const reset = useRelationFormStore((state) => state.reset);

  const countries = useAuthStore((state) => state.countries);
  const mergedCountries = useMemo(() => mergeApiCountries(countries), [countries]);
  const defaultCountryCode = normalizeCallingCode(item?.default_country_code) || "31";
  const screenTitle = item?.popup_text || item?.title || t("Relation");
  const itemId = item?.id;
  const badge = item?.category_name || item?.relation_type_name || "";

  const visibleFields = useMemo(
    () => (form?.fields ?? []).filter((field) => getQuickRelationFieldKind(field) !== "hidden"),
    [form]
  );
  const selectedSheetField = visibleFields.find((field) => field.name === activeField);
  const selectedSheetOptions = toSheetOptions(
    selectedSheetField?.options_key ? form?.options?.[selectedSheetField.options_key] ?? [] : []
  );

  const screenHeight = Dimensions.get("screen").height;
  const windowHeight = Dimensions.get("window").height;
  const windowAlreadyShrunk = Platform.OS === "android" && screenHeight - windowHeight > 80;
  const keyboardLift = windowAlreadyShrunk ? 0 : keyboardHeight;

  useEffect(() => {
    setItemFromParams({
      item: Array.isArray(params.item) ? params.item[0] : params.item,
      category_id: Array.isArray(params.category_id) ? params.category_id[0] : params.category_id,
      popup_text: Array.isArray(params.popup_text) ? params.popup_text[0] : params.popup_text,
      default_country_code: Array.isArray(params.default_country_code)
        ? params.default_country_code[0]
        : params.default_country_code,
      is_employee_client: Array.isArray(params.is_employee_client)
        ? params.is_employee_client[0]
        : params.is_employee_client,
      is_customer_client: Array.isArray(params.is_customer_client)
        ? params.is_customer_client[0]
        : params.is_customer_client,
      is_employee_of_company: Array.isArray(params.is_employee_of_company)
        ? params.is_employee_of_company[0]
        : params.is_employee_of_company,
    });
  }, [
    params.item,
    params.category_id,
    params.popup_text,
    params.default_country_code,
    params.is_employee_client,
    params.is_customer_client,
    params.is_employee_of_company,
    setItemFromParams,
  ]);

  useEffect(() => {
    if (itemId == null || itemId === "") return;
    void loadForm();
  }, [itemId, loadForm]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  if (!canReadRelations || !canCreateRelations) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  const handleSave = async () => {
    if (!canCreateRelations) return;
    const result = await save();
    if (result.ok) {
      setToast({
        top: 45,
        text: result.userCreated ? t("User created. A welcome email was sent.") : result.message,
        type: "success",
        visible: true,
      });
      router.back();
      return;
    }
    if (result.reason === "validation") return;
    setToast({
      top: 45,
      text: result.message,
      type: "error",
      visible: true,
    });
  };

  const renderLabel = (field: QuickRelationField) => (
    <Text style={styles.label}>
      {field.label || field.name}
      {isQuickRelationFieldRequired(field) ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );

  const renderPhoneField = (field: QuickRelationField, kind: "phone" | "whatsapp") => {
    const countryField = findCountryCodeField(form?.fields ?? [], field.name);
    const countryCode =
      normalizeCallingCode(countryField ? values[countryField.name] : defaultCountryCode) ||
      defaultCountryCode;

    return (
      <View key={field.name} style={styles.fieldWrapper}>
        {renderLabel(field)}
        <CountryPicker
          value={values[field.name] || ""}
          setValue={(text) => setFieldValue(field.name, text)}
          countryCode={countryCode}
          countries={mergedCountries}
          placeholder={kind === "whatsapp" ? t("Enter whatsapp number") : t("Enter phone number")}
          containerStyle={[styles.phoneBox, errors[field.name] ? styles.errorBorder : null]}
          onSelect={(country) => {
            if (countryField) setFieldValue(countryField.name, country.countrycode);
          }}
        />
        {errors[field.name] ? <Text style={styles.errorText}>{errors[field.name]}</Text> : null}
      </View>
    );
  };

  const renderField = (field: QuickRelationField) => {
    const kind = getQuickRelationFieldKind(field);
    const required = isQuickRelationFieldRequired(field);
    const label = field.label || field.name;
    const value = values[field.name] || "";
    const error = errors[field.name];
    const icon = fieldIcon(field);

    if (kind === "whatsapp" || kind === "phone") {
      return renderPhoneField(field, kind);
    }

    if (kind === "address") {
      return (
        <View key={field.name} style={styles.fieldWrapper}>
          {renderLabel(field)}
          <GooglePlacesInput
            value={value}
            onChangeText={(text) => setFieldValue(field.name, text)}
            onSelect={(place: GooglePlacePrediction) => {
              void applyGoogleAddress(field.name, place);
            }}
            placeholder={t("Enter address")}
            showIcon
            inputContainerStyle={[styles.inputWithIcon, error ? styles.errorBorder : null]}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      );
    }

    if (kind === "select") {
      const options = toSheetOptions(form?.options?.[field.options_key || ""] ?? []);
      const selected = options.find((option) => String(option.id) === value);
      return (
        <FormSelectField
          key={field.name}
          label={label}
          required={required}
          placeholder={t("Select")}
          value={selected?.label || ""}
          error={error}
          onPress={() => setActiveField(field.name)}
        />
      );
    }

    if (kind === "date") {
      return (
        <View key={field.name} style={styles.fieldWrapper}>
          {renderLabel(field)}
          <Pressable
            style={[styles.inputWithIcon, error ? styles.errorBorder : null]}
            onPress={() => setDateField(field.name)}
          >
            <FallBackImage source={Images.date} style={styles.fieldIcon} resizeMode="contain" />
            <Text style={[styles.inputField, !value && styles.placeholder]}>
              {value ? toDisplayDate(value) : t("Select date")}
            </Text>
          </Pressable>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      );
    }

    const isYear =
      kind === "number" &&
      (field.name.toLowerCase().includes("year") || field.name.toLowerCase().includes("jaar"));

    return (
      <View key={field.name} style={styles.fieldWrapper}>
        {renderLabel(field)}
        <View style={[styles.inputWithIcon, error ? styles.errorBorder : null]}>
          <FallBackImage source={icon} style={styles.fieldIcon} resizeMode="contain" />
          <TextInput
            style={styles.inputField}
            value={value}
            onChangeText={(text) => {
              if (kind === "number") {
                setFieldValue(field.name, text.replace(/[^0-9]/g, "").slice(0, isYear ? 4 : 12));
                return;
              }
              setFieldValue(field.name, text);
            }}
            placeholder={label}
            placeholderTextColor={Colors.placeholder}
            keyboardType={kind === "email" ? "email-address" : kind === "number" ? "number-pad" : "default"}
            autoCapitalize={kind === "email" ? "none" : "sentences"}
            autoCorrect={false}
            autoComplete={kind === "email" ? "email" : "off"}
            multiline={false}
            numberOfLines={1}
            textAlignVertical="center"
            underlineColorAndroid="transparent"
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <BoxIcon Icon={Images.BackIcon} onPress={() => router.back()} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {screenTitle}
        </Text>
        {badge ? (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {loading ? (
        <ApiFeedback loading />
      ) : apiError && !form ? (
        <ApiFeedback error={apiError} onRetry={loadForm} />
      ) : (
        <>
          <View style={styles.body}>
            <KeyboardAwareScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              enableOnAndroid
              enableAutomaticScroll
              extraScrollHeight={Platform.OS === "ios" ? 20 : 100}
              keyboardOpeningTime={180}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {visibleFields.map(renderField)}
            </KeyboardAwareScrollView>
          </View>

          <View
            style={[
              styles.footer,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                marginBottom: keyboardLift,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={() => {
                void handleSave();
              }}
              disabled={submitting || !form}
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
        value={parseRelationDate(dateField ? values[dateField] || "" : "")}
        onConfirm={(date) => {
          if (dateField) setFieldValue(dateField, formatDisplayDate(date));
          setDateField(null);
        }}
        onClose={() => setDateField(null)}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    zIndex: 20,
    elevation: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
    marginLeft: 10,
  },
  headerSpacer: {
    width: 40,
  },
  statusBadge: {
    ...listScreenStyles.statusBadge,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 130,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: FONTS.OutfitSemiBold,
    textAlign: "center",
  },
  body: {
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
    flexGrow: 0,
  },
  fieldWrapper: {
    gap: 8,
    flexGrow: 0,
    flexShrink: 0,
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
  phoneBox: {
    borderRadius: 8,
    borderColor: Colors.border,
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
  placeholder: {
    color: Colors.placeholder,
    fontFamily: FONTS.OutfitRegular,
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
