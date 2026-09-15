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
import FallBackImage from "../../Components/FallBackImage";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import OptionBottomSheet, { type OptionItem } from "../../Components/OptionBottomSheet";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchWorkOrders,
  type WorkOrderItem,
} from "../../services/workOrderService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

type SortField = "name" | "status" | "id" | "date";

export default function WorkOrderListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; title?: string }>();

  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortAsc, setSortAsc] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const screenTitle = params.title ? t(params.title) : t("Work Orders");

  const loadData = useCallback(async (pull = false) => {
    try {
      if (pull) setRefreshing(true);
      else setLoading(true);
      clearApiError();
      const response = await fetchWorkOrders();
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
      { id: "id", label: t("Id") },
      { id: "name", label: t("Name") },
      { id: "status", label: t("Status") },
      { id: "date", label: t("Date") },
    ],
    [t]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = items.filter((item) => {
      const name = item.relaties_customer?.display_name?.toLowerCase() || "";
      const address = item.gmaps_working_address?.toLowerCase() || "";
      const status = item.workorder_status?.status_name?.toLowerCase() || "";
      return name.includes(query) || address.includes(query) || status.includes(query);
    });

    list = [...list].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "name") {
        aVal = a.relaties_customer?.display_name?.toLowerCase() || "";
        bVal = b.relaties_customer?.display_name?.toLowerCase() || "";
      } else if (sortField === "status") {
        aVal = a.workorder_status?.status_name?.toLowerCase() || "";
        bVal = b.workorder_status?.status_name?.toLowerCase() || "";
      } else if (sortField === "date") {
        aVal = a.execution_date || a.date || "";
        bVal = b.execution_date || b.date || "";
      } else {
        return sortAsc ? a.id - b.id : b.id - a.id;
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [items, search, sortAsc, sortField]);

  const renderItem = ({ item }: { item: WorkOrderItem }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(app)/work-orders/[id]",
          params: {
            id: String(item.id),
            color: params.color || "",
            title: item.relaties_customer?.display_name || "",
          },
        })
      }
    >
      <View style={styles.topRow}>
        <View style={styles.idBox}>
          <Text style={styles.idText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
            {item.order_id || item.id}
          </Text>
        </View>
        {item.workorder_status ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.workorder_status.color || AppColors.primary },
            ]}
          >
            <Text style={styles.statusText}>
              {t(item.workorder_status.status_name)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.relaties_customer?.display_name || "-"}
      </Text>

      <View style={styles.contentRow}>
        <FallBackImage
          source={
            item.relaties_customer?.relaties_profile_img
              ? { uri: item.relaties_customer.relaties_profile_img }
              : undefined
          }
          style={styles.avatar}
          resizeMode="cover"
        />
        <View style={styles.meta}>
          <Text style={styles.address} numberOfLines={2}>
            {item.gmaps_working_address || "-"}
          </Text>
          <Text style={styles.date}>{item.execution_date || item.date || "-"}</Text>
        </View>
      </View>
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
          placeholder={t("Search works orders")}
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
            emptyMessage: t("No Work Orders Found."),
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  idBox: listScreenStyles.idBox,
  idText: listScreenStyles.idText,
  statusBadge: {
    ...listScreenStyles.statusBadge,
    maxWidth: 100,
  },
  statusText: listScreenStyles.statusBadgeText,
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 10,
  },
  contentRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: { width: LIST_UI.iconSize, height: LIST_UI.iconSize, borderRadius: LIST_UI.iconRadius },
  meta: { flex: 1 },
  address: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    marginBottom: 6,
  },
  date: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.subtitle,
  },
});
