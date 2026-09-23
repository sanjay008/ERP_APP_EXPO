import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import ApiFeedback from "../../Components/ApiFeedback";
import {
  fetchActiveEmployeeContracts,
  fetchCheckInOutState,
  fetchContractSchedule,
  formatBreakTime,
  getTodayFormats,
  performCheckIn,
  performCheckOut,
  pickDefaultContract,
  type EmployeeContractOption,
  type ScheduleItem,
} from "../../services/checkInOutService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";

export default function CheckInOutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contracts, setContracts] = useState<EmployeeContractOption[]>([]);
  const [selectedContract, setSelectedContract] = useState<EmployeeContractOption | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [scheduleLabel, setScheduleLabel] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkData, setCheckData] = useState<any>(null);
  const [breakTimes, setBreakTimes] = useState<Array<{ id?: string | number; break_time?: string }>>([]);
  const [selectedBreak, setSelectedBreak] = useState("");
  const [description, setDescription] = useState("");
  const [contractSheetVisible, setContractSheetVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(getTodayFormats().currentTime);

  const { displayDate, apiDate } = useMemo(() => getTodayFormats(), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getTodayFormats().currentTime);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    clearApiError();
    try {
      const employeeContracts = await fetchActiveEmployeeContracts();
      setContracts(employeeContracts);

      const first = pickDefaultContract(employeeContracts);
      setSelectedContract(first);
      if (first) {
        const scheduleRes = await fetchContractSchedule(first.id, apiDate);
        setSchedules(scheduleRes.schedules);
        setScheduleLabel(scheduleRes.scheduleLabel);
        setSelectedSchedule(scheduleRes.schedules[0] ?? null);
      }

      const checkState = await fetchCheckInOutState(displayDate);
      setCheckedIn(checkState.checkedIn);
      setCheckData(checkState.checkData);
      setBreakTimes(checkState.breakTimes);
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [apiDate, displayDate, captureApiError, clearApiError]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const contractOptions = useMemo<SheetOption[]>(
    () =>
      contracts.map((item) => ({
        id: item.id,
        label: item.title,
        raw: item,
      })),
    [contracts]
  );

  const handleContractSelect = async (options: SheetOption[]) => {
    const contract = options[0]?.raw as EmployeeContractOption;
    if (!contract) return;
    setSelectedContract(contract);
    setContractSheetVisible(false);
    try {
      const scheduleRes = await fetchContractSchedule(contract.id, apiDate);
      setSchedules(scheduleRes.schedules);
      setScheduleLabel(scheduleRes.scheduleLabel);
      setSelectedSchedule(scheduleRes.schedules[0] ?? null);
    } catch (error) {
      captureApiError(error);
    }
  };

  const handleSubmit = async () => {
    if (!checkedIn) {
      if (!selectedContract?.id) {
        Alert.alert(t("Error"), t("Please select a contract"));
        return;
      }
      setSubmitting(true);
      try {
        await performCheckIn({
          contractId: selectedContract.id,
          scheduleItem: selectedSchedule,
          scheduleLabel,
          currentDate: displayDate,
          currentTime,
        });
        setToast({ top: 45, text: t("EmployeeCheckIn"), type: "success", visible: true });
        const state = await fetchCheckInOutState(displayDate);
        setCheckedIn(state.checkedIn);
        setCheckData(state.checkData);
        setBreakTimes(state.breakTimes);
      } catch (error) {
        captureApiError(error);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!checkData) return;
    setSubmitting(true);
    try {
      await performCheckOut({
        checkData,
        selectedBreak,
        description,
        currentDate: displayDate,
        currentTime,
      });
      setToast({
        top: 45,
        text: `${t("EmployeeCheckOut")} ${displayDate} ${currentTime}`,
        type: "success",
        visible: true,
      });
      setDescription("");
      const state = await fetchCheckInOutState(displayDate);
      setCheckedIn(state.checkedIn);
      setCheckData(state.checkData);
      setBreakTimes(state.breakTimes);
    } catch (error) {
      captureApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Check In / Out")} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <ApiFeedback error={apiError} onRetry={loadInitial} />

        {loading ? (
          <ActivityIndicator color={AppColors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {!checkedIn ? (
              <>
                <FormSelectField
                  label={t("Contract")}
                  required
                  placeholder={t("Select contract")}
                  value={selectedContract?.title}
                  onPress={() => setContractSheetVisible(true)}
                />

                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t("Current date")}</Text>
                  <Text style={styles.value}>{displayDate}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t("Currenttime")}</Text>
                  <Text style={styles.value}>{currentTime}</Text>
                </View>

                {schedules.length ? (
                  schedules.map((item, index) => {
                    const active = selectedSchedule === item;
                    return (
                      <Pressable
                        key={`${item.start_time}-${index}`}
                        style={[styles.scheduleCard, active && styles.scheduleCardActive]}
                        onPress={() => setSelectedSchedule(item)}
                      >
                        <Text style={styles.scheduleTitle}>{t("Schedule found")}</Text>
                        <Text style={styles.scheduleLine}>
                          {t("Start time")}: {item.start_time || "-"}
                        </Text>
                        <Text style={styles.scheduleLine}>
                          {t("End time")}: {item.end_time || "-"}
                        </Text>
                        <View style={styles.scheduleBadge}>
                          <Text style={styles.scheduleBadgeText}>{scheduleLabel}</Text>
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={styles.noScheduleText}>
                    {t("EmployeeError")}{" "}
                    <Text style={styles.noScheduleDate}>{displayDate}.</Text>
                  </Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t("Relation")}</Text>
                  <Text style={styles.value}>{checkData?.display_name || "-"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t("Contract")}</Text>
                  <Text style={styles.value}>{checkData?.emp_contract_name || "-"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t("Current date")}</Text>
                  <Text style={styles.value}>{displayDate}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t("Currenttime")}</Text>
                  <Text style={styles.value}>{currentTime}</Text>
                </View>

                <Text style={styles.sectionTitle}>{t("Break Time")}</Text>
                <View style={styles.breakRow}>
                  {breakTimes.length ? (
                    breakTimes.map((item) => {
                      const formatted = formatBreakTime(item.break_time);
                      const active = formatted === selectedBreak;
                      return (
                        <Pressable
                          key={String(item.id ?? formatted)}
                          style={[styles.breakChip, active && styles.breakChipActive]}
                          onPress={() => setSelectedBreak(formatted)}
                        >
                          <Text style={[styles.breakText, active && styles.breakTextActive]}>
                            {formatted}
                          </Text>
                        </Pressable>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>{t("No break times available")}</Text>
                  )}
                </View>

                <Text style={styles.sectionTitle}>{t("Omschrijving")}</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  placeholder={t("Description")}
                  placeholderTextColor={Colors.placeholder}
                  style={styles.textArea}
                />
              </>
            )}

            <Pressable
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              disabled={submitting}
              onPress={handleSubmit}
            >
              {submitting ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {checkedIn ? t("Check Out") : t("Check In")}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      <SelectionBottomSheet
        visible={contractSheetVisible}
        title={t("Contract")}
        searchPlaceholder={t("Search")}
        confirmText={t("Select")}
        options={contractOptions}
        selectedIds={selectedContract ? [selectedContract.id] : []}
        onClose={() => setContractSheetVisible(false)}
        onConfirm={handleContractSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  label: { fontFamily: FONTS.LexendMedium, color: Colors.placeholder, fontSize: 14 },
  value: { fontFamily: FONTS.LexendRegular, color: AppColors.black, fontSize: 14 },
  scheduleCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    backgroundColor: AppColors.white,
  },
  scheduleCardActive: { borderColor: AppColors.primary, backgroundColor: "#F3F7FF" },
  scheduleTitle: { fontFamily: FONTS.LexendSemiBold, fontSize: 15, marginBottom: 8 },
  scheduleLine: { fontFamily: FONTS.LexendRegular, color: Colors.placeholder, marginBottom: 4 },
  scheduleBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scheduleBadgeText: { color: AppColors.white, fontFamily: FONTS.LexendMedium, fontSize: 12 },
  sectionTitle: { fontFamily: FONTS.LexendSemiBold, fontSize: 15, marginTop: 8 },
  breakRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  breakChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  breakChipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  breakText: { fontFamily: FONTS.LexendRegular, color: AppColors.black },
  breakTextActive: { color: AppColors.white },
  textArea: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
  },
  emptyText: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.placeholder,
    textAlign: "center",
    marginVertical: 12,
  },
  noScheduleText: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.red,
    fontSize: 13,
    marginVertical: 12,
  },
  noScheduleDate: {
    fontFamily: FONTS.LexendMedium,
    color: Colors.red,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.white,
    fontSize: 16,
  },
  buttonDisabled: { opacity: 0.7 },
});
