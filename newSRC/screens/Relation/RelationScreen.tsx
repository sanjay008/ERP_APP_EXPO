import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchQuickRelations,
  type QuickRelationItem,
} from "../../services/relationService";
import { hasPermission } from "../../utils/permissionFlags";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

function iconColor(color?: string) {
  const value = color?.trim();
  return value || AppColors.primary;
}

export default function RelationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { permissions } = useAppData();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ title?: string; color?: string }>();

  const canReadRelations = hasPermission(permissions, "quick_relations_mobile", "read");
  const canCreateRelations = hasPermission(permissions, "quick_relations_mobile", "create");

  const [items, setItems] = useState<QuickRelationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const screenTitle = params.title ? t(params.title) : t("Relation");

  const loadData = useCallback(
    async (pull = false) => {
      try {
        if (pull) setRefreshing(true);
        else setLoading(true);
        clearApiError();
        const response = await fetchQuickRelations();
        const rows = response?.status && Array.isArray(response.data) ? response.data : [];
        setItems(rows.map((item) => ({ ...item })));
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

  const openForm = (item: QuickRelationItem) => {
    if (!canCreateRelations) return;
    router.push({
      pathname: "/(app)/relation/form",
      params: {
        item: JSON.stringify(item),
        category_id: String(item.category_id ?? ""),
        popup_text: item.popup_text || item.title || "",
        default_country_code: String(item.default_country_code ?? ""),
        is_employee_client: String(item.is_employee_client ?? ""),
        is_customer_client: String(item.is_customer_client ?? ""),
        is_employee_of_company: String(item.is_employee_of_company ?? ""),
      },
    });
  };

  if (!canReadRelations) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  const renderItem = ({ item }: { item: QuickRelationItem }) => (
    <Pressable
      style={[styles.card, !canCreateRelations && styles.cardDisabled]}
      onPress={() => openForm(item)}
      disabled={!canCreateRelations}
    >
      <View style={styles.iconBox}>
        <Ionicons name="people-outline" size={22} color={iconColor(item.color)} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title || "-"}
        </Text>
        {item.hover_text ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.hover_text}
          </Text>
        ) : null}
        {item.popup_text && item.popup_text !== item.hover_text ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.popup_text}
          </Text>
        ) : null}
        {item.category_name || item.relation_type_name ? (
          <Text style={styles.meta} numberOfLines={1}>
            {[item.category_name, item.relation_type_name].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={screenTitle} refreshOnPress={() => loadData(true)} />

      <ListScreenBody
        loading={loading}
        itemCount={items.length}
        apiError={apiError}
        onRetry={() => loadData()}
      >
        <FlatList
          data={items}
          keyExtractor={(item, index) => String(item.id ?? `${item.title}-${index}`)}
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
            emptyMessage: t("No quick relations"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  list: listScreenStyles.list,
  listContent: listScreenStyles.listContent,
  card: {
    ...listScreenStyles.rowCard,
    paddingVertical: LIST_UI.cardPaddingVertical,
    paddingHorizontal: LIST_UI.cardPaddingHorizontal,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  iconBox: {
    width: LIST_UI.iconSize,
    height: LIST_UI.iconSize,
    borderRadius: LIST_UI.iconRadius,
    backgroundColor: LIST_UI.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    paddingLeft: LIST_UI.iconTextGap,
    justifyContent: "center",
    gap: 4,
  },
  title: {
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
  meta: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.subtitle,
  },
});
