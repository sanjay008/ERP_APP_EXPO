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
import { fetchCustomers, type RelatieOption } from "../../services/taskService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function CustomerListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; title?: string }>();

  const [items, setItems] = useState<RelatieOption[]>([]);
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
        const response = await fetchCustomers();
        if (response?.status && Array.isArray(response.data)) {
          setItems(response.data);
        } else {
          setItems([]);
        }
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
      (item.display_name || item.bedrijfsnaam || "").toLowerCase().includes(query)
    );
  }, [items, search]);

  const renderItem = ({ item }: { item: RelatieOption }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(app)/customers/[id]",
          params: {
            id: String(item.id),
            color: params.color || "",
          },
        })
      }
    >
      <FallBackImage
        source={
          item.profile_image?.file_path
            ? { uri: item.profile_image.file_path }
            : undefined
        }
        style={styles.avatar}
        resizeMode="cover"
      />
      <Text style={styles.name} numberOfLines={2}>
        {item.display_name || item.bedrijfsnaam || "-"}
      </Text>
    </Pressable>
  );

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={params.title || t("Customers")}
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
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: AppColors.white,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
  },
  name: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
});
