import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import ApiFeedback from "../../Components/ApiFeedback";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchLeaveAbsenceDetails,
  fetchLeaveTypes,
  updateLeaveRequest,
  type LeaveTypeItem,
} from "../../services/absenceService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";

type TimeField = "start" | "end" | "break" | null;

function formatTimeValue(date: Date) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function parseTime(value?: string) {
  if (!value) return new Date();
  const parts = value.split(":");
  const date = new Date();
  date.setHours(Number(parts[0] || 0), Number(parts[1] || 0), 0, 0);
  return date;
}

export default function LeaveRequestEditScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ leaveId?: string; color?: string }>();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const leaveId = params.leaveId || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [selectedType, setSelectedType] = useState<LeaveTypeItem | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [breakTime, setBreakTime] = useState(new Date());
  const [totalHours, setTotalHours] = useState("");
  const [reason, setReason] = useState("");
  const [typeSheetVisible, setTypeSheetVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<TimeField>(null);

  const loadData = useCallback(async () => {
    if (!leaveId) return;
    setLoading(true);
    clearApiError();
    try {
      const rows = await fetchLeaveAbsenceDetails(leaveId);
      const first = rows[0] || {};
      setDetails(first);
      setDate(first.date || "");
      setReason(first.reason_field || "");
      setTotalHours(String(first.total_hours || first.schedule_total_time || ""));
      setStartTime(parseTime(first.start_time || first.schedule_start_time));
      setEndTime(parseTime(first.end_time || first.schedule_end_time));
      setBreakTime(parseTime(first.break_time || first.schedule_break_time));

      const contractId = first.contract_id || first.employementdata?.id;
      if (contractId) {
        const types = await fetchLeaveTypes(contractId);
        setLeaveTypes(types);
        const matched = types.find(
          (type) => String(type.id) === String(first.leave_type_data?.id)
        );
        if (matched) setSelectedType(matched);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [captureApiError, clearApiError, leaveId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const typeOptions = useMemo<SheetOption[]>(
    () =>
      leaveTypes.map((item) => ({
        id: item.id,
        label: item.leave_type_name || "-",
        raw: item,
      })),
    [leaveTypes]
  );

  const handleSave = async () => {
    if (!details) return;
    setSubmitting(true);
    try {
      await updateLeaveRequest({
        leave_id: leaveId,
        contract_id: details.contract_id || details.employementdata?.id,
        leave_type: selectedType?.id,
        date,
        schedule_id: details.schedule_id,
        reason_field: reason,
        start_time: formatTimeValue(startTime),
        end_time: formatTimeValue(endTime),
        break_time: formatTimeValue(breakTime),
        total_hours: totalHours,
      });
      setToast({ top: 45, text: t("Updated successfully"), type: "success", visible: true });
      router.back();
    } catch (error) {
      Alert.alert(t("Error"), error instanceof Error ? error.message : t("Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const onTimeChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === "android") setActiveTimeField(null);
    if (!selected || !activeTimeField) return;
    if (activeTimeField === "start") setStartTime(selected);
    if (activeTimeField === "end") setEndTime(selected);
    if (activeTimeField === "break") setBreakTime(selected);
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Leave Request")} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: scrollPadding }}>
        <ApiFeedback error={apiError} onRetry={loadData} />

        {loading ? (
          <ActivityIndicator color={AppColors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <FormSelectField
              label={t("Type")}
              required
              placeholder={t("Select")}
              value={selectedType?.leave_type_name}
              onPress={() => setTypeSheetVisible(true)}
            />

            <View style={styles.field}>
              <Text style={styles.label}>{t("Datum")}</Text>
              <Text style={styles.value}>{date || "-"}</Text>
            </View>

            <TimeFieldRow label={t("Start time")} value={formatTimeValue(startTime)} onPress={() => setActiveTimeField("start")} />
            <TimeFieldRow label={t("End time")} value={formatTimeValue(endTime)} onPress={() => setActiveTimeField("end")} />
            <TimeFieldRow label={t("Break")} value={formatTimeValue(breakTime)} onPress={() => setActiveTimeField("break")} />

            <Text style={styles.label}>{t("Total hours")}</Text>
            <TextInput
              value={totalHours}
              onChangeText={setTotalHours}
              style={styles.input}
              placeholderTextColor={Colors.placeholder}
            />

            <Text style={styles.label}>{t("Description")}</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              style={[styles.input, styles.textArea]}
              placeholderTextColor={Colors.placeholder}
            />

            <Pressable style={[styles.primaryButton, submitting && styles.disabled]} disabled={submitting} onPress={handleSave}>
              {submitting ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>{t("Save")}</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      {activeTimeField ? (
        <DateTimePicker
          value={
            activeTimeField === "start"
              ? startTime
              : activeTimeField === "end"
                ? endTime
                : breakTime
          }
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onTimeChange}
        />
      ) : null}

      <SelectionBottomSheet
        visible={typeSheetVisible}
        title={t("Type")}
        searchPlaceholder={t("Search")}
        confirmText={t("Select")}
        options={typeOptions}
        selectedIds={selectedType ? [selectedType.id] : []}
        onClose={() => setTypeSheetVisible(false)}
        onConfirm={(options) => {
          setSelectedType(options[0]?.raw as LeaveTypeItem);
          setTypeSheetVisible(false);
        }}
      />
    </View>
  );
}

function TimeFieldRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.timeRow} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  field: { marginBottom: 12 },
  label: { fontFamily: FONTS.LexendMedium, color: AppColors.black, marginBottom: 6 },
  value: { fontFamily: FONTS.LexendRegular, color: Colors.placeholder },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  primaryButton: {
    marginTop: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { fontFamily: FONTS.LexendSemiBold, color: AppColors.white, fontSize: 16 },
  disabled: { opacity: 0.7 },
});
