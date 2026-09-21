import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "./ScreenHeader";
import ListScreenBody, { listEmptyFeedback } from "./ListScreenBody";
import OptionBottomSheet, { type OptionItem } from "./OptionBottomSheet";
import { useApiErrorState } from "../hooks/useApiErrorState";
import { isEmptyDataMessage, parseApiError } from "../utils/apiError";
import {
  TIME_REGISTRATION_MONTHS,
  buildEmployeeScheduleLabel,
  buildProjectScheduleLabel,
  formatTimeRegistrationDate,
  formatTimeShort,
  getOvertimeBackground,
  type TimeRegistrationRow,
} from "../services/timeRegistrationService";
import { useScreenInsets } from "../utils/screenInsets";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import { LIST_UI } from "../utils/connectionTheme";
import { listScreenStyles } from "../utils/listScreenStyles";

type ScheduleMode = "employee" | "project";
type OvertimeMode = "employee" | "project";

type Props = {
  title: string;
  loadRows: (year: number, month: string) => Promise<TimeRegistrationRow[]>;
  scheduleMode?: ScheduleMode;
  overtimeMode?: OvertimeMode;
};

export default function TimeRegistrationTableScreen({
  title,
  loadRows,
  scheduleMode = "employee",
  overtimeMode = "employee",
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

  const [items, setItems] = useState<TimeRegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [yearSheetVisible, setYearSheetVisible] = useState(false);
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const yearOptions: OptionItem[] = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const value = currentYear - index + 1;
        return { id: String(value), label: String(value) };
      }),
    [currentYear]
  );

  const monthOptions: OptionItem[] = useMemo(
    () => TIME_REGISTRATION_MONTHS.map((item) => ({ id: item.id, label: t(item.label) })),
    [t]
  );

  const loadData = useCallback(
    async (pull = false) => {
      if (pull) setRefreshing(true);
      else setLoading(true);
      clearApiError();
      try {
        const data = await loadRows(year, month);
        setItems(data);
      } catch (error) {
        const parsed = parseApiError(error);
        if (isEmptyDataMessage(parsed.message)) {
          setItems([]);
        } else {
          captureApiError(error);
          setItems([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [year, month, loadRows, clearApiError, captureApiError]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderItem = ({ item }: { item: TimeRegistrationRow }) => {
    const scheduleLabel =
      scheduleMode === "project"
        ? buildProjectScheduleLabel(item)
        : buildEmployeeScheduleLabel(item);
    const breakTime = formatTimeShort(item.original_break_time || item.break_time || "--");
    const overtimeValue =
      overtimeMode === "project"
        ? item.total_time || "--"
        : item.formatted_total_over_time || "--";
    const overtimeBg = getOvertimeBackground(item.approved_disapproved);

    return (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.dateCell]}>
          {formatTimeRegistrationDate(item.current_date)}
        </Text>
        <Text style={[styles.cell, styles.timeCell]} numberOfLines={2}>
          {scheduleLabel}
        </Text>
        <Text style={styles.cell}>{breakTime}</Text>
        <Pressable
          style={[styles.cell, styles.overtimeCell, overtimeBg ? { backgroundColor: overtimeBg } : null]}
          onPress={() => {
            if (item.description) {
              Alert.alert(t("Omschrijving"), item.description);
            }
          }}
        >
          <Text style={styles.overtimeText}>
            {overtimeValue}
            {item.description ? " ⓘ" : ""}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={title} onBack={() => router.back()} />

      <View style={styles.filters}>
        <Pressable style={styles.filterChip} onPress={() => setYearSheetVisible(true)}>
          <Text style={styles.filterText}>{year}</Text>
        </Pressable>
        <Pressable style={styles.filterChip} onPress={() => setMonthSheetVisible(true)}>
          <Text style={styles.filterText}>
            {t(TIME_REGISTRATION_MONTHS.find((m) => m.id === month)?.label || "Month")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.dateCell]}>{t("Date")}</Text>
        <Text style={[styles.headerCell, styles.timeCell]}>
          {scheduleMode === "project" ? "CI/CO" : t("Schedule")}
        </Text>
        <Text style={styles.headerCell}>{t("Break")}</Text>
        <Text style={styles.headerCell}>{t("Overtime")}</Text>
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={items.length}
        apiError={apiError}
        onRetry={() => loadData()}
      >
        <FlatList
          data={items}
          keyExtractor={(item, index) => String(item.id ?? `${item.current_date}-${index}`)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: scrollPadding,
            paddingHorizontal: LIST_UI.screenPadding,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={listEmptyFeedback({
            loading,
            apiError,
            onRetry: () => loadData(),
            emptyMessage: t("No data found"),
          })}
        />
      </ListScreenBody>

      <OptionBottomSheet
        visible={yearSheetVisible}
        title={t("Year")}
        confirmText={t("Select")}
        options={yearOptions}
        onClose={() => setYearSheetVisible(false)}
        onConfirm={(option) => {
          setYear(Number(option.id));
          setYearSheetVisible(false);
        }}
      />

      <OptionBottomSheet
        visible={monthSheetVisible}
        title={t("Month")}
        confirmText={t("Select")}
        options={monthOptions}
        onClose={() => setMonthSheetVisible(false)}
        onConfirm={(option) => {
          setMonth(String(option.id));
          setMonthSheetVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  filterChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: AppColors.white,
  },
  filterText: { fontFamily: FONTS.LexendMedium, color: AppColors.black },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: 10,
    backgroundColor: "#EEF3FA",
  },
  headerCell: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 12,
    color: AppColors.black,
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LIST_UI.cardBorder,
    backgroundColor: AppColors.white,
  },
  cell: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.black,
    textAlign: "left",
  },
  dateCell: { flex: 0.9 },
  timeCell: { flex: 1.4 },
  overtimeCell: {
    borderRadius: 4,
    paddingVertical: 2,
    justifyContent: "center",
  },
  overtimeText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    textAlign: "left",
    color: AppColors.black,
  },
});
