import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthButton from "../../Components/Auth/AuthButton";
import FormSelectField from "../../Components/FormSelectField";
import ScreenHeader from "../../Components/ScreenHeader";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import { RegisterBackContext } from "../../constants/GoBackContext";
import {
  fetchProfileSettings,
  fetchTimezones,
  updateUserTimezone,
  type TimezoneOption,
} from "../../services/profileSettingsService";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function ChangeTimezoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const [timezones, setTimezones] = useState<TimezoneOption[]>([]);
  const [selected, setSelected] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const timezoneResult = await fetchTimezones();
      setTimezones(timezoneResult.options);

      try {
        const settings = await fetchProfileSettings();
        setSelected(settings.timezone || timezoneResult.currentTimezone);
      } catch {
        setSelected(timezoneResult.currentTimezone);
      }
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  }, [setToast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const options = useMemo<SheetOption[]>(
    () => timezones.map((item) => ({ id: item.id, label: item.label })),
    [timezones]
  );

  const selectedLabel =
    timezones.find((item) => item.id === selected)?.label || selected || t("Select timezone");

  const handleSave = async () => {
    if (!selected) {
      setToast({
        top: 45,
        text: t("Please select a timezone"),
        type: "error",
        visible: true,
      });
      return;
    }

    setSaving(true);
    try {
      const response = await updateUserTimezone(selected);
      setToast({
        top: 45,
        text: response.message || t("Timezone updated successfully"),
        type: "success",
        visible: true,
      });
      router.back();
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Change Timezone")} onBack={() => router.back()} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <View style={[styles.content, { paddingBottom: scrollPadding }]}>
          <FormSelectField
            label={t("Timezone")}
            placeholder={t("Select timezone")}
            value={selectedLabel}
            onPress={() => setSheetOpen(true)}
          />
          <AuthButton title={t("Save")} onPress={handleSave} disabled={saving} />
        </View>
      )}

      <SelectionBottomSheet
        visible={sheetOpen}
        title={t("Change Timezone")}
        searchPlaceholder={t("Search")}
        confirmText={t("Confirm")}
        options={options}
        selectedIds={selected ? [selected] : []}
        onClose={() => setSheetOpen(false)}
        onConfirm={(selectedItems) => {
          const item = selectedItems[0];
          if (item) setSelected(String(item.id));
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 16,
    gap: 16,
  },
});
