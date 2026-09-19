import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import HtmlContent from "../../Components/HtmlContent";
import {
  fetchPerformanceReviewDetails,
  formatHrDate,
  type PerformanceReviewItem,
} from "../../services/hrPortalService";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function PerformanceReviewDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; title?: string }>();

  const [data, setData] = useState<PerformanceReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      setData(await fetchPerformanceReviewDetails(params.id));
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const rows = useMemo(() => {
    if (!data) return [];
    return [
      { label: t("Review date"), value: formatHrDate(data.review_date) },
      {
        label: t("Period"),
        value:
          data.period_start || data.period_end
            ? `${formatHrDate(data.period_start)} – ${formatHrDate(data.period_end)}`
            : "-",
      },
      { label: t("Status"), value: data.status ? t(data.status) : "-" },
      {
        label: t("Rating"),
        value: data.rating != null && String(data.rating).trim() !== "" ? String(data.rating) : "-",
      },
      { label: t("Reviewer"), value: data.reviewer_name || "-" },
    ];
  }, [data, t]);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={data?.title || params.title || t("Performance reviews")}
      />
      {loading || apiError || !data ? (
        <ApiFeedback
          loading={loading}
          error={apiError}
          isEmpty={!data}
          emptyMessage={t("Performance review not found.")}
          onRetry={loadDetails}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{data.title || t("Performance review")}</Text>
            {rows.map((row, index) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                last={index === rows.length - 1}
              />
            ))}
          </View>

          {data.summary ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("Summary")}</Text>
              <HtmlContent html={data.summary} variant="description" />
            </View>
          ) : null}

          {data.goals ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("Goals")}</Text>
              <HtmlContent html={data.goals} variant="description" />
            </View>
          ) : null}

          {data.employee_comments ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("Employee comments")}</Text>
              <HtmlContent html={data.employee_comments} variant="description" />
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  content: listScreenStyles.detailContent,
  card: listScreenStyles.detailCard,
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 8,
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
});
