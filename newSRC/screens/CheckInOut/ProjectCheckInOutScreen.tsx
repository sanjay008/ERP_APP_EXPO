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
import ApiFeedback from "../../Components/ApiFeedback";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchProjectCheckInOutState,
  fetchProjectsForCheckIn,
  formatBreakTime,
  getTodayFormats,
  performProjectCheckIn,
  performProjectCheckOut,
  type ProjectOption,
} from "../../services/checkInOutService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";

export default function ProjectCheckInOutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkData, setCheckData] = useState<any>(null);
  const [breakTimes, setBreakTimes] = useState<Array<{ id?: string | number; break_time?: string }>>([]);
  const [selectedBreak, setSelectedBreak] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [projectSheetVisible, setProjectSheetVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(getTodayFormats().currentTime);

  const { displayDate, apiDate } = useMemo(() => getTodayFormats(), []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getTodayFormats().currentTime), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    clearApiError();
    try {
      const projectList = await fetchProjectsForCheckIn();
      setProjects(projectList);

      const checkState = await fetchProjectCheckInOutState(displayDate);
      setCheckedIn(checkState.checkedIn);
      setCheckData(checkState.checkData);
      setBreakTimes(checkState.breakTimes);
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [displayDate, captureApiError, clearApiError]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const projectOptions = useMemo<SheetOption[]>(
    () =>
      projects.map((item) => ({
        id: item.id,
        label: item.project_name || "-",
        raw: item,
      })),
    [projects]
  );

  const handleSubmit = async () => {
    if (!checkedIn) {
      if (!selectedProject) {
        Alert.alert(t("Error"), t("Select project"));
        return;
      }
      setSubmitting(true);
      try {
        await performProjectCheckIn({
          project: selectedProject,
          currentDate: displayDate,
          currentTime,
          address,
        });
        setToast({ top: 45, text: t("Check In"), type: "success", visible: true });
        const state = await fetchProjectCheckInOutState(displayDate);
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
      await performProjectCheckOut({
        checkData,
        selectedBreak,
        description,
        currentDate: displayDate,
        currentTime,
      });
      setToast({ top: 45, text: t("Check Out"), type: "success", visible: true });
      setDescription("");
      const state = await fetchProjectCheckInOutState(displayDate);
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

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <ApiFeedback error={apiError} onRetry={loadInitial} />

        {loading ? (
          <ActivityIndicator color={AppColors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {!checkedIn ? (
              <>
                <FormSelectField
                  label={t("Project Name")}
                  required
                  placeholder={t("Select project name")}
                  value={selectedProject?.project_name}
                  onPress={() => setProjectSheetVisible(true)}
                />
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t("Current date")}</Text>
                  <Text style={styles.value}>{displayDate}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t("Currenttime")}</Text>
                  <Text style={styles.value}>{currentTime}</Text>
                </View>
                <Text style={styles.sectionTitle}>{t("Location")}</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder={t("Location")}
                  placeholderTextColor={Colors.placeholder}
                  style={styles.input}
                />
              </>
            ) : (
              <>
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
                  {breakTimes.map((item) => {
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
                  })}
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
        visible={projectSheetVisible}
        title={t("Project Name")}
        searchPlaceholder={t("Search")}
        confirmText={t("Select")}
        options={projectOptions}
        selectedIds={selectedProject ? [selectedProject.id] : []}
        onClose={() => setProjectSheetVisible(false)}
        onConfirm={(options) => {
          setSelectedProject(options[0]?.raw as ProjectOption);
          setProjectSheetVisible(false);
        }}
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
  sectionTitle: { fontFamily: FONTS.LexendSemiBold, fontSize: 15, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
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
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { fontFamily: FONTS.LexendSemiBold, color: AppColors.white, fontSize: 16 },
  buttonDisabled: { opacity: 0.7 },
});
