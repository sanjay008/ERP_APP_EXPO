import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import FormModal from "./FormModal";
import FormSelectField from "./FormSelectField";
import SelectionBottomSheet, { type SheetOption } from "./SelectionBottomSheet";
import { RegisterBackContext } from "../constants/GoBackContext";
import {
  fetchActiveEmployeeContracts,
  fetchCheckInOutState,
  fetchContractSchedule,
  formatBreakTime,
  getTodayFormats,
  isAlreadyCheckedInError,
  performCheckIn,
  performCheckOut,
  pickDefaultContract,
  type EmployeeContractOption,
  type ScheduleItem,
} from "../services/checkInOutService";
import { getApiErrorMessage } from "../utils/validation";
import { AppColors } from "../utils/theme";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";

type Mode = "check-in" | "check-out";

type Props = {
  visible: boolean;
  mode: Mode;
  onClose: () => void;
  onComplete: () => void;
};

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
}

export default function EmployeeCheckInOutModal({
  visible,
  mode,
  onClose,
  onComplete,
}: Props) {
  const { t } = useTranslation();
  const { setToast } = useContext(RegisterBackContext);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeMode, setActiveMode] = useState<Mode>(mode);
  const [contracts, setContracts] = useState<EmployeeContractOption[]>([]);
  const [selectedContract, setSelectedContract] = useState<EmployeeContractOption | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [scheduleLabel, setScheduleLabel] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [checkData, setCheckData] = useState<any>(null);
  const [breakTimes, setBreakTimes] = useState<Array<{ id?: string | number; break_time?: string }>>([]);
  const [selectedBreak, setSelectedBreak] = useState("");
  const [description, setDescription] = useState("");
  const [contractSheetVisible, setContractSheetVisible] = useState(false);
  const [noSchedule, setNoSchedule] = useState("");
  const [currentTime, setCurrentTime] = useState(getTodayFormats().currentTime);

  const { displayDate, apiDate } = useMemo(() => getTodayFormats(), []);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setCurrentTime(getTodayFormats().currentTime), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const loadCheckInData = useCallback(async () => {
    setLoading(true);
    setNoSchedule("");
    try {
      const employeeContracts = await fetchActiveEmployeeContracts();
      setContracts(employeeContracts);
      const first = pickDefaultContract(employeeContracts);
      setSelectedContract(first);
      if (first) {
        const scheduleRes = await fetchContractSchedule(first.id, apiDate);
        setSchedules(scheduleRes.schedules);
        setScheduleLabel(scheduleRes.scheduleLabel);
        const firstSchedule = scheduleRes.schedules[0] ?? null;
        setSelectedSchedule(firstSchedule);
        setNoSchedule(firstSchedule ? "" : t("EmployeeError"));
      } else {
        setSchedules([]);
        setSelectedSchedule(null);
        setNoSchedule(t("EmployeeError"));
      }
    } catch {
      setNoSchedule(t("EmployeeError"));
    } finally {
      setLoading(false);
    }
  }, [apiDate, t]);

  const loadCheckOutData = useCallback(async () => {
    setLoading(true);
    try {
      const state = await fetchCheckInOutState(displayDate);
      setCheckData(state.checkData);
      setBreakTimes(state.breakTimes);
      if (state.breakTimes[0]) {
        setSelectedBreak(formatBreakTime(state.breakTimes[0].break_time));
      }
    } finally {
      setLoading(false);
    }
  }, [displayDate]);

  useEffect(() => {
    if (!visible) {
      setContractSheetVisible(false);
      return;
    }
    setDescription("");
    setActiveMode(mode);
    if (mode === "check-in") {
      loadCheckInData();
    } else {
      loadCheckOutData();
    }
  }, [visible, mode, loadCheckInData, loadCheckOutData]);

  const closeModal = () => {
    if (contractSheetVisible) {
      setContractSheetVisible(false);
      return;
    }
    onClose();
  };

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
      setNoSchedule(scheduleRes.schedules.length ? "" : t("EmployeeError"));
    } catch {
      setNoSchedule(t("EmployeeError"));
    }
  };

  const handleCheckIn = async () => {
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
      onComplete();
      onClose();
    } catch (error: any) {
      if (isAlreadyCheckedInError(error)) {
        setActiveMode("check-out");
        await loadCheckOutData();
        setToast({
          top: 45,
          text: t("This relaties has already checked in please checkout first."),
          type: "error",
          visible: true,
        });
        return;
      }
      Alert.alert(t("Error"), getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
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
      onComplete();
      onClose();
    } catch (error: any) {
      Alert.alert(t("Error"), error?.message || t("Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FormModal visible={visible} onClose={closeModal} scrollable>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t("Check In / Out")}</Text>
          <Pressable onPress={closeModal} hitSlop={8}>
            <Image source={Images.CloseIcon} style={styles.closeIcon} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 24 }} />
        ) : activeMode === "check-in" ? (
          <>
            <FormSelectField
              label={t("Contract")}
              required
              placeholder={t("Select contract")}
              value={selectedContract?.title}
              onPress={() => setContractSheetVisible(true)}
            />

            <InfoRow label={t("Current date")} value={displayDate} />
            <InfoRow label={t("Currenttime")} value={currentTime} />

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
            ) : noSchedule ? (
              <Text style={styles.noScheduleText}>
                {noSchedule}{" "}
                <Text style={styles.noScheduleDate}>{displayDate}.</Text>
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <InfoRow label={t("Relation")} value={checkData?.display_name} />
            <InfoRow label={t("Contract")} value={checkData?.emp_contract_name} />
            <InfoRow label={t("Current date")} value={displayDate} />
            <InfoRow label={t("Currenttime")} value={currentTime} />

            <Text style={styles.sectionTitle}>{t("Break Time")}</Text>
            <View style={styles.breakRow}>
              {breakTimes.length ? (
                [...breakTimes]
                  .sort(
                    (a, b) =>
                      (a.break_time || "").localeCompare(b.break_time || "")
                  )
                  .map((item) => {
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
          disabled={submitting || loading}
          onPress={activeMode === "check-in" ? handleCheckIn : handleCheckOut}
        >
          {submitting ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {activeMode === "check-in" ? t("Check In") : t("Check Out")}
            </Text>
          )}
        </Pressable>
      </FormModal>

      {visible ? (
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
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    color: AppColors.black,
  },
  closeIcon: { width: 22, height: 22 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  infoLabel: { fontFamily: FONTS.LexendMedium, color: Colors.placeholder, fontSize: 14 },
  infoValue: {
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  scheduleCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginTop: 10,
    backgroundColor: AppColors.white,
  },
  scheduleCardActive: { borderColor: AppColors.primary, backgroundColor: "#F3F7FF" },
  scheduleTitle: { fontFamily: FONTS.LexendSemiBold, fontSize: 14, marginBottom: 6 },
  scheduleLine: { fontFamily: FONTS.LexendRegular, color: Colors.placeholder, marginBottom: 4 },
  scheduleBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: AppColors.primary,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scheduleBadgeText: { color: AppColors.white, fontFamily: FONTS.LexendMedium, fontSize: 12 },
  sectionTitle: { fontFamily: FONTS.LexendSemiBold, fontSize: 15, marginTop: 12, marginBottom: 8 },
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
    minHeight: 80,
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
