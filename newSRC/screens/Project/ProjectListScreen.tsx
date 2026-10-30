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
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import FallBackImage from "../../Components/FallBackImage";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import OptionBottomSheet, { type OptionItem } from "../../Components/OptionBottomSheet";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  consumeProjectsRefresh,
  fetchProjectStatuses,
  fetchProjects,
  type ProjectItem,
  type ProjectStatus,
} from "../../services/projectService";
import { hasPermission } from "../../utils/permissionFlags";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { CONNECTION_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { Images } from "../../utils/Images";

type SortField = "name" | "status";

function StatusBadge({ status }: { status?: ProjectStatus }) {
  const { t } = useTranslation();
  if (!status?.status_name) return null;

  return (
    <View style={[styles.statusBadge, { backgroundColor: status.color || AppColors.primary }]}>
      <Text style={styles.statusText} numberOfLines={1}>
        {t(status.status_name)}
      </Text>
    </View>
  );
}

export default function ProjectListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { permissions } = useAppData();
  const { top, scrollPadding, modalPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string }>();

  const canReadProjects = hasPermission(permissions, "project_mobile", "read");
  const canCreateQuickProject =
    hasPermission(permissions, "quick_project_mobile", "create") ||
    hasPermission(permissions, "quick_project_mobile", "read");

  const [items, setItems] = useState<ProjectItem[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
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

  const loadData = useCallback(async (pull = false) => {
    try {
      if (pull) setRefreshing(true);
      else setLoading(true);
      clearApiError();

      // Status is secondary — don't fail the whole list if get_status races after account switch.
      const projectsRes = await fetchProjects();
      if (projectsRes?.status && Array.isArray(projectsRes.data)) {
        setItems(projectsRes.data);
      }

      try {
        const statusRes = await fetchProjectStatuses();
        if (statusRes?.status && Array.isArray(statusRes.data)) {
          setStatuses(statusRes.data);
        }
      } catch {
        setStatuses([]);
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

  useFocusEffect(
    useCallback(() => {
      if (consumeProjectsRefresh()) {
        void loadData(true);
      }
    }, [loadData])
  );

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
      (item.project_name || "").toLowerCase().includes(query)
    );

    if (selectedStatusIds.length) {
      list = list.filter((item) =>
        selectedStatusIds.includes(item.project_status_data_api?.id ?? "")
      );
    }

    list = [...list].sort((a, b) => {
      const aVal =
        sortField === "name"
          ? (a.project_name || "").toLowerCase()
          : (a.project_status_data_api?.status_name || "").toLowerCase();
      const bVal =
        sortField === "name"
          ? (b.project_name || "").toLowerCase()
          : (b.project_status_data_api?.status_name || "").toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [items, search, selectedStatusIds, sortAsc, sortField]);

  const openDetails = (item: ProjectItem) => {
    router.push({
      pathname: "/(app)/projects/[id]",
      params: {
        id: String(item.id),
        color: params.color || "",
        title: item.project_name || "",
      },
    });
  };

  const toggleDraftStatus = (id: string | number) => {
    setDraftStatusIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const renderItem = ({ item }: { item: ProjectItem }) => (
    <Pressable style={styles.card} onPress={() => openDetails(item)}>
      <View style={styles.avatarFrame}>
        <FallBackImage
          source={item.project_image ? { uri: item.project_image } : undefined}
          style={styles.avatar}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardMain}>
        <Text style={styles.name} numberOfLines={1}>
          {t(item.project_name)}
        </Text>
        {item.deadline ? (
          <Text style={styles.meta} numberOfLines={1}>
            {item.deadline}
          </Text>
        ) : null}
      </View>
      <StatusBadge status={item.project_status_data_api} />
    </Pressable>
  );

  if (!canReadProjects) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={t("Projects")}
        refreshOnPress={() => loadData(true)}
        filterOnPress={() => {
          setDraftStatusIds(selectedStatusIds);
          setFilterVisible(true);
        }}
        createOnPress={
          canCreateQuickProject ? () => router.push("/(app)/projects/create") : undefined
        }
      />

      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search project")}
          onClear={() => setSearch("")}
          containerStyle={styles.searchBox}
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
          style={styles.list}
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
          if (sortField === option.id) {
            setSortAsc((prev) => !prev);
          } else {
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
                const id = status.id ?? status.status_name ?? "";
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
  searchBox: {
    minHeight: CONNECTION_UI.searchHeight,
    borderRadius: CONNECTION_UI.radiusSearch,
    borderColor: CONNECTION_UI.cardBorder,
    backgroundColor: AppColors.white,
    paddingHorizontal: 12,
  },
  list: listScreenStyles.list,
  listContent: listScreenStyles.listContent,
  card: {
    ...listScreenStyles.rowCard,
    borderRadius: 7,
    gap: CONNECTION_UI.iconTextGap,
  },
  avatarFrame: listScreenStyles.avatarFrame,
  avatar: {
    width: "100%",
    height: "100%",
  },
  cardMain: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: AppColors.black,
  },
  meta: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
  },
  statusBadge: {
    ...listScreenStyles.statusBadge,
    maxWidth: 96,
  },
  statusText: listScreenStyles.statusBadgeText,
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
  filterList: {
    maxHeight: 280,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: CONNECTION_UI.border,
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
    borderColor: CONNECTION_UI.border,
    borderRadius: 7,
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
  filterApplyText: {
    color: AppColors.white,
  },
});
