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
  fetchConnections,
  type ConnectionItem,
} from "../../services/connectionService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { CONNECTION_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

type SortField = "name" | "type";

export default function ConnectionsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; type?: string }>();

  const [items, setItems] = useState<ConnectionItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadData = useCallback(async (pull = false) => {
    try {
      if (pull) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      clearApiError();
      const response = await fetchConnections(params.type);
      if (response?.status && Array.isArray(response.data)) {
        setItems(response.data);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.type, clearApiError, captureApiError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortOptions: OptionItem[] = useMemo(
    () => [
      { id: "name", label: t("Name") },
      { id: "type", label: t("Type") },
    ],
    [t]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = items.filter((item) =>
      (item.display_name || "").toLowerCase().includes(query)
    );

    list = [...list].sort((a, b) => {
      const aVal =
        sortField === "name"
          ? (a.display_name || "").toLowerCase()
          : (a.soort_relatie || "").toLowerCase();
      const bVal =
        sortField === "name"
          ? (b.display_name || "").toLowerCase()
          : (b.soort_relatie || "").toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [items, search, sortAsc, sortField]);

  const isChildMode = params.type === "child";

  const openDetails = (item: ConnectionItem) => {
    if (isChildMode) {
      router.push({
        pathname: "/(app)/child-contracts",
        params: {
          id: String(item.id),
          color: params.color || "",
          title: item.display_name || "",
        },
      });
      return;
    }

    router.push({
      pathname: "/(app)/connections/[id]",
      params: {
        id: String(item.id),
        color: params.color || "",
      },
    });
  };

  const renderItem = ({ item }: { item: ConnectionItem }) => (
    <Pressable style={styles.card} onPress={() => openDetails(item)}>
      <View style={styles.avatarFrame}>
        <FallBackImage
          source={item.file_path ? { uri: item.file_path } : undefined}
          style={styles.avatar}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={2}>
          {item.display_name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.soort_relatie || "-"}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={isChildMode ? t("Kind") : t("Connections")}
        refreshOnPress={() => loadData(true)}
        filterOnPress={() => setSortSheetVisible(true)}
      />

      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={isChildMode ? t("Search") : t("Search connection")}
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
            emptyMessage: isChildMode ? t("No Data") : t("No Connections Found."),
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
    paddingVertical: CONNECTION_UI.cardPaddingVertical,
    paddingHorizontal: CONNECTION_UI.cardPaddingHorizontal,
  },
  avatarFrame: {
    width: CONNECTION_UI.avatarSize,
    height: CONNECTION_UI.avatarSize,
    borderRadius: CONNECTION_UI.radiusAvatar,
    overflow: "hidden",
    backgroundColor: CONNECTION_UI.surface,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  cardBody: {
    flex: 1,
    paddingLeft: CONNECTION_UI.iconTextGap,
    justifyContent: "center",
    gap: 6,
  },
  name: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: AppColors.black,
  },
  subtitle: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.subtitle,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.subtitle,
  },
});
