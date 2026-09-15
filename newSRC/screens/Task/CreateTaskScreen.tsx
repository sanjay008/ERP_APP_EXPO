import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  const [selectedCustomer, setSelectedCustomer] = useState<RelatieOption | null>(
    null
  );
  const [selectedPriority, setSelectedPriority] =
    useState<PriorityOption | null>(null);
  const [customerSheetVisible, setCustomerSheetVisible] = useState(false);
  const [prioritySheetVisible, setPrioritySheetVisible] = useState(false);
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
        label: item.name || item.label || item.value || String(index),
        raw: item,
      })),
    [priorities]
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = t("Please enter task name");
    if (!selectedCustomer) nextErrors.customer = t("Please select customer");
    if (!selectedPriority) nextErrors.priority = t("Please select priority");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const response = await createTask({
        selected_relaties_id: selectedCustomer?.id,
        title: title.trim(),
        short_description: description.trim(),
        priority: selectedPriority?.value || selectedPriority?.name,
      });
      if (response?.status) {
        router.back();
      }
    } catch (error) {
      console.log("Error creating task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Create Task")} />

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
            <AuthInput
              label={t("Task Name")}
              required
              value={title}
              onChangeText={setTitle}
              placeholder={t("Enter task name")}
              error={errors.title}
            />

            <AuthInput
              label={t("Description")}
              value={description}
              onChangeText={setDescription}
              placeholder={t("Enter description")}
              multiline
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />

            <FormSelectField
              label={t("Customer")}
              required
              placeholder={t("Select customer")}
              value={
                selectedCustomer
                  ? selectedCustomer.display_name ||
                    selectedCustomer.bedrijfsnaam
                  : undefined
              }
              onPress={() => setCustomerSheetVisible(true)}
              error={errors.customer}
            />

            <FormSelectField
              label={t("Priorities")}
              required
              placeholder={t("Select priority")}
              value={
                selectedPriority
                  ? selectedPriority.name ||
                    selectedPriority.label ||
                    selectedPriority.value
                  : undefined
              }
              onPress={() => setPrioritySheetVisible(true)}
              error={errors.priority}
            />

            <AuthButton
              title={submitting ? t("Loading...") : t("Submit")}
              onPress={handleSubmit}
              disabled={submitting}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <SelectionBottomSheet
        visible={customerSheetVisible}
        title={t("Customer")}
        searchPlaceholder={t("Search customer")}
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
        title={t("Priorities")}
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
          if (errors.priority) {
            setErrors((prev) => ({ ...prev, priority: "" }));
          }
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
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
});
