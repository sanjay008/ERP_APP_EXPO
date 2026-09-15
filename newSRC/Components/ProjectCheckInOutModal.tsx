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
  fetchProjectCheckInOutState,
  fetchProjectsForCheckIn,
  formatBreakTime,
  getTodayFormats,
  performProjectCheckIn,
  performProjectCheckOut,
  type ProjectOption,
} from "../services/checkInOutService";
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
      <Text style={[styles.infoValue, label.includes("Address") && styles.infoValueWrap]}>
        {value || "-"}
      </Text>
    </View>
  );
}

export default function ProjectCheckInOutModal({
  visible,
  mode,
  onClose,
  onComplete,
}: Props) {
  const { t } = useTranslation();
  const { setToast } = useContext(RegisterBackContext);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);
  const [checkData, setCheckData] = useState<any>(null);
  const [breakTimes, setBreakTimes] = useState<Array<{ id?: string | number; break_time?: string }>>([]);
  const [selectedBreak, setSelectedBreak] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [projectSheetVisible, setProjectSheetVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(getTodayFormats().currentTime);

  const { displayDate } = useMemo(() => getTodayFormats(), []);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setCurrentTime(getTodayFormats().currentTime), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const loadCheckInData = useCallback(async () => {
    setLoading(true);
    try {
      const projectList = await fetchProjectsForCheckIn();
      setProjects(projectList);
      setSelectedProject(projectList[0] ?? null);
    } catch (error: any) {
      setProjects([]);
      setSelectedProject(null);
      Alert.alert(t("Error"), error?.message || t("Something went wrong"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadCheckOutData = useCallback(async () => {
    setLoading(true);
    try {
      const state = await fetchProjectCheckInOutState(displayDate);
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
      setProjectSheetVisible(false);
      return;
    }
    setDescription("");
    setAddress("");
    if (mode === "check-in") {
      loadCheckInData();
    } else {
      loadCheckOutData();
    }
  }, [visible, mode, loadCheckInData, loadCheckOutData]);

  const closeModal = () => {
    if (projectSheetVisible) {
      setProjectSheetVisible(false);
      return;
    }
    onClose();
  };

  const projectOptions = useMemo<SheetOption[]>(
    () =>
      projects.map((item) => ({
        id: item.id,
        label: item.project_name || "-",
        raw: item,
      })),
    [projects]
  );

  const handleProjectSelect = (options: SheetOption[]) => {
    const project = options[0]?.raw as ProjectOption;
    if (project) setSelectedProject(project);
    setProjectSheetVisible(false);
  };

  const handleCheckIn = async () => {
    if (!selectedProject) {
      Alert.alert(t("Error"), t("select Project"));
      return;
    }
    if (!address.trim()) {
      Alert.alert(t("Error"), t("Current address"));
      return;
    }
    setSubmitting(true);
    try {
      await performProjectCheckIn({
        project: selectedProject,
        currentDate: displayDate,
        currentTime,
        address: address.trim(),
      });
      setToast({ top: 45, text: t("EmployeeCheckIn"), type: "success", visible: true });
      onComplete();
      onClose();
    } catch (error: any) {
      Alert.alert(t("Error"), error?.message || t("Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!checkData) return;
    setSubmitting(true);
    try {
      await performProjectCheckOut({
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

  const projectName =
    checkData?.project_names?.project_name || selectedProject?.project_name || "-";

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
        ) : mode === "check-in" ? (
          <>
            <FormSelectField
              label={t("Projects")}
              required
              placeholder={t("Projects")}
              value={selectedProject?.project_name}
              onPress={() => {
                if (projects.length === 0) {
                  Alert.alert(t("Error"), t("No Data Found"));
                  return;
                }
                setProjectSheetVisible(true);
              }}
            />

            <Text style={styles.sectionTitle}>{t("Current address")}</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder={t("Current address")}
              placeholderTextColor={Colors.placeholder}
              style={styles.input}
            />

            <InfoRow label={t("Current date")} value={displayDate} />
            <InfoRow label={t("Currenttime")} value={currentTime} />

            {selectedProject?.gmaps_working_address ? (
              <>
                <Text style={styles.sectionTitle}>{t("Working Address")}</Text>
                <Text style={styles.workingAddress}>{selectedProject.gmaps_working_address}</Text>
              </>
            ) : null}
          </>
        ) : (
          <>
            <InfoRow label={t("Project")} value={projectName} />
            <InfoRow label={t("Current date")} value={displayDate} />
            <InfoRow label={t("Currenttime")} value={currentTime} />
            <InfoRow
              label={`${t("Check In")} ${t("Address")}`}
              value={checkData?.currect_address || checkData?.gmaps_working_address}
            />

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
          disabled={submitting || loading}
          onPress={mode === "check-in" ? handleCheckIn : handleCheckOut}
        >
          {submitting ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === "check-in" ? t("Check In") : t("Check Out")}
            </Text>
          )}
        </Pressable>
      </FormModal>

      {visible ? (
        <SelectionBottomSheet
          visible={projectSheetVisible}
          title={t("Projects")}
          searchPlaceholder={t("Search")}
          confirmText={t("Select")}
          options={projectOptions}
          selectedIds={selectedProject ? [selectedProject.id] : []}
          onClose={() => setProjectSheetVisible(false)}
          onConfirm={handleProjectSelect}
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
    gap: 8,
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
  infoValueWrap: { textAlign: "right" },
  sectionTitle: { fontFamily: FONTS.LexendSemiBold, fontSize: 15, marginTop: 12, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
    marginBottom: 8,
  },
  workingAddress: {
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
    fontSize: 14,
    marginBottom: 8,
  },
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
