import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import AuthInput from "../../Components/Auth/AuthInput";
import AuthButton from "../../Components/Auth/AuthButton";
import { GooglePlacesField } from "../../Components/GooglePlacesInput";
import { createBusinessCompany } from "../../services/companyService";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../../utils/screenInsets";

export default function CreateCompanyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string }>();

  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("31");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!address.trim()) nextErrors.address = t("Please enter address");
    if (!email.trim()) nextErrors.email = t("Please enter email");
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = t("Please enter a valid email");
    if (!phone.trim()) nextErrors.phone = t("Please enter phone number");
    else if (phone.length < 6) nextErrors.phone = t("Phone number too short");
    if (!companyName.trim()) nextErrors.companyName = t("Please enter company name");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await createBusinessCompany({
        google_maps: address.trim(),
        email: email.trim(),
        country_code: countryCode,
        phone_number: phone.trim(),
        company_name: companyName.trim(),
      });
      Alert.alert(t("Success"), t("Company created successfully!"));
      router.back();
    } catch (error: unknown) {
      Alert.alert(t("Error"), error instanceof Error ? error.message : t("Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("+Add Company")} onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={getKeyboardAvoidBehavior()}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          keyboardShouldPersistTaps="handled"
        >
          <AuthInput
            label={t("Company Name")}
            required
            value={companyName}
            onChangeText={setCompanyName}
            placeholder={t("Enter company name")}
            error={errors.companyName}
          />
          <GooglePlacesField
            label={t("Address")}
            required
            value={address}
            onChangeText={setAddress}
            placeholder={t("Enter address")}
            error={errors.address}
            containerStyle={{ marginBottom: 0 }}
          />
          <AuthInput
            label={t("Email Address")}
            required
            value={email}
            onChangeText={setEmail}
            placeholder={t("Enter email")}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <AuthInput
            label={t("Country Code")}
            value={countryCode}
            onChangeText={(value) => setCountryCode(value.replace(/[^0-9]/g, ""))}
            placeholder="31"
            keyboardType="phone-pad"
          />
          <AuthInput
            label={t("Phone Number")}
            required
            value={phone}
            onChangeText={(value) => setPhone(value.replace(/[^0-9]/g, ""))}
            placeholder={t("Enter phone number")}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <AuthButton
            title={submitting ? t("Loading...") : t("Submit")}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FB" },
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
});
