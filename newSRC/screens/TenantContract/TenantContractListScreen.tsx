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
import OptionBottomSheet, { type OptionItem } from "../../Components/OptionBottomSheet";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchTenantContracts,
  formatContractDate,
  getContractStreet,
  type TenantContractItem,
} from "../../services/tenantContractService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

type SortField = "name" | "status" | "date";

export default function TenantContractListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; title?: string }>();

  const [items, setItems] = useState<TenantContractItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const screenTitle = params.title ? t(params.title) : t("Tenant Contracts");

  const loadData = useCallback(async (pull = false) => {
    try {
      if (pull) setRefreshing(true);
      else setLoading(true);
      clearApiError();
      const response = await fetchTenantContracts();
      if (response?.status && Array.isArray(response.data)) {
        setItems(response.data);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clearApiError, captureApiError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortOptions: OptionItem[] = useMemo(
    () => [
      { id: "name", label: t("Name") },
      { id: "status", label: t("Status") },
      { id: "date", label: t("Date") },
    ],
    [t]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = items.filter((item) =>
      (item.object_data?.display_name || "").toLowerCase().includes(query)
    );

    list = [...list].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "status") {
        aVal = a.status?.status_name?.toLowerCase() || "";
        bVal = b.status?.status_name?.toLowerCase() || "";
      } else if (sortField === "date") {
        aVal = a.from || "";
        bVal = b.from || "";
      } else {
        aVal = a.object_data?.display_name?.toLowerCase() || "";
        bVal = b.object_data?.display_name?.toLowerCase() || "";
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [items, search, sortAsc, sortField]);

  const renderItem = ({ item }: { item: TenantContractItem }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(app)/tenant-contracts/[id]",
          params: {
            id: String(item.id),
            color: params.color || "",
            title: item.object_data?.display_name || "",
          },
        })
      }
    >
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>
          {item.object_data?.display_name || "-"}
        </Text>
        {item.status ? (
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
        { label: t("Debiteurennummer"), value: item.debtor_number || "-" },
        { label: t("Start Datum"), value: formatContractDate(item.from) },
        { label: t("End Datum"), value: formatContractDate(item.end) },
        { label: t("Straat"), value: getContractStreet(item) },
        {
          label: t("Price"),
          value: `${item.currency_data?.symbol || ""} ${item.rent_price ?? "-"}`,
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
        filterOnPress={() => setSortSheetVisible(true)}
      />

      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search tenant contracts")}
          onClear={() => setSearch("")}
        />
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={items.length}
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
            emptyMessage: t("No Contracts Found."),
          })}
        />
      </ListScreenBody>

      <OptionBottomSheet
        visible={sortSheetVisible}
        title={t("Sort By")}
        confirmText={t("Apply")}
        options={sortOptions}
        onClose={() => setSortSheetVisible(false)}
        onConfirm={(option) => {
          if (sortField === option.id) setSortAsc((prev) => !prev);
          else {
            setSortField(option.id as SortField);
            setSortAsc(true);
          }
          setSortSheetVisible(false);
        }}
      />
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
    borderStyle: "dotted",
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dotted",
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
