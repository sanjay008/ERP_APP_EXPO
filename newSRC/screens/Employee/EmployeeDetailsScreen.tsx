import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import {
  fetchEmployeeContractDetails,
  formatEmployeeDate,
  type EmployeeContractDetail,
  type LeaveDetailRow,
} from "../../services/employeeService";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

function DetailCard({
  title,
  rows,
}: {
  title?: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[styles.row, index === rows.length - 1 && styles.rowLast]}
        >
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function EmployeeDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; color?: string; title?: string }>();

  const [data, setData] = useState<EmployeeContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      const response = await fetchEmployeeContractDetails(params.id);
      if (response?.status && response.data) {
        setData(response.data);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const contract = data?.contract;

  const contractRows = useMemo(
    () => [
      { label: t("Werkgever"), value: data?.display_name || "-" },
      {
        label: t("COA"),
        value: contract?.cao_contract === "true" ? t("Yes") : t("No"),
      },
      {
        label: t("Datum"),
        value:
          contract?.from && contract?.end
            ? `${formatEmployeeDate(contract.from)} -- ${formatEmployeeDate(contract.end)} (${contract.contract_month || "-"})`
            : "-",
      },
      {
        label: t("Contact Type"),
        value: contract?.contract_template_data?.template_name || "-",
      },
      {
        label: t("Contract uren"),
        value:
          contract?.contract_hour_per_week &&
          contract?.minimal_hour_per_week &&
          contract?.maximum_hour_per_week
            ? `${contract.contract_hour_per_week} - min: ${contract.minimal_hour_per_week} - max: ${contract.maximum_hour_per_week}`
            : "-",
      },
    ],
    [contract, data?.display_name, t]
  );

  const leaveEntries = useMemo(
    () => Object.entries(data?.leave_details || {}) as Array<[string, LeaveDetailRow]>,
    [data?.leave_details]
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={params.title ? t(params.title) : t("Details")} />

      {loading && !data ? (
        <ApiFeedback loading />
      ) : apiError && !data ? (
        <ApiFeedback error={apiError} onRetry={loadDetails} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>{contract?.contract_name || "-"}</Text>
            {contract?.status_name ? (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: contract.color || AppColors.primary },
                ]}
              >
                <Text style={styles.statusText}>{t(contract.status_name)}</Text>
              </View>
            ) : null}
          </View>

          <DetailCard rows={contractRows} />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("Leave Details")}</Text>
            <View style={styles.leaveHeader}>
              <Text style={[styles.leaveHeaderText, styles.leaveTypeCol]} />
              <Text style={styles.leaveHeaderText}>{t("Start")}</Text>
              <Text style={styles.leaveHeaderText}>{t("Approved")}</Text>
              <Text style={styles.leaveHeaderText}>{t("Left")}</Text>
            </View>
            {leaveEntries.map(([type, details]) => (
              <View key={type} style={styles.leaveRow}>
                <Text style={[styles.leaveType, styles.leaveTypeCol]}>{t(type)}</Text>
                <Text style={styles.leaveValue}>{details.start ?? "-"}</Text>
                <Text style={styles.leaveValue}>{details.approved ?? "-"}</Text>
                <Text style={styles.leaveValue}>{details.left ?? "-"}</Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={styles.label}>{t("Afwezing")}</Text>
              <Text style={styles.value}>
                {data?.Afwezig?.total_hours ?? "-"} {t("uren")} / {data?.Afwezig?.days ?? "-"}{" "}
                {t("dagen")}
              </Text>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.label}>{t("Total hours left")}</Text>
              <Text style={styles.value}>{contract?.total_leave_hours ?? "-"}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  content: listScreenStyles.detailContent,
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCard: {
    ...listScreenStyles.detailCard,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: LIST_UI.iconTextGap,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  statusBadge: listScreenStyles.statusBadge,
  statusText: listScreenStyles.statusBadgeText,
  card: {
    ...listScreenStyles.detailCard,
    paddingHorizontal: LIST_UI.cardPadding,
  },
  cardTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    paddingTop: LIST_UI.cardPadding,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dotted",
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  label: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    flex: 1,
  },
  value: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    flex: 1,
    textAlign: "right",
  },
  leaveHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
  },
  leaveHeaderText: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.subtitle,
    textAlign: "center",
  },
  leaveTypeCol: { flex: 1.2, textAlign: "left" },
  leaveRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dotted",
  },
  leaveType: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
  },
  leaveValue: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.black,
    textAlign: "center",
  },
});
