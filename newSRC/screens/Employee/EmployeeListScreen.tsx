import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
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
import OptionBottomSheet, { type OptionItem } from "../../Components/OptionBottomSheet";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchEmployeeContractStatuses,
  fetchEmployeeContracts,
  type EmployeeContractItem,
  type EmployeeStatus,
} from "../../services/employeeService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

type SortField = "name" | "status";

export default function EmployeeListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding, modalPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; title?: string; type?: string }>();

  const [items, setItems] = useState<EmployeeContractItem[]>([]);
  const [statuses, setStatuses] = useState<EmployeeStatus[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedStatusIds, setSelectedStatusIds] = useState<Array<string | number>>([]);
  const [draftStatusIds, setDraftStatusIds] = useState<Array<string | number>>([]);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const screenTitle = params.title ? t(params.title) : t("Employees");

  const loadData = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else setLoading(true);

    clearApiError();

    try {
      const statusRes = await fetchEmployeeContractStatuses();
      if (statusRes?.status && Array.isArray(statusRes.data)) {
        setStatuses(statusRes.data);
      }
    } catch (error) {
      console.log("Error fetching employee statuses:", error);
    }

    try {
      const contractsRes = await fetchEmployeeContracts();
      if (contractsRes?.status && Array.isArray(contractsRes.data)) {
        setItems(contractsRes.data);
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
    ],
    [t]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = items.filter((item) =>
      (item.contract_name || "").toLowerCase().includes(query)
    );

    if (selectedStatusIds.length) {
      list = list.filter((item) =>
        selectedStatusIds.includes(Number(item.contract_status))
      );
    }

    list = [...list].sort((a, b) => {
      const aVal =
        sortField === "name"
          ? (a.contract_name || "").toLowerCase()
          : (a.status_name || "").toLowerCase();
      const bVal =
        sortField === "name"
          ? (b.contract_name || "").toLowerCase()
          : (b.status_name || "").toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [items, search, selectedStatusIds, sortAsc, sortField]);

  const openDetails = (item: EmployeeContractItem) => {
    if (params.type === "leaverequest") {
      router.push({
        pathname: "/(app)/absence-requests/[contractId]",
        params: {
          contractId: String(item.id),
          color: params.color || "",
          employeeName: item.contract_name || item.display_name || "",
          relatiesId: item.relaties_id ? String(item.relaties_id) : "",
        },
      });
      return;
    }

    router.push({
      pathname: "/(app)/employees/[id]",
      params: {
        id: String(item.id),
        color: params.color || "",
        title: item.contract_name || "",
      },
    });
  };

  const toggleDraftStatus = (id: string | number) => {
    setDraftStatusIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const renderItem = ({ item }: { item: EmployeeContractItem }) => (
    <Pressable style={styles.card} onPress={() => openDetails(item)}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>
          {item.contract_name ? t(item.contract_name) : t("-")}
        </Text>
        <View style={styles.badges}>
          {item.period_name ? (
            <View style={[styles.statusBadge, { backgroundColor: AppColors.primary }]}>
              <Text style={styles.statusText}>{item.period_name}</Text>
            </View>
          ) : null}
          {item.status_name ? (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: item.color || AppColors.primary },
              ]}
            >
              <Text style={styles.statusText}>{t(item.status_name)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {[
        {
          label: t("Datum"),
          value: `${item.from || "-"} -- ${item.end || "-"} (${item.contract_month || "-"})`,
        },
        {
          label: t("Function Title"),
          value: item.positiondata?.position_title || "-",
        },
        {
          label: t("Type"),
          value: item.contract_template_data?.template_name || "-",
        },
        {
          label: t("Contract uren"),
          value: `${item.contract_hour_per_week || "-"} - min: ${item.minimal_hour_per_week || "-"} - max: ${item.maximum_hour_per_week || "-"}`,
        },
        { label: t("Employer"), value: item.display_name || "-" },
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
        filterOnPress={() => {
          setDraftStatusIds(selectedStatusIds);
          setFilterVisible(true);
        }}
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
            emptyMessage: t("No Data"),
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

      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
      >
        <Pressable style={styles.filterBackdrop} onPress={() => setFilterVisible(false)}>
          <Pressable style={[styles.filterSheet, { paddingBottom: modalPadding }]} onPress={() => undefined}>
            <Text style={styles.filterTitle}>{t("Filter By Status")}</Text>
            <ScrollView style={styles.filterList} showsVerticalScrollIndicator={false}>
              {statuses.map((status) => {
                const id = status.id;
                const selected = draftStatusIds.includes(id);
                return (
                  <Pressable
                    key={String(id)}
                    style={styles.filterRow}
                    onPress={() => toggleDraftStatus(id)}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.filterLabel}>{t(status.status_name)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.filterActions}>
              <Pressable
                style={styles.filterActionBtn}
                onPress={() => {
                  setDraftStatusIds([]);
                  setSelectedStatusIds([]);
                  setFilterVisible(false);
                }}
              >
                <Text style={styles.filterActionText}>{t("Clear")}</Text>
              </Pressable>
              <Pressable
                style={[styles.filterActionBtn, styles.filterApplyBtn]}
                onPress={() => {
                  setSelectedStatusIds(draftStatusIds);
                  setFilterVisible(false);
                }}
              >
                <Text style={[styles.filterActionText, styles.filterApplyText]}>
                  {t("Apply")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
    maxWidth: "46%",
  },
  statusBadge: listScreenStyles.statusBadge,
  statusText: listScreenStyles.statusBadgeText,
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
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
  filterBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: "60%",
  },
  filterTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
    marginBottom: 12,
  },
  filterList: { maxHeight: 280 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: LIST_UI.iconRadius,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  checkMark: {
    color: AppColors.white,
    fontSize: 12,
    fontFamily: FONTS.LexendBold,
  },
  filterLabel: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
  },
  filterActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  filterActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: LIST_UI.cardRadius,
    paddingVertical: 12,
    alignItems: "center",
  },
  filterApplyBtn: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  filterActionText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  filterApplyText: { color: AppColors.white },
});
