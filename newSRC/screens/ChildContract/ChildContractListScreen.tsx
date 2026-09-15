import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
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
import {
  fetchChildContracts,
  type ChildContractItem,
} from "../../services/childContractService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function ChildContractListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; color?: string; title?: string }>();

  const [items, setItems] = useState<ChildContractItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const screenTitle = params.title ? t(params.title) : t("Child Contract");

  const loadData = useCallback(async (pull = false) => {
    if (!params.id) return;
    try {
      if (pull) setRefreshing(true);
      else setLoading(true);
      clearApiError();
      const response = await fetchChildContracts(params.id);
      if (response?.status && Array.isArray(response.data)) {
        setItems(response.data);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      ),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedItems;
    return sortedItems.filter((item) => {
      const haystack = [
        item.contract_name,
        item.child_data?.display_name,
        item.contract_template_data?.template_name,
        item.relaties_school_data?.display_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [sortedItems, search]);

  const openDetails = (item: ChildContractItem) => {
    router.push({
      pathname: "/(app)/child-contracts/[id]",
      params: {
        id: String(item.id),
        color: params.color || "",
        title: item.contract_name || "",
      },
    });
  };

  const renderItem = ({ item }: { item: ChildContractItem }) => (
    <Pressable style={styles.card} onPress={() => openDetails(item)}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>
          {item.contract_name ? t(item.contract_name) : t("-")}
        </Text>
        {item.status?.status_name ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.status.color || AppColors.primary },
            ]}
          >
            <Text style={styles.statusText}>{t(item.status.status_name)}</Text>
          </View>
        ) : null}
      </View>

      {[
        {
          label: t("Kind Name"),
          value: item.child_data?.display_name || "-",
        },
        { label: t("Begin datum"), value: item.start_date || "-" },
        { label: t("Einddatum"), value: item.end_date || "-" },
        {
          label: t("Daycare Contract"),
          value: item.contract_template_data?.template_name || "-",
        },
        {
          label: t("School"),
          value: item.relaties_school_data?.display_name || "-",
        },
      ].map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={screenTitle}
        refreshOnPress={() => loadData(true)}
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
        onRetry={() => loadData()}
      >
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
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
            emptyMessage: t("No Data"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  searchWrap: listScreenStyles.searchWrap,
  listContent: listScreenStyles.listContent,
  card: listScreenStyles.card,
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: LIST_UI.iconTextGap,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  statusBadge: listScreenStyles.statusBadge,
  statusText: listScreenStyles.statusBadgeText,
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dotted",
    gap: 12,
  },
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
