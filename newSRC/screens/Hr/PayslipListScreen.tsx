import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { fetchPayslips, type PayslipItem } from "../../services/hrPortalService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function PayslipListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ title?: string }>();

  const [items, setItems] = useState<PayslipItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const screenTitle = params.title ? t(params.title) : t("Payslips");

  const loadData = useCallback(
    async (pull = false) => {
      try {
        if (pull) setRefreshing(true);
        else setLoading(true);
        clearApiError();
        setItems(await fetchPayslips());
      } catch (error) {
        captureApiError(error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clearApiError, captureApiError]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const years = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => {
      if (item.year != null && String(item.year).trim()) {
        values.add(String(item.year));
      }
    });
    return Array.from(values).sort((a, b) => Number(b) - Number(a));
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const yearMatch =
        selectedYear === "all" || String(item.year) === selectedYear;
      if (!yearMatch) return false;
      if (!query) return true;
      const haystack = [
        item.period_label,
        item.filename,
        item.month,
        item.year,
        item.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search, selectedYear]);

  const renderItem = ({ item }: { item: PayslipItem }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(app)/payslips/[id]",
          params: {
            id: String(item.id),
            title: item.period_label || item.filename || "",
          },
        })
      }
    >
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>
          {item.period_label || item.filename || t("Payslip")}
        </Text>
        {item.year ? (
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{String(item.year)}</Text>
          </View>
        ) : null}
      </View>
      {item.filename && item.period_label ? (
        <Text style={styles.meta} numberOfLines={1}>
          {item.filename}
        </Text>
      ) : null}
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={screenTitle} refreshOnPress={() => loadData(true)} />
      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search")}
        />
        {years.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearRow}
          >
            <Pressable
              style={[
                styles.yearChip,
                selectedYear === "all" && styles.yearChipActive,
              ]}
              onPress={() => setSelectedYear("all")}
            >
              <Text
                style={[
                  styles.yearChipText,
                  selectedYear === "all" && styles.yearChipTextActive,
                ]}
              >
                {t("All")}
              </Text>
            </Pressable>
            {years.map((year) => (
              <Pressable
                key={year}
                style={[
                  styles.yearChip,
                  selectedYear === year && styles.yearChipActive,
                ]}
                onPress={() => setSelectedYear(year)}
              >
                <Text
                  style={[
                    styles.yearChipText,
                    selectedYear === year && styles.yearChipTextActive,
                  ]}
                >
                  {year}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
      <ListScreenBody
        loading={loading}
        itemCount={filteredItems.length}
        apiError={apiError}
        onRetry={() => loadData()}
        emptyMessage={t("No payslips")}
      >
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: scrollPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={[AppColors.primary]}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={listEmptyFeedback({
            loading,
            apiError,
            onRetry: () => loadData(),
            emptyMessage: t("No payslips"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  searchWrap: listScreenStyles.searchWrap,
  list: listScreenStyles.list,
  listContent: listScreenStyles.listContent,
  card: listScreenStyles.card,
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  yearBadge: {
    ...listScreenStyles.statusBadge,
    backgroundColor: AppColors.primary,
  },
  yearText: listScreenStyles.statusBadgeText,
  meta: {
    marginTop: 6,
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
  },
  yearRow: {
    paddingTop: 12,
    gap: 8,
  },
  yearChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: AppColors.white,
  },
  yearChipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  yearChipText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
  },
  yearChipTextActive: {
    color: AppColors.white,
  },
});
