import React, { useEffect, useMemo, useState } from "react";
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
import SelectionSheet from "../../Components/Auth/SelectionSheet";
import { GooglePlacesField } from "../../Components/GooglePlacesInput";
import AppDatePickerSheet from "../../Components/AppDatePickerSheet";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import {
  isRelationFlagOn,
  parseQuickRelationItem,
  type QuickRelationItem,
} from "../../services/relationService";
import { useAuthStore } from "../../store/authStore";
import {
  findCountryByCode,
  mergeApiCountries,
  normalizeCallingCode,
} from "../../utils/countryListHelper";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../../utils/screenInsets";
import { authTypography } from "../../utils/authTypography";
import { AppColors } from "../../utils/theme";

type SheetKey = "salutation" | "client" | "company" | "country" | null;

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

function resolvePhoneCountryCode(item: QuickRelationItem | null) {
  const raw = item?.default_country_code;
  const digits = normalizeCallingCode(raw);
  if (digits) return digits;
  return "";
}

export default function RelationFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
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

  const categoryId = Number(item.category_id);
  const showClient = isRelationFlagOn(item.is_employee_client) || isRelationFlagOn(item.is_customer_client);
  const showCompany = isRelationFlagOn(item.is_employee_of_company);
  const screenTitle = item.popup_text || item.title || t("Relation");

  const countries = useAuthStore((state) => state.countries);
  const mergedCountries = useMemo(() => mergeApiCountries(countries), [countries]);

  const defaultPhoneCode =
    resolvePhoneCountryCode(item) ||
    findCountryByCode(mergedCountries, item.default_country_code)?.countrycode ||
    "31";

  const defaultCountry = findCountryByCode(mergedCountries, defaultPhoneCode);

  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [countryName, setCountryName] = useState(defaultCountry?.name || "");
  const [countryCca2, setCountryCca2] = useState(defaultCountry?.cca2 || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(defaultPhoneCode);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clientLabel, setClientLabel] = useState("");
  const [companyLabel, setCompanyLabel] = useState("");
  const [houseName, setHouseName] = useState("");
  const [relationNumber, setRelationNumber] = useState("");
  const [objectNumber, setObjectNumber] = useState("");
  const [typeOfHouse, setTypeOfHouse] = useState("");
  const [project, setProject] = useState("");
  const [kindOfHouse, setKindOfHouse] = useState("");
  const [model, setModel] = useState("");
  const [constructionType, setConstructionType] = useState("");
  const [year, setYear] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [fuel, setFuel] = useState("");
  const [apkDate, setApkDate] = useState("");
  const [mileage, setMileage] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [color, setColor] = useState("");
  const [driver, setDriver] = useState("");
  const [activeSheet, setActiveSheet] = useState<SheetKey>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    const match = findCountryByCode(mergedCountries, defaultPhoneCode);
    if (!match) return;
    setCountryName((current) => current || match.name);
    setCountryCca2((current) => current || match.cca2);
    setPhoneCountryCode((current) => normalizeCallingCode(current) || match.countrycode);
  }, [mergedCountries, defaultPhoneCode]);

  const salutationOptions = useMemo(
    () => [
      { label: t("fam"), value: t("fam") },
      { label: t("dhr"), value: t("dhr") },
      { label: t("mevr"), value: t("mevr") },
    ],
    [t]
  );

  const countryOptions = useMemo<SheetOption[]>(
    () =>
      mergedCountries.map((country) => ({
        id: country.cca2,
        label: country.name,
        raw: country,
      })),
    [mergedCountries]
  );

  const renderPhoneField = (label: string, placeholder: string) => (
    <View style={styles.field}>
      <Text style={authTypography.label}>{label}</Text>
      <CountryPicker
        value={phone}
        setValue={setPhone}
        countryCode={phoneCountryCode}
        countries={mergedCountries}
        placeholder={placeholder}
        onSelect={(country) => setPhoneCountryCode(country.countrycode)}
      />
    </View>
  );

  const renderCountryField = () => (
    <AuthSelect
      label={t("Country")}
      value={countryName}
      placeholder={t("Select country")}
      onPress={() => setActiveSheet("country")}
    />
  );

  const renderCompanyFields = () => (
    <>
      <AuthInput
        label={t("Company Name")}
        value={companyName}
        onChangeText={setCompanyName}
        placeholder={t("Enter company name")}
      />
      <GooglePlacesField
        label={t("Address")}
        value={address}
        onChangeText={setAddress}
        placeholder={t("Enter address")}
        containerStyle={{ marginBottom: 0 }}
      />
      {renderCountryField()}
      {renderPhoneField(t("Phone Number"), t("Enter phone number"))}
      <AuthInput
        label={t("Email Address")}
        value={email}
        onChangeText={setEmail}
        placeholder={t("Enter email address")}
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </>
  );

  const renderPersonFields = () => (
    <>
      <AuthSelect
        label={t("Salutation")}
        value={salutation}
        placeholder={t("Select salutation")}
        onPress={() => setActiveSheet("salutation")}
      />
      <AuthInput
        label={t("First Name")}
        value={firstName}
        onChangeText={setFirstName}
        placeholder={t("Enter first name")}
      />
      <AuthInput
        label={t("Last Name")}
        value={lastName}
        onChangeText={setLastName}
        placeholder={t("Enter last name")}
      />
      <GooglePlacesField
        label={t("Address")}
        value={address}
        onChangeText={setAddress}
        placeholder={t("Enter address")}
        containerStyle={{ marginBottom: 0 }}
      />
      {renderCountryField()}
      {renderPhoneField(t("WhatsApp Number"), t("Enter whatsapp number"))}
      <AuthInput
        label={t("Email Address")}
        value={email}
        onChangeText={setEmail}
        placeholder={t("Enter email address")}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {showClient ? (
        <AuthSelect
          label={t("Client")}
          value={clientLabel}
          placeholder={t("Select client")}
          onPress={() => setActiveSheet("client")}
        />
      ) : null}
      {showCompany ? (
        <AuthSelect
          label={t("Company")}
          value={companyLabel}
          placeholder={t("Select company")}
          onPress={() => setActiveSheet("company")}
        />
      ) : null}
    </>
  );

  const renderObjectFields = () => (
    <>
      <AuthInput
        label={t("House name")}
        value={houseName}
        onChangeText={setHouseName}
        placeholder={t("Enter house name")}
      />
      <AuthInput
        label={t("Relation number")}
        value={relationNumber}
        onChangeText={setRelationNumber}
        placeholder={t("Enter relation number")}
      />
      <AuthInput
        label={t("Object number")}
        value={objectNumber}
        onChangeText={setObjectNumber}
        placeholder={t("Enter object number")}
      />
      <AuthInput
        label={t("Type of house")}
        value={typeOfHouse}
        onChangeText={setTypeOfHouse}
        placeholder={t("Enter type of house")}
      />
      <AuthInput
        label={t("Project")}
        value={project}
        onChangeText={setProject}
        placeholder={t("Enter project")}
      />
      <AuthInput
        label={t("Kind of house")}
        value={kindOfHouse}
        onChangeText={setKindOfHouse}
        placeholder={t("Enter kind of house")}
      />
      <AuthInput
        label={t("Model")}
        value={model}
        onChangeText={setModel}
        placeholder={t("Enter model")}
      />
      <AuthInput
        label={t("Construction type")}
        value={constructionType}
        onChangeText={setConstructionType}
        placeholder={t("Enter construction type")}
      />
      <AuthInput
        label={t("Year")}
        value={year}
        onChangeText={(value) => setYear(value.replace(/[^0-9]/g, "").slice(0, 4))}
        placeholder={t("Enter year")}
        keyboardType="number-pad"
      />
    </>
  );

  const renderVehicleFields = () => (
    <>
      <AuthInput
        label={t("Vehicle name")}
        value={vehicleName}
        onChangeText={setVehicleName}
        placeholder={t("Enter vehicle name")}
      />
      <AuthInput
        label={t("Plate")}
        value={plate}
        onChangeText={setPlate}
        placeholder={t("Enter plate")}
        autoCapitalize="characters"
      />
      <AuthInput
        label={t("Brand")}
        value={brand}
        onChangeText={setBrand}
        placeholder={t("Enter brand")}
      />
      <AuthInput
        label={t("Model")}
        value={model}
        onChangeText={setModel}
        placeholder={t("Enter model")}
      />
      <AuthInput
        label={t("Year")}
        value={year}
        onChangeText={(value) => setYear(value.replace(/[^0-9]/g, "").slice(0, 4))}
        placeholder={t("Enter year")}
        keyboardType="number-pad"
      />
      <AuthInput
        label={t("Fuel")}
        value={fuel}
        onChangeText={setFuel}
        placeholder={t("Enter fuel")}
      />
      <View style={styles.field}>
        <Text style={authTypography.label}>{t("APK date")}</Text>
        <Pressable style={styles.dateField} onPress={() => setDatePickerOpen(true)}>
          <Ionicons name="calendar-outline" size={18} color={AppColors.subtitle} />
          <Text style={[authTypography.input, styles.dateText, !apkDate && authTypography.placeholder]}>
            {apkDate || t("Select date")}
          </Text>
        </Pressable>
      </View>
      <AuthInput
        label={t("Mileage")}
        value={mileage}
        onChangeText={(value) => setMileage(value.replace(/[^0-9]/g, ""))}
        placeholder={t("Enter mileage")}
        keyboardType="number-pad"
      />
      <AuthInput
        label={t("Chassis number")}
        value={chassisNumber}
        onChangeText={setChassisNumber}
        placeholder={t("Enter chassis number")}
        autoCapitalize="characters"
      />
      <AuthInput
        label={t("Color")}
        value={color}
        onChangeText={setColor}
        placeholder={t("Enter color")}
      />
      <AuthInput
        label={t("Driver")}
        value={driver}
        onChangeText={setDriver}
        placeholder={t("Enter driver")}
      />
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={screenTitle} onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={getKeyboardAvoidBehavior()}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          keyboardShouldPersistTaps="handled"
        >
          {categoryId === 1 ? renderCompanyFields() : null}
          {categoryId === 2 ? renderPersonFields() : null}
          {categoryId === 3 ? renderObjectFields() : null}
          {categoryId === 4 ? renderVehicleFields() : null}

          <AuthButton title={t("Save")} onPress={() => {}} disabled />
        </ScrollView>
      </KeyboardAvoidingView>

      <SelectionSheet
        visible={activeSheet === "salutation"}
        title={t("Select salutation")}
        options={salutationOptions}
        onClose={() => setActiveSheet(null)}
        onSelect={(option) => setSalutation(option.label)}
      />
      <SelectionSheet
        visible={activeSheet === "client"}
        title={t("Select client")}
        options={[]}
        emptyText={t("No options")}
        onClose={() => setActiveSheet(null)}
        onSelect={(option) => setClientLabel(option.label)}
      />
      <SelectionSheet
        visible={activeSheet === "company"}
        title={t("Select company")}
        options={[]}
        emptyText={t("No options")}
        onClose={() => setActiveSheet(null)}
        onSelect={(option) => setCompanyLabel(option.label)}
      />
      <SelectionBottomSheet
        visible={activeSheet === "country"}
        title={t("Select country")}
        searchPlaceholder={t("Search")}
        confirmText={t("Done")}
        options={countryOptions}
        selectedIds={countryCca2 ? [countryCca2] : []}
        onClose={() => setActiveSheet(null)}
        onConfirm={(selected) => {
          const pick = selected[0];
          setCountryName(pick?.label || "");
          setCountryCca2(pick ? String(pick.id) : "");
          setActiveSheet(null);
        }}
      />
      <AppDatePickerSheet
        visible={datePickerOpen}
        value={parseDate(apkDate)}
        onConfirm={(date) => setApkDate(formatDate(date))}
        onClose={() => setDatePickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FB" },
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  field: { marginBottom: 0 },
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
  dateText: { flex: 1, paddingVertical: 12 },
});
