import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import LanguageChange from "../../Components/LanguageChange";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import ApiService from "../../utils/Apiservice";
import { apiConstants } from "../../utils/apiConstants";
import { logoutAndPreservePreferences } from "../../utils/authSession";
import { getData } from "../../utils/storeData";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { useAppData } from "../../context/AppDataContext";
import {
  logHomeItems,
  navigateFromHomeItem,
  type HomeMenuItem,
} from "../../utils/homeNavigation";
import { LIST_UI } from "../../utils/connectionTheme";
import { LIST_CARD_SHADOW } from "../../utils/listScreenStyles";
import EmployeeCheckInOutModal from "../../Components/EmployeeCheckInOutModal";
import ProjectCheckInOutModal from "../../Components/ProjectCheckInOutModal";
import {
  fetchCheckInOutState,
  fetchProjectCheckInOutState,
  getTodayFormats,
  isCheckedInFlag,
} from "../../services/checkInOutService";

type HomeItem = HomeMenuItem;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding, modalPadding } = useScreenInsets({ includeTabBar: true });
  const { clearAppData } = useAppData();

  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<HomeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState<"check-in" | "check-out" | null>(null);
  const [projectModalMode, setProjectModalMode] = useState<"check-in" | "check-out" | null>(null);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const refreshCheckInOutStatus = useCallback(async () => {
    const { displayDate } = getTodayFormats();
    try {
      await Promise.all([
        fetchCheckInOutState(displayDate),
        fetchProjectCheckInOutState(displayDate),
      ]);
    } catch {
      // Keep last known status if refresh fails silently.
    }
  }, []);

  const loadCompanyInfo = useCallback(async () => {
    const companyLogo = await getData("COMPANYLOGO");
    const companyLogin = await getData("COMPANYLOGIN");
    setLogo(companyLogo);
    setCompanyName(companyLogin);
  }, []);

  const fetchHomeItems = useCallback(async () => {
    setLoading(true);
    try {
      clearApiError();
      const userData = await getData("USERDATA");
      const response = await ApiService<HomeItem[]>(apiConstants.home, {
        includeToken: true,
        customData: {
          role: userData?.data?.user?.role,
        },
      });

      if (response?.status && Array.isArray(response.data)) {
        const unique = response.data.filter(
          (item, index, self) => index === self.findIndex((t) => t.id === item.id)
        );
        logHomeItems(unique);
        setHomeData(unique);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [clearApiError, captureApiError]);

  useEffect(() => {
    loadCompanyInfo();
    fetchHomeItems();
  }, [loadCompanyInfo, fetchHomeItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCompanyInfo(), fetchHomeItems()]);
    setRefreshing(false);
  }, [loadCompanyInfo, fetchHomeItems]);

  useFocusEffect(
    useCallback(() => {
      refreshCheckInOutStatus();
    }, [refreshCheckInOutStatus])
  );

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        Alert.alert(t("Hold on!"), t("Are you sure you want to exit?"), [
          { text: t("Cancel"), style: "cancel" },
          { text: t("YES"), onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });
      return () => subscription.remove();
    }, [t])
  );

  const handleItemPress = async (item: HomeItem) => {
    const linkTo = item.link_to?.trim();

    if (linkTo === "checkinout") {
      setProjectModalMode(null);
      const { displayDate } = getTodayFormats();
      const state = await fetchCheckInOutState(displayDate);
      const checkedIn = isCheckedInFlag(state.checkData?.check_in_out);
      setEmployeeModalMode(checkedIn ? "check-out" : "check-in");
      return;
    }

    if (linkTo === "Check_In/Out_for_Project") {
      setEmployeeModalMode(null);
      const { displayDate } = getTodayFormats();
      const state = await fetchProjectCheckInOutState(displayDate);
      const checkedIn = isCheckedInFlag(state.checkData?.check_in_out);
      setProjectModalMode(checkedIn ? "check-out" : "check-in");
      return;
    }

    navigateFromHomeItem(router, item);
  };

  const handleLogout = async () => {
    await logoutAndPreservePreferences();
    clearAppData();
    setLogoutVisible(false);
    router.replace("/registration/company");
  };

  const confirmLogout = () => {
    setLogoutVisible(true);
  };

  const renderItem = ({ item, index }: { item: HomeItem; index: number }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { marginBottom: index === homeData.length - 1 ? 80 : LIST_UI.cardGap },
      ]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: item.color_code || "#EDB20F" },
          item.link_to === "relaties" && styles.iconBoxImage,
        ]}
      >
        {item.item_image ? (
          <ExpoImage
            source={{ uri: item.item_image }}
            style={styles.cardIcon}
            contentFit="contain"
            tintColor={item.link_to !== "relaties" ? AppColors.white : undefined}
          />
        ) : (
          <Image
            source={Images.userVector}
            style={styles.cardIcon}
            tintColor={AppColors.white}
          />
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {t(item.item_title)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />

      <View style={styles.headerWrap}>
        <View style={styles.header}>
          {logo ? (
            <ExpoImage
              source={{ uri: logo }}
              style={[
                styles.logo,
                companyName === "playground" && styles.logoPlayground,
              ]}
              contentFit="contain"
            />
          ) : (
            <Image source={Images.Logo} style={styles.logo} resizeMode="contain" />
          )}

          <LanguageChange />
        </View>
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={homeData.length}
        apiError={apiError}
        onRetry={() => fetchHomeItems()}
      >
        <FlatList
          data={homeData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: scrollPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColors.primary]}
              tintColor={AppColors.primary}
            />
          }
          ListFooterComponent={
            <Pressable style={styles.logoutFooterBtn} onPress={confirmLogout}>
              <Ionicons name="log-out-outline" size={20} color={AppColors.white} />
              <Text style={styles.logoutFooterText}>{t("Uitloggen")}</Text>
            </Pressable>
          }
          ListEmptyComponent={listEmptyFeedback({
            loading,
            apiError,
            onRetry: () => fetchHomeItems(),
            emptyMessage: t("No Permission Slide"),
          })}
        />
      </ListScreenBody>

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.logoutBackdrop}>
          <View style={[styles.logoutCard, { marginBottom: modalPadding }]}>
            <Text style={styles.logoutTitle}>{t("Uitloggen")} ?</Text>
            <Text style={styles.logoutMessage}>{t("Weet u zeker dat u wilt uitloggen?")}</Text>
            <View style={styles.logoutActions}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.logoutBtnText}>{t("Annuleren")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutBtn, styles.logoutBtnPrimary]}
                onPress={handleLogout}
              >
                <Text style={[styles.logoutBtnText, styles.logoutBtnTextPrimary]}>
                  {t("Uitloggen")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <EmployeeCheckInOutModal
        visible={employeeModalMode !== null}
        mode={employeeModalMode ?? "check-in"}
        onClose={() => setEmployeeModalMode(null)}
        onComplete={refreshCheckInOutStatus}
      />

      <ProjectCheckInOutModal
        visible={projectModalMode !== null}
        mode={projectModalMode ?? "check-in"}
        onClose={() => setProjectModalMode(null)}
        onComplete={refreshCheckInOutStatus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  headerWrap: {
    backgroundColor: AppColors.white,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 4,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: LIST_UI.headerPaddingV,
    backgroundColor: AppColors.white,
  },
  logo: {
    width: 120,
    height: 40,
  },
  logoPlayground: {
    marginLeft: 0,
  },
  listContent: {
    paddingTop: LIST_UI.listTop,
    paddingHorizontal: LIST_UI.screenPadding,
    flexGrow: 1,
  },
  list: {
    flex: 1,
    backgroundColor: "transparent",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: LIST_UI.cardHeight,
    backgroundColor: AppColors.white,
    padding: LIST_UI.cardPadding,
    borderRadius: LIST_UI.cardRadius,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    ...LIST_CARD_SHADOW,
  },
  iconBox: {
    width: LIST_UI.iconSize,
    height: LIST_UI.iconSize,
    borderRadius: LIST_UI.iconRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxImage: {
    overflow: "hidden",
  },
  cardIcon: {
    height: 28,
    width: 28,
  },
  cardTitle: {
    flex: 1,
    color: AppColors.black,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: FONTS.LexendSemiBold,
    marginLeft: LIST_UI.iconTextGap,
  },
  logoutBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoutCard: {
    width: "100%",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 24,
  },
  logoutTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 20,
    color: AppColors.black,
    marginBottom: 8,
  },
  logoutMessage: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 24,
  },
  logoutActions: {
    flexDirection: "row",
    gap: 12,
  },
  logoutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E5EA",
  },
  logoutBtnPrimary: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  logoutBtnText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.black,
  },
  logoutBtnTextPrimary: {
    color: AppColors.white,
  },
  logoutFooterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
  },
  logoutFooterText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.white,
  },
});
