import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchAnnouncements,
  formatHrDate,
  type AnnouncementItem,
} from "../../services/hrPortalService";
import { removeHtmlTags } from "../../utils/storeData";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function AnnouncementListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ title?: string }>();

  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const screenTitle = params.title ? t(params.title) : t("Announcements");

  const loadData = useCallback(
    async (pull = false) => {
      try {
        if (pull) setRefreshing(true);
        else setLoading(true);
        clearApiError();
        setItems(await fetchAnnouncements());
      } catch (error) {
        captureApiError(error);
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
    return items.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const description = removeHtmlTags(item.description || "").toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [items, search]);

  const renderItem = ({ item }: { item: AnnouncementItem }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(app)/announcements/[id]",
          params: { id: String(item.id), title: item.title || "" },
        })
      }
    >
      <Text style={styles.title} numberOfLines={2}>
        {item.title || t("Announcements")}
      </Text>
      {item.description ? (
        <Text style={styles.preview} numberOfLines={2}>
          {removeHtmlTags(item.description)}
        </Text>
      ) : null}
      <Text style={styles.meta}>{formatHrDate(item.created_at)}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={screenTitle} refreshOnPress={() => loadData(true)} />
      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search")}
        />
      </View>
      <ListScreenBody
        loading={loading}
        itemCount={filteredItems.length}
        apiError={apiError}
        onRetry={() => loadData()}
        emptyMessage={t("No announcements")}
      >
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          style={styles.list}
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
            emptyMessage: t("No announcements"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  searchWrap: listScreenStyles.searchWrap,
  list: listScreenStyles.list,
  listContent: listScreenStyles.listContent,
  card: listScreenStyles.card,
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  preview: {
    marginTop: 6,
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.subtitle,
  },
  meta: {
    marginTop: 8,
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
  },
});
