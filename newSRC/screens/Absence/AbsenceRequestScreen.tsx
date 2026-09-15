import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import OptionBottomSheet, { type OptionItem } from "../../Components/OptionBottomSheet";
import ApiFeedback from "../../Components/ApiFeedback";
import ConfirmBottomSheet from "../../Components/ConfirmBottomSheet";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  deleteLeaveAbsence,
  fetchAbsenceLeaves,
  fetchAdditionalLeaves,
  fetchHrStatuses,
  fetchLeaveAbsenceList,
  fetchLeaveTimelineDates,
  fetchLeaveTypes,
  fetchSwitchDates,
  formatAbsenceLogDate,
  storeAbsenceRequest,
  storeLeaveRequest,
  submitLeaveAbsence,
  updateLeaveAbsenceStatus,
  type AbsenceLeaveItem,
  type LeaveTimelineDate,
  type LeaveTypeItem,
} from "../../services/absenceService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { Colors } from "../../utils/colors";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

type SectionKey = "leave" | "additional" | "absence" | "switch";

function RequestCard({
  item,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onSubmit,
  onStatusPress,
  statusOptions,
  t,
}: {
  item: AbsenceLeaveItem;
  expanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
  onStatusPress?: () => void;
  statusOptions?: boolean;
  t: (key: string) => string;
}) {
  const statusColor = item.status_data?.color || AppColors.primary;
  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>
            {t(item.employerscheduledata?.day || "-")} ({item.total_hours || "N/A"})
          </Text>
          {item.leave_absence_store === 0 ? (
            <Pressable style={[styles.statusBadge, { backgroundColor: AppColors.primary }]} onPress={onSubmit}>
              <Text style={styles.statusText}>{t("Submit")}</Text>
            </Pressable>
          ) : statusOptions ? (
            <Pressable style={[styles.statusBadge, { backgroundColor: statusColor }]} onPress={onStatusPress}>
              <Text style={styles.statusText}>{t(item.status_data?.status_name || "Status")}</Text>
            </Pressable>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{t(item.status_data?.status_name || "-")}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>{item.date || "-"}</Text>
          <Text style={styles.metaText}>{t(item.leave_type_data?.leave_type_name || "-")}</Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.expanded}>
          <Row label={t("Begin & Einde")} value={
            item.start_time && item.end_time
              ? `${item.start_time} - ${item.end_time}\n${item.reason_field || ""}`
              : `${item.employerscheduledata?.start_time || "-"} - ${item.employerscheduledata?.end_time || "-"}\n${item.reason_field || "-"}`
          } />
          <Row
            label={t("Contract Leave")}
            value={item.leave_type_data?.leave_hour_system === 1 ? t("Yes") : t("No")}
          />
          <View style={styles.actions}>
            {item.permissions?.permission_edit || item.permission?.edit ? (
              <Pressable onPress={onEdit}>
                <Text style={styles.actionText}>{t("Edit")}</Text>
              </Pressable>
            ) : null}
            {item.permissions?.permission_delete || item.permission?.delete ? (
              <Pressable onPress={onDelete}>
                <Text style={[styles.actionText, styles.deleteText]}>{t("Delete")}</Text>
              </Pressable>
            ) : null}
          </View>
          {item.leave_log ? (
            <Text style={styles.logText}>
              Log: {formatAbsenceLogDate(item.leave_log.created_at)} {item.leave_log.user_name?.username || ""}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function AbsenceRequestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    contractId?: string;
    employeeName?: string;
    relatiesId?: string;
    color?: string;
  }>();
  const { top, scrollPadding } = useScreenInsets();
  const { permissions } = useAppData();
  const { setToast } = useContext(RegisterBackContext);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const contractId = params.contractId || "";
  const employeeName = params.employeeName || "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<AbsenceLeaveItem[]>([]);
  const [additionalLeaves, setAdditionalLeaves] = useState<AbsenceLeaveItem[]>([]);
  const [absenceLeaves, setAbsenceLeaves] = useState<AbsenceLeaveItem[]>([]);
  const [switchDates, setSwitchDates] = useState<AbsenceLeaveItem[]>([]);
  const [statuses, setStatuses] = useState<Array<{ id: string | number; status_name?: string; color?: string }>>([]);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | number | null>(null);
  const [statusTarget, setStatusTarget] = useState<AbsenceLeaveItem | null>(null);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);

  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [absenceModalVisible, setAbsenceModalVisible] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [timelineDates, setTimelineDates] = useState<LeaveTimelineDate[]>([]);
  const [selectedDates, setSelectedDates] = useState<Record<string, LeaveTimelineDate>>({});
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveTypeItem | null>(null);
  const [leaveReason, setLeaveReason] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceHours, setAbsenceHours] = useState("");
  const [typeSheetVisible, setTypeSheetVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (pull = false) => {
    if (!contractId) return;
    if (pull) setRefreshing(true);
    else setLoading(true);
    clearApiError();
    try {
      const [leave, additional, absence, switchData, statusList] = await Promise.all([
        fetchLeaveAbsenceList(contractId, params.relatiesId),
        fetchAdditionalLeaves(contractId),
        fetchAbsenceLeaves(contractId),
        fetchSwitchDates(contractId),
        fetchHrStatuses(),
      ]);
      setLeaveRequests(leave);
      setAdditionalLeaves(additional);
      setAbsenceLeaves(absence);
      setSwitchDates(switchData);
      setStatuses(statusList);
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [captureApiError, clearApiError, contractId, params.relatiesId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openLeaveModal = async () => {
    try {
      const [types, dates] = await Promise.all([
        fetchLeaveTypes(contractId),
        fetchLeaveTimelineDates(contractId),
      ]);
      setLeaveTypes(types);
      setTimelineDates(dates);
      setSelectedDates({});
      setSelectedLeaveType(null);
      setLeaveReason("");
      setLeaveModalVisible(true);
    } catch (error) {
      captureApiError(error);
    }
  };

  const openAbsenceModal = async () => {
    try {
      const dates = await fetchLeaveTimelineDates(contractId);
      setTimelineDates(dates);
      setSelectedDates({});
      setAbsenceReason("");
      setAbsenceHours("");
      setAbsenceModalVisible(true);
    } catch (error) {
      captureApiError(error);
    }
  };

  const toggleDate = (entry: LeaveTimelineDate) => {
    setSelectedDates((prev) => {
      const next = { ...prev };
      if (next[entry.date]) {
        delete next[entry.date];
      } else {
        next[entry.date] = entry;
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await deleteLeaveAbsence(deleteTarget);
      if (response?.status) {
        setDeleteTarget(null);
        loadData(true);
      } else {
        Alert.alert(t("Error"), response?.message || t("Something went wrong"));
      }
    } catch (error) {
      captureApiError(error);
    }
  };

  const handleSubmitRequest = async (leaveId: string | number) => {
    try {
      await submitLeaveAbsence(leaveId);
      setToast({ top: 45, text: t("Submitted"), type: "success", visible: true });
      loadData(true);
    } catch (error) {
      Alert.alert(t("Error"), error instanceof Error ? error.message : t("Something went wrong"));
    }
  };

  const statusOptions: OptionItem[] = useMemo(
    () => statuses.map((item) => ({ id: String(item.id), label: t(item.status_name || "-") })),
    [statuses, t]
  );

  const leaveTypeOptions = useMemo<SheetOption[]>(
    () =>
      leaveTypes.map((item) => ({
        id: item.id,
        label: item.leave_type_name || "-",
        raw: item,
      })),
    [leaveTypes]
  );

  const createLeave = async () => {
    const selected = Object.values(selectedDates);
    if (!selected.length || !selectedLeaveType) {
      Alert.alert(t("Error"), t("Please fill required fields"));
      return;
    }
    setSubmitting(true);
    try {
      await storeLeaveRequest({
        contract_id: contractId,
        relaties_id: params.relatiesId,
        leave_type: selectedLeaveType.id,
        date: selected.map((d) => d.date).join(","),
        schedule_id: selected.map((d) => d.schedule_id).join(","),
        total_hours: selected.map((d) => d.total_hours).join(","),
        reason_field: leaveReason,
      });
      setLeaveModalVisible(false);
      setToast({ top: 45, text: t("Leave created successfully"), type: "success", visible: true });
      loadData(true);
    } catch (error) {
      Alert.alert(t("Error"), error instanceof Error ? error.message : t("Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const createAbsence = async () => {
    const selected = Object.values(selectedDates);
    if (!selected.length || !absenceHours.trim()) {
      Alert.alert(t("Error"), t("Please fill required fields"));
      return;
    }
    setSubmitting(true);
    try {
      await storeAbsenceRequest({
        contract_id: contractId,
        relaties_id: params.relatiesId,
        date: selected.map((d) => d.date).join(","),
        schedule_id: selected.map((d) => d.schedule_id).join(","),
        total_hours: absenceHours,
        absence_reason: absenceReason,
      });
      setAbsenceModalVisible(false);
      setToast({ top: 45, text: t("Absence created successfully"), type: "success", visible: true });
      loadData(true);
    } catch (error) {
      Alert.alert(t("Error"), error instanceof Error ? error.message : t("Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const renderSection = (title: string, data: AbsenceLeaveItem[], section: SectionKey) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>{t("No Request Found.")}</Text>
      ) : (
        data.map((item) => (
          <RequestCard
            key={`${section}-${item.id}`}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
            onEdit={() =>
              router.push({
                pathname: "/(app)/absence-requests/leave/[leaveId]",
                params: {
                  leaveId: String(item.id),
                  color: params.color || "",
                },
              })
            }
            onDelete={() => setDeleteTarget(item.id)}
            onSubmit={() => handleSubmitRequest(item.id)}
            onStatusPress={() => {
              setStatusTarget(item);
              setStatusSheetVisible(true);
            }}
            statusOptions={Boolean(item.status_permission?.read)}
            t={t}
          />
        ))
      )}
    </View>
  );

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("AbsenceRequest")} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: scrollPadding }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={AppColors.primary} />
        }
      >
        {loading && !refreshing ? (
          <ApiFeedback loading />
        ) : apiError ? (
          <ApiFeedback error={apiError} onRetry={() => loadData()} />
        ) : (
          <>
            <Text style={styles.employeeName}>{employeeName}</Text>
            <View style={styles.actionsRow}>
              {permissions?.leave?.create === 1 ? (
                <Pressable style={styles.actionButton} onPress={openLeaveModal}>
                  <Text style={styles.actionButtonText}>{t("+ Leave")}</Text>
                </Pressable>
              ) : null}
              {permissions?.absence?.create === 1 ? (
                <Pressable style={styles.actionButton} onPress={openAbsenceModal}>
                  <Text style={styles.actionButtonText}>{t("+ Absence")}</Text>
                </Pressable>
              ) : null}
            </View>

            {renderSection(t("Leave Requests"), leaveRequests, "leave")}
            {renderSection(t("Additional Leaves"), additionalLeaves, "additional")}
            {renderSection(t("Absence Leaves"), absenceLeaves, "absence")}
            {renderSection(t("Switch dates"), switchDates, "switch")}
          </>
        )}
      </ScrollView>

      <Modal visible={leaveModalVisible} transparent animationType="slide" onRequestClose={() => setLeaveModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("+ Leave")}</Text>
            <FormSelectField
              label={t("Type")}
              required
              placeholder={t("Select")}
              value={selectedLeaveType?.leave_type_name}
              onPress={() => setTypeSheetVisible(true)}
            />
            <Text style={styles.modalLabel}>{t("Datum")}</Text>
            <ScrollView style={styles.dateList} nestedScrollEnabled>
              {timelineDates.map((entry) => {
                const selected = Boolean(selectedDates[entry.date]);
                return (
                  <Pressable key={entry.date} style={[styles.dateItem, selected && styles.dateItemSelected]} onPress={() => toggleDate(entry)}>
                    <Text style={styles.dateItemText}>{entry.date}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <TextInput
              value={leaveReason}
              onChangeText={setLeaveReason}
              placeholder={t("Description")}
              placeholderTextColor={Colors.placeholder}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setLeaveModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>{t("Cancel")}</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} disabled={submitting} onPress={createLeave}>
                <Text style={styles.primaryButtonText}>{t("Save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={absenceModalVisible} transparent animationType="slide" onRequestClose={() => setAbsenceModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("+ Absence")}</Text>
            <Text style={styles.modalLabel}>{t("Datum")}</Text>
            <ScrollView style={styles.dateList} nestedScrollEnabled>
              {timelineDates.map((entry) => {
                const selected = Boolean(selectedDates[entry.date]);
                return (
                  <Pressable key={entry.date} style={[styles.dateItem, selected && styles.dateItemSelected]} onPress={() => toggleDate(entry)}>
                    <Text style={styles.dateItemText}>{entry.date}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <TextInput
              value={absenceHours}
              onChangeText={setAbsenceHours}
              placeholder={t("Hours")}
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.placeholder}
              style={styles.input}
            />
            <TextInput
              value={absenceReason}
              onChangeText={setAbsenceReason}
              placeholder={t("Description")}
              placeholderTextColor={Colors.placeholder}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setAbsenceModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>{t("Cancel")}</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} disabled={submitting} onPress={createAbsence}>
                <Text style={styles.primaryButtonText}>{t("Save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SelectionBottomSheet
        visible={typeSheetVisible}
        title={t("Type")}
        searchPlaceholder={t("Search")}
        confirmText={t("Select")}
        options={leaveTypeOptions}
        selectedIds={selectedLeaveType ? [selectedLeaveType.id] : []}
        onClose={() => setTypeSheetVisible(false)}
        onConfirm={(options) => {
          setSelectedLeaveType(options[0]?.raw as LeaveTypeItem);
          setTypeSheetVisible(false);
        }}
      />

      <OptionBottomSheet
        visible={statusSheetVisible}
        title={t("Status")}
        confirmText={t("Select")}
        options={statusOptions}
        onClose={() => setStatusSheetVisible(false)}
        onConfirm={async (option) => {
          if (!statusTarget) return;
          try {
            const response = await updateLeaveAbsenceStatus(statusTarget.id, option.id);
            Alert.alert(t("Success"), response?.message || t("Updated"));
            loadData(true);
          } catch (error) {
            captureApiError(error);
          } finally {
            setStatusSheetVisible(false);
            setStatusTarget(null);
          }
        }}
      />

      <ConfirmBottomSheet
        visible={Boolean(deleteTarget)}
        title={t("Delete")}
        message={t("Are you sure you want to delete?")}
        confirmText={t("Delete")}
        cancelText={t("Cancel")}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  employeeName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    marginHorizontal: LIST_UI.screenPadding,
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionButtonText: { color: AppColors.white, fontFamily: FONTS.LexendSemiBold },
  section: { paddingHorizontal: LIST_UI.screenPadding, marginBottom: 16 },
  sectionTitle: { fontFamily: FONTS.LexendSemiBold, fontSize: 17, marginBottom: 10 },
  emptyText: { fontFamily: FONTS.LexendRegular, color: Colors.placeholder, textAlign: "center", paddingVertical: 16 },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: LIST_UI.cardRadius,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    padding: 12,
    marginBottom: LIST_UI.cardGap,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontFamily: FONTS.LexendMedium, fontSize: 15 },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  metaText: { fontFamily: FONTS.LexendRegular, color: Colors.placeholder, fontSize: 13 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8 },
  statusText: { color: AppColors.white, fontFamily: FONTS.LexendMedium, fontSize: 12 },
  expanded: { marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LIST_UI.cardBorder, paddingTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, gap: 12 },
  rowLabel: { flex: 1, fontFamily: FONTS.LexendMedium, color: AppColors.black },
  rowValue: { flex: 1, textAlign: "right", fontFamily: FONTS.LexendRegular, color: Colors.placeholder },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 8 },
  actionText: { fontFamily: FONTS.LexendSemiBold, color: AppColors.primary },
  deleteText: { color: Colors.dicline },
  logText: { marginTop: 8, textAlign: "right", fontFamily: FONTS.LexendRegular, color: Colors.placeholder, fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "85%",
  },
  modalTitle: { fontFamily: FONTS.LexendSemiBold, fontSize: 18, marginBottom: 12 },
  modalLabel: { fontFamily: FONTS.LexendMedium, marginBottom: 8 },
  dateList: { maxHeight: 180, marginBottom: 12 },
  dateItem: {
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  dateItemSelected: { borderColor: AppColors.primary, backgroundColor: "#F3F7FF" },
  dateItemText: { fontFamily: FONTS.LexendRegular, color: AppColors.black },
  input: {
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: { fontFamily: FONTS.LexendSemiBold, color: AppColors.black },
  primaryButton: {
    flex: 1,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: { fontFamily: FONTS.LexendSemiBold, color: AppColors.white },
});
