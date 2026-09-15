import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
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
import { fetchPayJobs, type PayJobItem } from "../../services/payService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { LIST_CARD_SHADOW, listScreenStyles } from "../../utils/listScreenStyles";
import { isOpenableAddress, openMapsAddress } from "../../utils/openMaps";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function isValidDate(value?: string) {
  if (!value?.trim()) return false;
  if (value.startsWith("0000-00-00")) return false;
  const time = Date.parse(value);
  return Number.isFinite(time);
}

function formatDisplayDate(value?: string) {
  return isValidDate(value) ? value : "-";
}

function formatDescription(description?: string, startDate?: string) {
  if (!description?.trim()) return "-";

  let month = "";
  let year = "";
  if (isValidDate(startDate)) {
    const date = new Date(startDate!);
    month = MONTH_NAMES[date.getMonth()] || "";
    year = String(date.getFullYear());
  }

  return description
    .replace(/%month%/gi, month || "-")
    .replace(/%year%/gi, year || "-")
    .trim();
}

function extractAddressFromDescription(description?: string) {
  if (!description?.trim()) return null;
  const parts = description
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const candidate = parts[1];
    if (candidate && !candidate.includes("%") && /[a-zA-Z]/.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolvePayJobStatus(item: PayJobItem) {
  if (item.module_status?.status_name) {
    return {
      name: item.module_status.status_name,
      color: item.module_status.color || AppColors.primary,
    };
  }
  if (item.status_data?.status_name) {
    return {
      name: item.status_data.status_name,
      color: item.status_data.color || AppColors.primary,
    };
  }
  if (typeof item.status === "object" && item.status?.status_name) {
    return {
      name: item.status.status_name,
      color: item.status.color || item.color || item.color_code || AppColors.primary,
    };
  }
  if (typeof item.status === "string" && item.status.trim()) {
    return {
      name: item.status,
      color: item.color || item.color_code || AppColors.primary,
    };
  }
  if (item.status_name?.trim()) {
    return {
      name: item.status_name,
      color: item.color || item.color_code || AppColors.primary,
    };
  }

  // Fallback from dates when API does not send status
  if (isValidDate(item.end_date)) {
    const end = new Date(item.end_date!);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end.getTime() < today.getTime()) {
      return { name: "Overdue", color: "#F5C518" };
    }
    return { name: "Open", color: AppColors.primary };
  }

  return null;
}

function PayJobCard({ item }: { item: PayJobItem }) {
  const { t } = useTranslation();
  const amount = Number.parseFloat(String(item.amount ?? 0));
  const description = formatDescription(item.description, item.start_date);
  const mapAddress = extractAddressFromDescription(item.description);
  const status = resolvePayJobStatus(item);
  const startDate = formatDisplayDate(item.start_date);
  const endDate = formatDisplayDate(item.end_date);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={2}>
          {item.pay_job_generated_number || t("Pay Job")}
        </Text>
        {status ? (
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{t(status.name)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.row}>
        {t("Pay order")}:{" "}
        <Text style={styles.value}>{item.pay_order_nr || "-"}</Text>
      </Text>

      <View style={styles.descriptionRow}>
        <Text style={styles.rowLabel}>{t("Description")}: </Text>
        {isOpenableAddress(mapAddress) ? (
          <Text style={styles.link} onPress={() => openMapsAddress(mapAddress)}>
            {description}
          </Text>
        ) : (
          <Text style={styles.valueFlex}>{description}</Text>
        )}
      </View>

      <Text style={styles.row}>
        {t("Amount")}:{" "}
        <Text style={styles.value}>
          {item.rent_currency || ""}{" "}
          {Number.isFinite(amount) ? amount.toFixed(2) : "-"}
        </Text>
      </Text>

      <Text style={styles.row}>
        {t("Date")}:{" "}
        <Text style={styles.value}>
          {startDate} - {endDate}
        </Text>
      </Text>
    </View>
  );
}

export default function PayJobListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const [items, setItems] = useState<PayJobItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    clearApiError();
    try {
      const data = await fetchPayJobs();
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
    return items.filter((item) => {
      const status = resolvePayJobStatus(item);
      const haystack = [
        item.pay_job_generated_number,
        item.pay_order_nr,
        formatDescription(item.description, item.start_date),
        item.amount,
        item.rent_currency,
        item.start_date,
        item.end_date,
        status?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search]);

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={t("Pay Job")}
        onBack={() => router.back()}
        refreshOnPress={onRefresh}
      />

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
          renderItem={({ item }) => <PayJobCard item={item} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: scrollPadding }]}
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
  listContent: {
    paddingHorizontal: LIST_UI.screenPadding,
    flexGrow: 1,
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
    maxWidth: "42%",
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
    marginBottom: 6,
  },
  descriptionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  rowLabel: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
  },
  value: {
    fontFamily: FONTS.LexendMedium,
    color: AppColors.subtitle,
  },
  valueFlex: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    color: AppColors.subtitle,
  },
  link: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    color: AppColors.primary,
    textDecorationLine: "underline",
  },
});
