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
  fetchBusinessCompanies,
  type BusinessCompanyItem,
} from "../../services/companyService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { Images } from "../../utils/Images";

export default function MyCompanyListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; title?: string }>();

  const [items, setItems] = useState<BusinessCompanyItem[]>([]);
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
        const data = await fetchBusinessCompanies();
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
    return items.filter(
      (item) =>
        (item.display_name || "").toLowerCase().includes(query) ||
        (item.city || "").toLowerCase().includes(query) ||
        (item.email_adres || "").toLowerCase().includes(query)
    );
  }, [items, search]);

  const renderItem = ({ item }: { item: BusinessCompanyItem }) => (
    <View style={styles.card}>
      <Text style={styles.companyName}>{item.display_name || t("No Name")}</Text>

      {item.city ? (
        <View style={styles.row}>
          <FallBackImage source={Images.ConnectionLocation} style={styles.icon} resizeMode="contain" />
          <Text style={styles.subText}>{item.city}</Text>
        </View>
      ) : null}

      {item.email_adres ? (
        <View style={styles.row}>
          <FallBackImage source={Images.ConnectionMail} style={styles.icon} resizeMode="contain" />
          <Text style={styles.subText}>{item.email_adres}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/(app)/connections/[id]",
              params: {
                id: String(item.id),
                color: item.color_code || params.color || "",
              },
            })
          }
        >
          <Text style={styles.buttonText}>{t("Profile")}</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/(app)/my-company/business/[id]",
              params: {
                id: String(item.id),
                color: params.color || item.color_code || "",
              },
            })
          }
        >
          <Text style={styles.buttonText}>{t("Business Page")}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={params.title || t("My Company")}
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
          ListHeaderComponent={
            <Pressable
              style={styles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/(app)/my-company/create",
                  params: { color: params.color || "" },
                })
              }
            >
              <Text style={styles.buttonText}>{t("+Add Company")}</Text>
            </Pressable>
          }
          contentContainerStyle={{
            paddingBottom: scrollPadding,
            paddingHorizontal: LIST_UI.screenPadding,
            paddingTop: 8,
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
            emptyMessage: t("No Companies Found"),
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
  addButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
  },
  companyName: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 18,
    color: AppColors.black,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  icon: {
    width: 18,
    height: 18,
  },
  subText: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.subtitle,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  button: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
});
