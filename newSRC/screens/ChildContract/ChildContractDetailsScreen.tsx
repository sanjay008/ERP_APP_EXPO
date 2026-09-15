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
  fetchChildContractDetails,
  type ChildContractDetail,
  type ChildScheduleBlock,
} from "../../services/childContractService";
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

function ScheduleBlockCard({ item }: { item: ChildScheduleBlock }) {
  const { t } = useTranslation();
  const currency = item.company_currency || "";

  return (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleTop}>
        <Text style={styles.scheduleDay}>{item.day || "-"}</Text>
        <Text style={styles.scheduleBlockName}>{item.block_time?.block_name || "-"}</Text>
        <Text style={styles.scheduleRate}>{item.rate_amount ?? "-"}</Text>
      </View>
      <View style={styles.scheduleMeta}>
        <Text style={styles.scheduleMetaText}>
          {item.block_time?.total_time || "-"} {t("uur")}
        </Text>
        <Text style={styles.scheduleMetaText}>
          {item.start_time || "-"} - {item.end_time || "-"}
        </Text>
        <Text style={styles.scheduleMetaText}>
          {currency} {item.rate?.amount ?? "-"}
        </Text>
      </View>
      {[
        { label: t("Hours"), value: String(item.total_hours ?? "-") },
        {
          label: t("Hprice"),
          value: `${currency} ${item.rate?.amount ?? "-"}`,
        },
        {
          label: t("Dprice"),
          value: `${currency} ${item.day_price ?? "-"}`,
        },
        {
          label: t("WKs/Thrs"),
          value: `${item.weeks_count ?? "-"} / ${item.weeks_hours ?? "-"}`,
        },
        {
          label: t("Yprice"),
          value: `${currency} ${item.year_price ?? "-"}`,
        },
      ].map((row) => (
        <View key={row.label} style={styles.scheduleRow}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ChildContractDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; color?: string; title?: string }>();

  const [data, setData] = useState<ChildContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      const response = await fetchChildContractDetails(params.id);
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

  const currency = data?.company_currency || "";

  const infoRows = useMemo(
    () => [
      { label: t("Child Name"), value: data?.child_data?.display_name || "-" },
      { label: t("Begin datum"), value: data?.start_date || "-" },
      { label: t("Einddatum"), value: data?.end_date || "-" },
      { label: t("Child Age"), value: String(data?.child_age ?? "-") },
      {
        label: t("Branch"),
        value: data?.branchdata?.relatie?.display_name || "-",
      },
      {
        label: t("Parent 1"),
        value: data?.parent_data_one?.display_name || "-",
      },
      {
        label: t("Parent 2"),
        value: data?.parent_data_second?.display_name || "-",
      },
      {
        label: t("Daycare Contract"),
        value: data?.contract_template_data?.template_name || "-",
      },
      {
        label: t("School"),
        value: data?.relaties_school_data?.display_name || "-",
      },
    ],
    [data, t]
  );

  const pricingRows = useMemo(
    () => [
      {
        label: t("Total Year Price"),
        value: `${currency} ${data?.total_year_price ?? "-"}`,
      },
      {
        label: t("Average Price Per Month"),
        value: `${currency} ${data?.average_per_month ?? "-"}`,
      },
      { label: t("Total hours"), value: String(data?.total_hours ?? "-") },
      {
        label: t("Average Hours Price"),
        value: `${currency} ${data?.average_hours_price ?? "-"}`,
      },
    ],
    [currency, data, t]
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
            <Text style={styles.headerTitle}>{data?.contract_name || "-"}</Text>
            {data?.status?.status_name ? (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: data.status.color || AppColors.primary },
                ]}
              >
                <Text style={styles.statusText}>{t(data.status.status_name)}</Text>
              </View>
            ) : null}
          </View>

          <DetailCard rows={infoRows} />

          <Text style={styles.sectionTitle}>{t("Leave Details")}</Text>
          {(data?.schedule_blocks || []).length ? (
            (data?.schedule_blocks || []).map((block, index) => (
              <ScheduleBlockCard
                key={String(block.id ?? index)}
                item={block}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{t("No Data")}</Text>
          )}

          <DetailCard title={t("Pricing")} rows={pricingRows} />
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
  sectionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
    marginBottom: LIST_UI.cardGap,
  },
  scheduleCard: {
    ...listScreenStyles.detailCard,
    paddingHorizontal: LIST_UI.cardPadding,
  },
  scheduleTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
  },
  scheduleDay: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  scheduleBlockName: {
    flex: 1.2,
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    textAlign: "center",
  },
  scheduleRate: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    textAlign: "right",
  },
  scheduleMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
  },
  scheduleMetaText: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    textAlign: "center",
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dotted",
    gap: 12,
  },
  emptyText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.subtitle,
    marginBottom: LIST_UI.cardGap,
  },
});
