import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchPerformanceReviews,
  formatHrDate,
  type PerformanceReviewItem,
} from "../../services/hrPortalService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { listScreenStyles } from "../../utils/listScreenStyles";

function reviewStatusColor(status?: string) {
  const value = (status || "").toLowerCase();
  if (["approved", "completed", "done", "final"].includes(value)) return "#2E9E6B";
  if (["pending", "draft", "open", "requested"].includes(value)) return "#EDB20F";
  return AppColors.primary;
}

export default function PerformanceReviewListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ title?: string }>();

  const [items, setItems] = useState<PerformanceReviewItem[]>([]);
  const [tableReady, setTableReady] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const screenTitle = params.title ? t(params.title) : t("Performance reviews");

  const loadData = useCallback(
    async (pull = false) => {
      try {
        if (pull) setRefreshing(true);
        else setLoading(true);
        clearApiError();
        const result = await fetchPerformanceReviews();
        setItems(result.reviews);
        setTableReady(result.tableReady);
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

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      const haystack = [item.title, item.reviewer_name, item.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search]);

  const emptyMessage = tableReady
    ? t("No performance reviews")
    : t("Performance reviews are not available yet.");

  const renderItem = ({ item }: { item: PerformanceReviewItem }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(app)/performance-reviews/[id]",
          params: { id: String(item.id), title: item.title || "" },
        })
      }
    >
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title || t("Performance review")}
        </Text>
        {item.status ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: reviewStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{t(item.status)}</Text>
          </View>
        ) : null}
      </View>
      {item.reviewer_name ? (
        <Text style={styles.meta}>{item.reviewer_name}</Text>
      ) : null}
      <Text style={styles.meta}>{formatHrDate(item.review_date)}</Text>
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
      </View>
      <ListScreenBody
        loading={loading}
        itemCount={filteredItems.length}
        apiError={apiError}
        onRetry={() => loadData()}
        emptyMessage={emptyMessage}
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
            emptyMessage,
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
  statusBadge: listScreenStyles.statusBadge,
  statusText: listScreenStyles.statusBadgeText,
  meta: {
    marginTop: 6,
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
  },
});
