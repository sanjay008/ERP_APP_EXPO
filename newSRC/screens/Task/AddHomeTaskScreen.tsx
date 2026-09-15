import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import ApiFeedback from "../../Components/ApiFeedback";
import AuthInput from "../../Components/Auth/AuthInput";
import AuthButton from "../../Components/Auth/AuthButton";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet, {
  type SheetOption,
} from "../../Components/SelectionBottomSheet";
import {
  createHomeTask,
  fetchCustomers,
  type RelatieOption,
} from "../../services/taskService";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { getHomeTaskScreenTitle, parseHomeTaskType } from "../../utils/homeTaskNavigation";
import { getData } from "../../utils/storeData";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../../utils/screenInsets";

export default function AddHomeTaskScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{
    linkTo?: string;
    title?: string;
    color?: string;
  }>();

  const taskType = parseHomeTaskType(params.linkTo);
  const screenTitle = t(getHomeTaskScreenTitle(taskType, params.title));
  const isUserTask = taskType === "task_user";
  const canSelectRelatie = !isUserTask;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<RelatieOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<RelatieOption | null>(null);
  const [customerSheetVisible, setCustomerSheetVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      clearApiError();
      const [customerRes, userData] = await Promise.all([
        fetchCustomers(),
        getData("USERDATA"),
      ]);

      if (customerRes?.status && Array.isArray(customerRes.data)) {
        setCustomers(customerRes.data);
        const currentRelatieId = userData?.data?.relaties?.id;
        const matched = customerRes.data.find((item) => item.id === currentRelatieId);
        if (matched) {
          setSelectedCustomer(matched);
        }
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

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = t("Title is required.");
    if (!description.trim()) nextErrors.description = t("Description is required.");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const response = await createHomeTask({
        type: taskType,
        title: title.trim(),
        short_description: description.trim(),
        selected_relaties_id: selectedCustomer?.id,
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
              required
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder={t("Add title.....")}
              error={errors.title}
            />

            <FormSelectField
              label={t("Relaties")}
              placeholder={t("Select Relatie...")}
              value={selectedCustomer?.display_name || selectedCustomer?.bedrijfsnaam}
              onPress={() => canSelectRelatie && setCustomerSheetVisible(true)}
              disabled={!canSelectRelatie}
            />

            <AuthInput
              label={t("Description")}
              required
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: "" }));
                }
              }}
              placeholder={t("Type here...")}
              multiline
              style={{ minHeight: 120, textAlignVertical: "top" }}
              error={errors.description}
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
        searchPlaceholder={t("Search.......")}
        confirmText={t("Apply")}
        options={customerOptions}
        selectedIds={selectedCustomer ? [selectedCustomer.id] : []}
        onClose={() => setCustomerSheetVisible(false)}
        onConfirm={(selected) => {
          setSelectedCustomer(selected[0]?.raw ?? null);
          setCustomerSheetVisible(false);
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
});
