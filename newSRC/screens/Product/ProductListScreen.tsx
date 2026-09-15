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
import { fetchProducts, type ProductItem } from "../../services/productService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { Images } from "../../utils/Images";

const NUM_COLUMNS = 3;

export default function ProductListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; title?: string }>();

  const [items, setItems] = useState<ProductItem[]>([]);
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
        const data = await fetchProducts();
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
      (item.product_name || "").toLowerCase().includes(query)
    );
  }, [items, search]);

  const renderItem = useCallback(
    ({ item }: { item: ProductItem }) => (
      <View style={styles.productBox}>
        <View style={styles.imageWrap}>
          <FallBackImage
            source={item.image_product ? { uri: item.image_product } : undefined}
            fallbackImage={Images.DefaultImage}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
          {item.product_name || "-"}
        </Text>
      </View>
    ),
    []
  );

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={params.title || t("Ecommerce Product")}
        onBack={() => router.back()}
        refreshOnPress={() => loadData(true)}
      />

      <View style={listScreenStyles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search")}
          onClear={() => setSearch("")}
        />
      </View>

      <View style={styles.addHintRow}>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/(app)/products/create")}
        >
          <Text style={styles.addBtnText}>+ {t("Add Product")}</Text>
        </Pressable>
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={filteredItems.length}
        apiError={apiError}
        onRetry={() => loadData()}
      >
        <FlatList
          data={filteredItems}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderItem}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={{
            paddingBottom: scrollPadding,
            paddingHorizontal: LIST_UI.screenPadding,
            paddingTop: 12,
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
            emptyMessage: t("No more products"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  addHintRow: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingBottom: 8,
  },
  addBtn: {
    alignSelf: "flex-end",
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.white,
  },
  columnWrap: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  productBox: {
    width: "31%",
    backgroundColor: AppColors.white,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
  },
  imageWrap: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 6,
  },
  productImage: {
    width: 70,
    height: 70,
  },
  productName: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.black,
    textAlign: "center",
    width: "100%",
    minHeight: 32,
  },
});
