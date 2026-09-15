import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { fetchPayOrders, type PayOrderItem } from "../../services/payService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { LIST_CARD_SHADOW } from "../../utils/listScreenStyles";
import { listScreenStyles } from "../../utils/listScreenStyles";

function formatMoney(symbol: string | undefined, value?: number | string) {
  const amount = Number.parseFloat(String(value ?? 0));
  if (!Number.isFinite(amount)) return "-";
  return `${symbol ?? ""} ${amount.toFixed(2)}`.trim();
}

function PayOrderCard({
  item,
  expanded,
  onToggle,
}: {
  item: PayOrderItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const symbol = item.rent_currencys?.symbol;

  return (
    <Pressable style={styles.card} onPress={onToggle}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>
          {t("Pay order")}: {item.pay_order_nr || "-"}
        </Text>
        {item.module_status?.status_name ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.module_status.color || AppColors.primary },
            ]}
          >
            <Text style={styles.statusText}>{t(item.module_status.status_name)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.row}>
        {t("Description")}: <Text style={styles.value}>{item.description || "-"}</Text>
      </Text>
      <Text style={styles.row}>
        {t("Amount")}: <Text style={styles.value}>{formatMoney(symbol, item.amount)}</Text>
      </Text>
      <Text style={styles.row}>
        {t("Outstading")}:{" "}
        <Text style={styles.value}>{formatMoney(symbol, item.outstading)}</Text>
      </Text>

      {expanded ? (
        <View style={styles.details}>
          <Text style={styles.detailTitle}>{item.pay_order_nr}</Text>
          <DetailRow label={t("Paid")} value={formatMoney(symbol, item.paid)} />
          <DetailRow
            label={t("Date")}
            value={item.pay_order_start_date || "-"}
          />
          <DetailRow
            label={t("Due Date")}
            value={item.pay_order_end_date || "-"}
          />

          {item.payments && item.payments.length > 0 ? (
            <>
              <Text style={styles.paymentsTitle}>{t("Payments")}</Text>
              {item.payments.map((payment, index) => (
                <View key={index} style={styles.paymentRow}>
                  <Text style={styles.paymentCell}>{payment.payment_date || "-"}</Text>
                  <Text style={[styles.paymentCell, styles.paymentCenter]}>
                    {payment.description || "-"}
                  </Text>
                  <Text style={[styles.paymentCell, styles.paymentRight]}>
                    {formatMoney(symbol, payment.amount)}
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function PayOrderListScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const [items, setItems] = useState<PayOrderItem[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    clearApiError();
    try {
      const data = await fetchPayOrders();
      setItems(data);
    } catch (error) {
      captureApiError(error);
      setItems([]);
    }
  }, [clearApiError, captureApiError]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      (item.pay_order_nr || "").toLowerCase().includes(query)
    );
  }, [items, search]);

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Pay order")} refreshOnPress={onRefresh} />

      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search")}
          onClear={() => setSearch("")}
        />
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={filteredItems.length}
        apiError={apiError}
        onRetry={loadData}
      >
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={({ item }) => (
            <PayOrderCard
              item={item}
              expanded={expandedId === item.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === item.id ? null : item.id ?? null))
              }
            />
          )}
          contentContainerStyle={{ paddingBottom: scrollPadding, paddingHorizontal: LIST_UI.screenPadding }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={listEmptyFeedback({
            loading,
            apiError,
            onRetry: loadData,
            emptyMessage: t("No Data Found"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: LIST_UI.cardRadius,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    padding: LIST_UI.cardPadding,
    marginBottom: LIST_UI.cardGap,
    ...LIST_CARD_SHADOW,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.white,
  },
  row: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
    marginBottom: 4,
  },
  value: {
    fontFamily: FONTS.LexendMedium,
    color: AppColors.subtitle,
  },
  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: LIST_UI.cardBorder,
  },
  detailTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
  },
  detailValue: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.subtitle,
    flex: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  paymentsTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  paymentCell: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.black,
  },
  paymentCenter: { textAlign: "center" },
  paymentRight: { textAlign: "right" },
});
