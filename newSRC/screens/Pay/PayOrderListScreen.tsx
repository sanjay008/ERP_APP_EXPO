import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
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
  onPress,
}: {
  item: PayOrderItem;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const symbol = item.rent_currencys?.symbol;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.textWrap}>
          <Text style={styles.row}>
            {t("Pay order")} :{"  "}
            <Text style={styles.value}>{item.pay_order_nr || "-"}</Text>
          </Text>
          <Text style={styles.row}>
            {t("Description")} :{"  "}
            <Text style={styles.value}>{item.description || "-"}</Text>
          </Text>
          <Text style={styles.row}>
            {t("Amount")} :{"  "}
            <Text style={styles.value}>{formatMoney(symbol, item.amount)}</Text>
          </Text>
          <Text style={styles.row}>
            {t("Outstading")} :{"  "}
            <Text style={styles.value}>{formatMoney(symbol, item.outstading)}</Text>
          </Text>
        </View>
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
    </Pressable>
  );
}

export default function PayOrderListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const [items, setItems] = useState<PayOrderItem[]>([]);
  const [search, setSearch] = useState("");
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

  const openDetails = (item: PayOrderItem) => {
    if (item.id == null) return;
    router.push({
      pathname: "/(app)/pay-order/[id]",
      params: { id: String(item.id) },
    });
  };

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
            <PayOrderCard item={item} onPress={() => openDetails(item)} />
          )}
          contentContainerStyle={{
            paddingBottom: scrollPadding,
            paddingHorizontal: LIST_UI.screenPadding,
          }}
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
            emptyMessage: t("No Pay Order Found."),
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
  },
  textWrap: {
    flex: 1,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
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
    color: AppColors.primary,
  },
});
