import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchPayOrderById,
  type PayOrderItem,
} from "../../services/payService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

function formatMoney(symbol: string | undefined, value?: number | string) {
  const amount = Number.parseFloat(String(value ?? 0));
  if (!Number.isFinite(amount)) return "-";
  return `${symbol ?? ""} ${amount.toFixed(2)}`.trim();
}

function formatPaymentDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
}

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

export default function PayOrderDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const [item, setItem] = useState<PayOrderItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      const data = await fetchPayOrderById(params.id);
      setItem(data);
    } catch (error) {
      captureApiError(error);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const symbol = item?.rent_currencys?.symbol;
  const payments = item?.payments ?? [];

  const rows = useMemo(() => {
    if (!item) return [];
    return [
      { label: t("Payment Order"), value: item.pay_order_nr || "-" },
      { label: t("Description"), value: item.description || "-" },
      { label: t("Amount"), value: formatMoney(symbol, item.amount) },
      { label: t("Paid"), value: formatMoney(symbol, item.paid) },
      { label: t("Outstanding"), value: formatMoney(symbol, item.outstading) },
      { label: t("Date"), value: item.pay_order_start_date || "-" },
      { label: t("Due Date"), value: item.pay_order_end_date || "-" },
    ];
  }, [item, symbol, t]);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Details")} />

      {loading || apiError || !item ? (
        <ApiFeedback
          loading={loading}
          error={apiError}
          isEmpty={!item}
          emptyMessage={t("No Pay Order Found.")}
          onRetry={loadDetails}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>{item.pay_order_nr || "-"}</Text>

          <View style={styles.card}>
            {rows.map((row, index) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                last={index === rows.length - 1 && !item.module_status}
              />
            ))}
            {item.module_status?.status_name ? (
              <View style={styles.statusWrap}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: item.module_status.color || AppColors.primary },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {t(item.module_status.status_name)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {payments.length ? (
            <>
              <Text style={styles.sectionTitle}>{t("Payments")}</Text>
              <View style={styles.card}>
                <View style={[styles.paymentRow, styles.paymentHeader]}>
                  <Text style={[styles.headerCell, styles.cellLeft]}>{t("Date")}</Text>
                  <Text style={[styles.headerCell, styles.cellCenter]}>
                    {t("Discription")}
                  </Text>
                  <Text style={[styles.headerCell, styles.cellRight]}>{t("Amount")}</Text>
                </View>
                {payments.map((payment, index) => (
                  <View
                    key={`${payment.created_at || payment.payment_date || index}`}
                    style={[
                      styles.paymentRow,
                      index === payments.length - 1 && styles.rowLast,
                    ]}
                  >
                    <Text style={[styles.paymentCell, styles.cellLeft]}>
                      {formatPaymentDate(payment.created_at || payment.payment_date)}
                    </Text>
                    <Text style={[styles.paymentCell, styles.cellCenter]} numberOfLines={2}>
                      {payment.description || "-"}
                    </Text>
                    <Text style={[styles.paymentCell, styles.cellRight]}>
                      {formatMoney(symbol, payment.amount)}
                    </Text>
                  </View>
                ))}
                <Text style={styles.totalPaid}>
                  {t("Total paid")} :{"  "}
                  <Text style={styles.totalPaidValue}>
                    {formatMoney(symbol, item.paid)}
                  </Text>
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyPayments}>{t("No Payments available")}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  content: listScreenStyles.detailContent,
  pageTitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 18,
    color: AppColors.black,
    textAlign: "center",
    marginBottom: 12,
  },
  card: listScreenStyles.detailCard,
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    gap: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.subtitle,
    flex: 1,
  },
  value: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.primary,
    textAlign: "right",
    flex: 1.2,
  },
  statusWrap: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  statusBadge: listScreenStyles.statusBadge,
  statusText: listScreenStyles.statusBadgeText,
  sectionTitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 16,
    color: AppColors.black,
    textAlign: "center",
    marginBottom: 10,
  },
  paymentHeader: {
    paddingBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    gap: 8,
  },
  headerCell: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: AppColors.primary,
  },
  paymentCell: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.subtitle,
  },
  cellLeft: { textAlign: "left" },
  cellCenter: { textAlign: "center" },
  cellRight: { textAlign: "right" },
  totalPaid: {
    alignSelf: "flex-end",
    paddingTop: 12,
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.subtitle,
  },
  totalPaidValue: {
    color: AppColors.primary,
  },
  emptyPayments: {
    textAlign: "center",
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    marginTop: 8,
  },
});
