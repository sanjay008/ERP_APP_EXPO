import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import OptionBottomSheet, { type OptionItem } from "../../Components/OptionBottomSheet";
import { fetchTasks, type TaskItem } from "../../services/taskService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

type SortField = "name" | "status" | "id" | "date";

export default function TaskListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding, fabBottom } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; title?: string }>();

  const [items, setItems] = useState<TaskItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortAsc, setSortAsc] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const screenTitle = params.title ? t(params.title) : t("Tasks/Complaints");

  const loadData = useCallback(async (pull = false) => {
    try {
      if (pull) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      clearApiError();
      const response = await fetchTasks();
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
    let list = items.filter((item) =>
      (item.title || "").toLowerCase().includes(query)
    );

    list = [...list].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "name") {
        aVal = (a.title || "").toLowerCase();
        bVal = (b.title || "").toLowerCase();
      } else if (sortField === "status") {
        aVal = (a.task_status_data?.status_name || "").toLowerCase();
        bVal = (b.task_status_data?.status_name || "").toLowerCase();
      } else if (sortField === "date") {
        aVal = a.deadline || "";
        bVal = b.deadline || "";
      } else {
        return sortAsc ? a.id - b.id : b.id - a.id;
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [items, search, sortAsc, sortField]);

  const openDetails = (item: TaskItem) => {
    router.push({
      pathname: "/(app)/tasks/[id]",
      params: {
        id: String(item.id),
        color: params.color || "",
      },
    });
  };

  const renderItem = ({ item }: { item: TaskItem }) => (
    <Pressable style={styles.card} onPress={() => openDetails(item)}>
      <View style={styles.topRow}>
        <View style={styles.idBox}>
          <Text style={styles.idText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
            {item.id}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {t(item.title)}
        </Text>
        {item.task_status_data ? (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.task_status_data.color || AppColors.primary,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {t(item.task_status_data.status_name)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Ionicons name="time-outline" size={14} color={AppColors.primary} />
          <Text style={styles.metaText}>
            {item.quantity} {item.quantity_type}
          </Text>
        </View>
        <Text style={styles.metaText}>{item.deadline || "-"}</Text>
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
          placeholder={t("Search tasks, complaints")}
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
          showsVerticalScrollIndicator={false}
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
            emptyMessage: t("No Tasks Found."),
          })}
        />
      </ListScreenBody>

      <Pressable
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => router.push("/(app)/tasks/create")}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>

      <OptionBottomSheet
        visible={sortSheetVisible}
        title={t("Sort By")}
        confirmText={t("Apply")}
        options={sortOptions}
        onClose={() => setSortSheetVisible(false)}
        onConfirm={(option) => {
          if (sortField === option.id) {
            setSortAsc((prev) => !prev);
          } else {
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
    gap: LIST_UI.iconTextGap,
  },
  idBox: listScreenStyles.idBox,
  idText: listScreenStyles.idText,
  title: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  statusBadge: listScreenStyles.statusBadge,
  statusText: listScreenStyles.statusBadgeText,
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LIST_UI.cardBorder,
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
