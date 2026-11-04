import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import AuthInput from "../../Components/Auth/AuthInput";
import RichDescriptionEditor from "../../Components/RichDescriptionEditor";
import KeyboardScreen from "../../Components/KeyboardScreen";
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
import { useScreenInsets } from "../../utils/screenInsets";
import { isRichTextEmpty, richTextPayload } from "../../utils/richText";
import { flattenFieldErrors, getApiErrorMessage } from "../../utils/apiError";

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
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<RelatieOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<RelatieOption | null>(null);
  const [customerSheetVisible, setCustomerSheetVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadFormData = useCallback(async () => {
    try {
      setLoadingCustomers(true);
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
      setLoadingCustomers(false);
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
    if (isRichTextEmpty(description)) nextErrors.description = t("Description is required.");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!validate()) return;

    try {
      setSubmitting(true);
      const response = await createHomeTask({
        type: taskType,
        title: title.trim(),
        short_description: richTextPayload(description),
        selected_relaties_id: selectedCustomer?.id,
      });

      if (response?.status) {
        router.back();
        return;
      }

      setFormError(response?.message || t("Something went wrong"));
    } catch (error: unknown) {
      const fieldErrors = flattenFieldErrors(
        (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors
      );
      if (fieldErrors) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        return;
      }
      setFormError(getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={screenTitle} onBack={() => router.back()} />

      {apiError && customers.length === 0 ? (
        <ApiFeedback error={apiError} onRetry={loadFormData} />
      ) : (
        <KeyboardScreen contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
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
              placeholder={loadingCustomers ? t("Loading...") : t("Select Relatie...")}
              value={selectedCustomer?.display_name || selectedCustomer?.bedrijfsnaam}
              onPress={() => canSelectRelatie && setCustomerSheetVisible(true)}
              disabled={!canSelectRelatie || loadingCustomers}
            />

            <Text style={styles.editorLabel}>
              {t("Description")}
              <Text style={styles.required}> *</Text>
            </Text>
            <RichDescriptionEditor
              value={description}
              placeholder={t("Type here...")}
              error={Boolean(errors.description)}
              compact
              onChange={(html) => {
                setDescription(html);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: "" }));
                }
              }}
            />
            {errors.description ? <Text style={styles.fieldError}>{errors.description}</Text> : null}
            {formError ? <Text style={styles.fieldError}>{formError}</Text> : null}

            <AuthButton
              title={submitting ? t("Loading...") : t("Add Task")}
              onPress={handleSubmit}
              disabled={submitting}
            />
        </KeyboardScreen>
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
  content: {
    padding: 16,
    gap: 16,
  },
  editorLabel: {
    fontSize: 14,
    color: "#111827",
  },
  required: {
    color: "#EF4444",
  },
  fieldError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: -8,
  },
});
