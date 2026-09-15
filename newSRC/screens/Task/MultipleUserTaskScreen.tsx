import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import AuthInput from "../../Components/Auth/AuthInput";
import AuthButton from "../../Components/Auth/AuthButton";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet, {
  type SheetOption,
} from "../../Components/SelectionBottomSheet";
import {
  createHomeTask,
  fetchCompanyCurrencies,
  fetchCustomers,
  fetchPriorities,
  fetchTaskTemplates,
  fetchTaxes,
  type CurrencyOption,
  type PriorityOption,
  type RelatieOption,
  type TaskTemplateOption,
  type TaxOption,
} from "../../services/taskService";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { getHomeTaskScreenTitle } from "../../utils/homeTaskNavigation";
import { getData } from "../../utils/storeData";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";

export default function MultipleUserTaskScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ title?: string; color?: string }>();
  const screenTitle = t(getHomeTaskScreenTitle("task_multiple_user", params.title));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<RelatieOption[]>([]);
  const [templates, setTemplates] = useState<TaskTemplateOption[]>([]);
  const [priorities, setPriorities] = useState<PriorityOption[]>([]);
  const [taxes, setTaxes] = useState<TaxOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<RelatieOption | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplateOption | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<PriorityOption | null>(null);
  const [selectedTax, setSelectedTax] = useState<TaxOption | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption | null>(null);
  const [customerSheetVisible, setCustomerSheetVisible] = useState(false);
  const [templateSheetVisible, setTemplateSheetVisible] = useState(false);
  const [prioritySheetVisible, setPrioritySheetVisible] = useState(false);
  const [taxSheetVisible, setTaxSheetVisible] = useState(false);
  const [currencySheetVisible, setCurrencySheetVisible] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      clearApiError();
      const [customerRes, templateRes, priorityRes, taxRes, currencyRes, userData] =
        await Promise.all([
          fetchCustomers(),
          fetchTaskTemplates(),
          fetchPriorities(),
          fetchTaxes(),
          fetchCompanyCurrencies(),
          getData("USERDATA"),
        ]);

      if (customerRes?.status && Array.isArray(customerRes.data)) {
        setCustomers(customerRes.data);
        const currentRelatieId = userData?.data?.relaties?.id;
        const matched = customerRes.data.find((item) => item.id === currentRelatieId);
        if (matched) setSelectedCustomer(matched);
      }
      if (templateRes?.status && Array.isArray(templateRes.data)) {
        setTemplates(templateRes.data);
      }
      if (priorityRes?.status && Array.isArray(priorityRes.data)) {
        setPriorities(priorityRes.data);
      }
      if (taxRes?.status && Array.isArray(taxRes.data)) {
        setTaxes(taxRes.data);
      }
      if (currencyRes?.status && Array.isArray(currencyRes.data)) {
        setCurrencies(currencyRes.data);
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

  const templateOptions: SheetOption[] = useMemo(
    () =>
      templates.map((item) => ({
        id: item.id,
        label: item.title || String(item.id),
        raw: item,
      })),
    [templates]
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

  const taxOptions: SheetOption[] = useMemo(
    () =>
      taxes.map((item, index) => ({
        id: item.value ?? index,
        label: item.label || item.value || String(index),
        raw: item,
      })),
    [taxes]
  );

  const currencyOptions: SheetOption[] = useMemo(
    () =>
      currencies.map((item, index) => ({
        id: item.code ?? index,
        label: item.symbol || item.code || String(index),
        raw: item,
      })),
    [currencies]
  );

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await createHomeTask({
        type: "task_multiple_user",
        title: title.trim(),
        short_description: description.trim(),
        selected_relaties_id: selectedCustomer?.id,
        task_template: selectedTemplate?.id,
        priority: selectedPriority?.value,
        quantity,
        price: price.replace(/,/g, ""),
        currency: selectedCurrency?.code,
        tax: selectedTax?.value,
      });

      if (response?.status) {
        router.replace("/(app)/(tabs)/menu");
        return;
      }

      Alert.alert(t("Error"), response?.message || t("Something went wrong"));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errors?: Record<string, string[]> } } };
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        const message = Object.values(validationErrors).flat().join("\n");
        Alert.alert(t("Validation Error"), message);
      } else {
        Alert.alert(t("Error"), t("Something went wrong"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={screenTitle} onBack={() => router.back()} />

      {loading ? (
        <ApiFeedback loading />
      ) : apiError ? (
        <ApiFeedback error={apiError} onRetry={loadFormData} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={getKeyboardAvoidBehavior()}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AuthInput
              label={t("Title")}
              value={title}
              onChangeText={setTitle}
              placeholder={t("Add title.....")}
            />

            <FormSelectField
              label={t("Relaties")}
              placeholder={t("Select Relatie...")}
              value={selectedCustomer?.display_name || selectedCustomer?.bedrijfsnaam}
              onPress={() => setCustomerSheetVisible(true)}
            />

            <FormSelectField
              label={t("Template")}
              placeholder={t("Select Template")}
              value={selectedTemplate?.title}
              onPress={() => setTemplateSheetVisible(true)}
            />

            <FormSelectField
              label={t("Priority")}
              placeholder={t("Select Priority")}
              value={selectedPriority?.value || selectedPriority?.name}
              onPress={() => setPrioritySheetVisible(true)}
            />

            <AuthInput
              label={t("Qty")}
              value={quantity}
              onChangeText={setQuantity}
              placeholder={t("Add Qty.....")}
              keyboardType="numeric"
            />

            <Text style={styles.sectionLabel}>{t("Price")}</Text>
            <View style={styles.priceRow}>
              <View style={styles.currencyField}>
                <FormSelectField
                  label=" "
                  placeholder={t("Curr..")}
                  value={selectedCurrency?.symbol}
                  onPress={() => setCurrencySheetVisible(true)}
                />
              </View>
              <View style={styles.priceField}>
                <AuthInput
                  label=" "
                  value={price}
                  onChangeText={(value) => setPrice(value.replace(/,/g, ""))}
                  placeholder={t("Add price...")}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <FormSelectField
              label={t("Tax")}
              placeholder={t("Select Tax")}
              value={selectedTax?.label || selectedTax?.value}
              onPress={() => setTaxSheetVisible(true)}
            />

            <AuthInput
              label={t("Description")}
              value={description}
              onChangeText={setDescription}
              placeholder={t("Type here...")}
              multiline
              style={{ minHeight: 120, textAlignVertical: "top" }}
            />

            <AuthButton
              title={submitting ? t("Loading...") : t("Add Task")}
              onPress={handleSubmit}
              disabled={submitting}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <SelectionBottomSheet
        visible={customerSheetVisible}
        title={t("Relaties")}
        searchPlaceholder={t("Search...")}
        confirmText={t("Apply")}
        options={customerOptions}
        selectedIds={selectedCustomer ? [selectedCustomer.id] : []}
        onClose={() => setCustomerSheetVisible(false)}
        onConfirm={(selected) => {
          setSelectedCustomer(selected[0]?.raw ?? null);
          setCustomerSheetVisible(false);
        }}
      />

      <SelectionBottomSheet
        visible={templateSheetVisible}
        title={t("Template")}
        searchPlaceholder={t("Search...")}
        confirmText={t("Apply")}
        options={templateOptions}
        selectedIds={selectedTemplate ? [selectedTemplate.id] : []}
        onClose={() => setTemplateSheetVisible(false)}
        onConfirm={(selected) => {
          setSelectedTemplate(selected[0]?.raw ?? null);
          setTemplateSheetVisible(false);
        }}
      />

      <SelectionBottomSheet
        visible={prioritySheetVisible}
        title={t("Priority")}
        searchPlaceholder={t("Search...")}
        confirmText={t("Apply")}
        options={priorityOptions}
        selectedIds={
          selectedPriority ? [selectedPriority.id ?? selectedPriority.value ?? ""] : []
        }
        onClose={() => setPrioritySheetVisible(false)}
        onConfirm={(selected) => {
          setSelectedPriority(selected[0]?.raw ?? null);
          setPrioritySheetVisible(false);
        }}
      />

      <SelectionBottomSheet
        visible={taxSheetVisible}
        title={t("Tax")}
        searchPlaceholder={t("Search...")}
        confirmText={t("Apply")}
        options={taxOptions}
        selectedIds={selectedTax?.value ? [selectedTax.value] : []}
        onClose={() => setTaxSheetVisible(false)}
        onConfirm={(selected) => {
          setSelectedTax(selected[0]?.raw ?? null);
          setTaxSheetVisible(false);
        }}
      />

      <SelectionBottomSheet
        visible={currencySheetVisible}
        title={t("Currency")}
        searchPlaceholder={t("Search...")}
        confirmText={t("Apply")}
        options={currencyOptions}
        selectedIds={selectedCurrency?.code ? [selectedCurrency.code] : []}
        onClose={() => setCurrencySheetVisible(false)}
        onConfirm={(selected) => {
          setSelectedCurrency(selected[0]?.raw ?? null);
          setCurrencySheetVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },
  flex: { flex: 1 },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
    marginBottom: -8,
  },
  priceRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  currencyField: {
    width: 90,
  },
  priceField: {
    flex: 1,
  },
});
