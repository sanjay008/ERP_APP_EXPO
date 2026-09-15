import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import SelectionSheet from "./Auth/SelectionSheet";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import type { BookingClientInfo, BookingCurrency } from "../services/bookingService";
import { normalizePaymentMethods } from "../services/bookingService";

type ClientForm = {
  id?: string | number;
  display_name: string;
  mobiel: string;
  email_adres: string;
  google_maps: string;
  country_code: string;
};

type Props = {
  visible: boolean;
  loading?: boolean;
  remainingPayment?: string | number;
  defaultCurrency?: BookingCurrency;
  currencies?: BookingCurrency[];
  paymentMethods?: string[] | string;
  client?: BookingClientInfo | null;
  onClose: () => void;
  onUpdateClient?: (client: ClientForm) => Promise<void> | void;
  onSubmit: (payload: {
    amount: number;
    currencyCode: string;
    paymentMethod: string;
    client?: ClientForm;
  }) => void;
};

export default function TaxiBookingPaymentModal({
  visible,
  loading = false,
  remainingPayment,
  defaultCurrency,
  currencies = [],
  paymentMethods = [],
  client,
  onClose,
  onUpdateClient,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);
  const [form, setForm] = useState<ClientForm>({
    display_name: "",
    mobiel: "",
    email_adres: "",
    google_maps: "",
    country_code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currencyOptions = useMemo(() => {
    if (currencies.length > 0) return currencies;
    if (defaultCurrency?.code) return [defaultCurrency];
    return [];
  }, [currencies, defaultCurrency]);

  const methodOptions = useMemo(() => {
    const unique = normalizePaymentMethods(paymentMethods);
    return unique.length > 0 ? unique : ["Cash to the driver"];
  }, [paymentMethods]);

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setErrors({});
    setAmount(String(remainingPayment ?? ""));
    setCurrencyCode(defaultCurrency?.code || currencyOptions[0]?.code || "");
    setPaymentMethod(methodOptions[0] || "");
    setForm({
      id: client?.id,
      display_name: client?.display_name || "",
      mobiel: String(client?.mobiel || ""),
      email_adres: client?.email_adres || "",
      google_maps: client?.google_maps || "",
      country_code: String(client?.country_code || ""),
    });
  }, [visible, remainingPayment, defaultCurrency, currencyOptions, methodOptions, client]);

  const selectedCurrency = currencyOptions.find((item) => item.code === currencyCode);

  const validateStep1 = () => {
    const next: Record<string, string> = {};
    if (!form.display_name.trim()) next.display_name = t("This field is required");
    if (!form.mobiel.trim()) next.mobiel = t("This field is required");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep1()) return;
    if (onUpdateClient) {
      await onUpdateClient(form);
    }
    setStep(2);
  };

  const handleSubmit = () => {
    const parsed = Number.parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    if (!currencyCode || !paymentMethod) return;
    onSubmit({
      amount: parsed,
      currencyCode,
      paymentMethod,
      client: form,
    });
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{t("Booking Payments")}</Text>
            <Text style={styles.stepLabel}>
              {t("Step")} {step}/2
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled">
              {step === 1 ? (
                <>
                  <Text style={styles.label}>{t("Name")}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.display_name}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, display_name: value }))}
                  />
                  {errors.display_name ? <Text style={styles.error}>{errors.display_name}</Text> : null}

                  <Text style={styles.label}>{t("Phone Number")}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.mobiel}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, mobiel: value }))}
                    keyboardType="phone-pad"
                  />
                  {errors.mobiel ? <Text style={styles.error}>{errors.mobiel}</Text> : null}

                  <Text style={styles.label}>{t("Email")}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.email_adres}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, email_adres: value }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.label}>{t("Address")}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.google_maps}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, google_maps: value }))}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>{t("Amount")}</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />

                  <Text style={styles.label}>{t("Currency")}</Text>
                  <Pressable style={styles.select} onPress={() => setCurrencySheetOpen(true)}>
                    <Text style={styles.selectText}>
                      {selectedCurrency?.code || currencyCode || t("Select")}
                    </Text>
                  </Pressable>

                  <Text style={styles.label}>{t("Payment Method")}</Text>
                  <Pressable style={styles.select} onPress={() => setMethodSheetOpen(true)}>
                    <Text style={styles.selectText}>{paymentMethod || t("Select")}</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={step === 1 ? onClose : () => setStep(1)}
                disabled={loading}
              >
                <Text style={styles.cancelText}>
                  {step === 1 ? t("Annuleren") : t("Back")}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                onPress={step === 1 ? handleNext : handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.saveText}>
                    {step === 1 ? t("Continue") : t("Save")}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SelectionSheet
        visible={currencySheetOpen}
        title={t("Currency")}
        options={currencyOptions.map((item) => ({
          label: item.code || item.name || "-",
          value: item.code || "",
        }))}
        onClose={() => setCurrencySheetOpen(false)}
        onSelect={(option) => {
          setCurrencyCode(option.value);
          setCurrencySheetOpen(false);
        }}
      />

      <SelectionSheet
        visible={methodSheetOpen}
        title={t("Payment Method")}
        options={methodOptions.map((item) => ({
          label: item,
          value: item,
        }))}
        onClose={() => setMethodSheetOpen(false)}
        onSelect={(option) => {
          setPaymentMethod(option.value);
          setMethodSheetOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    color: AppColors.black,
    marginBottom: 4,
  },
  stepLabel: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    marginBottom: 12,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.subtitle,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.LexendRegular,
    fontSize: 15,
    color: AppColors.black,
  },
  error: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: "#D14343",
    marginTop: 4,
  },
  select: {
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 15,
    color: AppColors.black,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: FONTS.LexendMedium,
    color: AppColors.black,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveText: {
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.white,
  },
});
