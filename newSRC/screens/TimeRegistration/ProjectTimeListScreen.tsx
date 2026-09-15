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
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchProjectsForTimeRegistration,
  type ProjectTimeListItem,
} from "../../services/timeRegistrationService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function ProjectTimeListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string }>();

  const [items, setItems] = useState<ProjectTimeListItem[]>([]);
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
        const data = await fetchProjectsForTimeRegistration();
        setItems(data);
      } catch (error) {
        captureApiError(error);
        setItems([]);
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
    return items.filter((item) =>
      (item.project_name || "").toLowerCase().includes(query)
    );
  }, [items, search]);

  const renderItem = ({ item }: { item: ProjectTimeListItem }) => {
    const owners = (item.relaties_owners || [])
      .map((owner) => owner.display_name)
      .filter(Boolean)
      .join(", ");

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/(app)/project-time/[id]",
            params: {
              id: String(item.id),
              projectName: item.project_name || "",
              color: params.color || "",
            },
          })
        }
      >
        <FallBackImage
          source={item.project_image ? { uri: item.project_image } : undefined}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.cardBody}>
          <Text style={styles.projectName} numberOfLines={2}>
            {item.project_name || "-"}
          </Text>
          {owners ? (
            <Text style={styles.owners} numberOfLines={2}>
              {owners}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={t("Project Time Registration")}
        onBack={() => router.back()}
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
          contentContainerStyle={{
            paddingBottom: scrollPadding,
            paddingHorizontal: LIST_UI.screenPadding,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={listEmptyFeedback({
            loading,
            apiError,
            onRetry: () => loadData(),
            emptyMessage: t("No data found"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: AppColors.white,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
  },
  cardBody: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: "center",
    gap: 4,
  },
  projectName: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  owners: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
  },
});
