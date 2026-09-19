import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import DocumentPreviewModal from "../Documents/DocumentPreviewModal";
import {
  fetchPayslipDetails,
  type PayslipItem,
} from "../../services/hrPortalService";
import { resolveDocumentFileType } from "../Documents/types";
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

export default function PayslipDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; title?: string }>();

  const [data, setData] = useState<PayslipItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      setData(await fetchPayslipDetails(params.id));
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const viewUrl = data?.view_url || data?.shared_link;
  const downloadUrl = data?.download_url || viewUrl;

  const rows = useMemo(() => {
    if (!data) return [];
    return [
      { label: t("Period"), value: data.period_label || "-" },
      { label: t("Month"), value: data.month != null ? String(data.month) : "-" },
      { label: t("Year"), value: data.year != null ? String(data.year) : "-" },
      { label: t("File"), value: data.filename || "-" },
      { label: t("Type"), value: data.type || t("Payslip") },
    ];
  }, [data, t]);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={data?.period_label || params.title || t("Payslips")} />
      {loading || apiError || !data ? (
        <ApiFeedback
          loading={loading}
          error={apiError}
          isEmpty={!data}
          emptyMessage={t("Payslip not found.")}
          onRetry={loadDetails}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        >
          <View style={styles.card}>
            {rows.map((row, index) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                last={index === rows.length - 1}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {viewUrl ? (
              <Pressable
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={() => setPreviewVisible(true)}
              >
                <Text style={styles.actionPrimaryText}>{t("View")}</Text>
              </Pressable>
            ) : null}
            {downloadUrl ? (
              <Pressable
                style={styles.actionBtn}
                onPress={() => Linking.openURL(downloadUrl)}
              >
                <Text style={styles.actionText}>{t("Download")}</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      )}

      <DocumentPreviewModal
        visible={previewVisible}
        title={data?.filename || data?.period_label || t("Payslip")}
        imageUri={viewUrl}
        downloadUrl={downloadUrl}
        fileType={resolveDocumentFileType(data)}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  content: listScreenStyles.detailContent,
  card: listScreenStyles.detailCard,
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
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E5EA",
    backgroundColor: AppColors.white,
  },
  actionPrimary: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  actionText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  actionPrimaryText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.white,
  },
});
