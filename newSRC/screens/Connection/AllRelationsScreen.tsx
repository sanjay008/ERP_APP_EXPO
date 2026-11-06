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
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import FallBackImage from "../../Components/FallBackImage";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchAllRelations,
  matchesAllRelationTab,
  type AllRelationItem,
  type AllRelationTab,
} from "../../services/connectionService";
import { hasPermission } from "../../utils/permissionFlags";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { CONNECTION_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

const TABS: { id: AllRelationTab; label: string }[] = [
  { id: "company", label: "Company Clients" },
  { id: "person", label: "Person Clients" },
  { id: "employee", label: "Employees" },
];

export default function AllRelationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { permissions } = useAppData();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ title?: string; color?: string }>();
  const titleParam = Array.isArray(params.title) ? params.title[0] : params.title;
  const color = Array.isArray(params.color) ? params.color[0] : params.color;
  const canRead = hasPermission(permissions, "all_relations_mobile", "read");

  const [items, setItems] = useState<AllRelationItem[]>([]);
  const [tab, setTab] = useState<AllRelationTab>("company");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadData = useCallback(
    async (pull = false) => {
      if (pull) setRefreshing(true);
      else setLoading(true);
      clearApiError();
      try {
        setItems(await fetchAllRelations());
      } catch (error) {
        captureApiError(error);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [captureApiError, clearApiError]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => matchesAllRelationTab(item, tab))
      .filter((item) => {
        if (!query) return true;
        const name = `${item.display_name || ""} ${item.bedrijfsnaam || ""}`.toLowerCase();
        return name.includes(query);
      })
      .sort((left, right) =>
        (left.display_name || left.bedrijfsnaam || "").localeCompare(
          right.display_name || right.bedrijfsnaam || ""
        )
      );
  }, [items, search, tab]);

  if (!canRead) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={titleParam ? t(titleParam) : t("Alle relaties")}
        refreshOnPress={() => loadData(true)}
      />

      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search")}
          onClear={() => setSearch("")}
          containerStyle={styles.searchBox}
        />
      </View>

      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((item) => {
            const selected = item.id === tab;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.tab, selected && styles.tabSelected]}
                onPress={() => setTab(item.id)}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]} numberOfLines={1}>
                  {t(item.label)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={visibleItems.length}
        apiError={apiError}
        onRetry={() => loadData()}
      >
        <FlatList
          data={visibleItems}
          key={tab}
          keyExtractor={(item) => String(item.id)}
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
            emptyMessage: t("No relations"),
          })}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(app)/connections/[id]",
                  params: { id: String(item.id), color: color || "" },
                })
              }
            >
              <View style={styles.avatarFrame}>
                <FallBackImage
                  source={item.file_path ? { uri: item.file_path } : undefined}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.display_name || item.bedrijfsnaam || "-"}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.soort_relatie || "-"}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </ListScreenBody>
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
  tabBar: {
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: CONNECTION_UI.cardBorder,
    paddingTop: 12,
    paddingBottom: 12,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: CONNECTION_UI.screenPadding,
  },
  tab: {
    minHeight: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: CONNECTION_UI.cardBorder,
    backgroundColor: CONNECTION_UI.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  tabText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.black,
  },
  tabTextSelected: {
    color: AppColors.white,
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
});
