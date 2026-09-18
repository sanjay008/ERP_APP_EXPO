import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import AppDatePickerSheet from "../../Components/AppDatePickerSheet";
import ApiFeedback from "../../Components/ApiFeedback";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchLeaveAbsenceDetails,
  fetchLeaveTypes,
  updateLeaveRequest,
  type AbsenceLeaveItem,
  type LeaveTypeItem,
} from "../../services/absenceService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";

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

function formatApiDate(value: Date) {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

function parseApiDate(value?: string) {
  if (!value) return new Date();
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function resolveLeaveType(types: LeaveTypeItem[], item: AbsenceLeaveItem): LeaveTypeItem | null {
  const typeData = item.leave_type_data;
  const candidateIds = [item.leave_type, item.leave_type_id, typeData?.id, typeData?.leave_type_id].filter(
    (value) => value !== undefined && value !== null && String(value).trim() !== ""
  );

  const matchedId = types.find((type) =>
    candidateIds.some((id) => String(type.id) === String(id))
  );
  if (matchedId) return matchedId;

  const name = String(typeData?.leave_type_name || "").trim().toLowerCase();
  if (name) {
    const matchedName = types.find(
      (type) => String(type.leave_type_name || "").trim().toLowerCase() === name
    );
    if (matchedName) return matchedName;
  }

  if (typeData?.leave_type_name) {
    return {
      id: candidateIds[0] ?? typeData.leave_type_name,
      leave_type_name: typeData.leave_type_name,
    };
  }

  return null;
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
  const [details, setDetails] = useState<AbsenceLeaveItem | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [selectedType, setSelectedType] = useState<LeaveTypeItem | null>(null);
  const [date, setDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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
        setSelectedType(resolveLeaveType(types, first));
      } else {
        setSelectedType(resolveLeaveType([], first));
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

  const typeValue =
    selectedType?.leave_type_name || details?.leave_type_data?.leave_type_name || "";

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
              value={typeValue}
              onPress={() => setTypeSheetVisible(true)}
            />

            <Text style={[styles.label, styles.fieldLabel]}>{t("Datum")}</Text>
            <Pressable style={styles.pickerInput} onPress={() => setDatePickerOpen(true)}>
              <Text style={styles.pickerInputText}>{date || t("Select Datum")}</Text>
              <View style={styles.pickerIcon}>
                <Image source={Images.date} style={styles.pickerIconImage} />
              </View>
            </Pressable>

            <PickerField
              label={t("Start time")}
              value={formatTimeValue(startTime)}
              onPress={() => setActiveTimeField("start")}
            />
            <PickerField
              label={t("End time")}
              value={formatTimeValue(endTime)}
              onPress={() => setActiveTimeField("end")}
            />
            <PickerField
              label={t("Break")}
              value={formatTimeValue(breakTime)}
              onPress={() => setActiveTimeField("break")}
            />

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

            <Pressable
              style={[styles.primaryButton, submitting && styles.disabled]}
              disabled={submitting}
              onPress={handleSave}
            >
              {submitting ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>{t("Save")}</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      <AppDatePickerSheet
        visible={datePickerOpen}
        value={parseApiDate(date)}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={(next) => {
          setDate(formatApiDate(next));
          setDatePickerOpen(false);
        }}
      />

      {activeTimeField ? (
        Platform.OS === "android" ? (
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
            display="default"
            onChange={onTimeChange}
          />
        ) : (
          <View style={styles.iosTimeWrap}>
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
              display="spinner"
              onChange={onTimeChange}
            />
            <Pressable style={styles.iosTimeDone} onPress={() => setActiveTimeField(null)}>
              <Text style={styles.iosTimeDoneText}>{t("Done")}</Text>
            </Pressable>
          </View>
        )
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

function PickerField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <>
      <Text style={[styles.label, styles.fieldLabel]}>{label}</Text>
      <Pressable style={styles.pickerInput} onPress={onPress}>
        <Text style={styles.pickerInputText}>{value}</Text>
        <View style={styles.pickerIcon}>
          <Image source={Images.date} style={styles.pickerIconImage} />
        </View>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  fieldLabel: { marginTop: 12 },
  label: { fontFamily: FONTS.LexendMedium, color: AppColors.black, marginBottom: 6 },
  pickerInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingLeft: 12,
    minHeight: 50,
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: AppColors.white,
  },
  pickerInputText: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
    paddingVertical: 12,
  },
  pickerIcon: {
    backgroundColor: AppColors.primary,
    padding: 7,
    borderRadius: 5,
    margin: 4,
  },
  pickerIconImage: {
    width: 20,
    height: 20,
    tintColor: AppColors.white,
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
  iosTimeWrap: {
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 12,
  },
  iosTimeDone: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  iosTimeDoneText: {
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.primary,
    fontSize: 15,
  },
});
