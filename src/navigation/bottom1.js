
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler, Image, Linking, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { FONTS } from "../constants/fontFamily";
import { Colors } from "../constants/color";
import { Images } from "../constants/images";
import { getData } from "../utils/storeData";
import { MenuScreen, TaxiBokking, TimelinecalanderScreen, TimelineScreen } from "./bottam";
import Loader from "../components/loading";
import VersionCheck from "react-native-version-check";
import Modal from "react-native-modal";
import { useTranslation } from "react-i18next";
import { PERMISSIONS } from "react-native-permissions";
import { t } from "i18next";
import { useAppData } from "../../newSRC/context/AppDataContext";
const Tab = createBottomTabNavigator();
import messaging from '@react-native-firebase/messaging'

export const BottamScreens1 = ({ route }) => {
  const { refresh } = route?.params || {};
  const [userData, SetUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const { permissions: permission, fetchPermissions } = useAppData();

  const fetchPermission = useCallback(async () => {
    setLoading(true);
    try {
      const getdata = await getData("USERDATA");
      SetUserData(getdata.data);
      if (
        !getdata ||
        !getdata.data ||
        !getdata.data.user ||
        !getdata.data.relaties
      ) {
        console.log("Missing required user data:", getdata);
        return;
      }
      await fetchPermissions();
    } catch (error) {
      console.log("Error fetching permission:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchPermissions]);
const parseVersion = (version) => {
  if (!version) return [0, 0, 0];
  return version
    .split('.')
    .map(num => parseInt(num, 10)); 
};

const isUpdateAvailable = (latest, current) => {
  const [latestMajor, latestMinor, latestPatch] = parseVersion(latest);
  const [currentMajor, currentMinor, currentPatch] = parseVersion(current);

  if (latestMajor > currentMajor) return true;
  if (latestMajor < currentMajor) return false;

  if (latestMinor > currentMinor) return true;
  if (latestMinor < currentMinor) return false;

  if (latestPatch > currentPatch) return true;
  return false;
};

// Usage
const checkForUpdate = useCallback(async () => {
  try {
    const apnsToken = await messaging().getAPNSToken();
    console.log("APNs Token:", apnsToken);
    const latest = await VersionCheck.getLatestVersion();
    const current = VersionCheck.getCurrentVersion();

    console.log("Latest Version:", latest);
    console.log("Current Version:", current);

    if (isUpdateAvailable(latest, current)) {
      setVisible(true); // show update modal
    }
  } catch (error) {
    console.error("Error checking app version:", error);
  }
}, []);

  useEffect(() => {
    fetchPermission();
  }, [fetchPermission, refresh]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);
  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t("Location Permission"),
            message: t("App needs access to your location"),
          }
        );

        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t("Camera Permission"),
            message: t("App needs access to your camera"),
          }
        );
        if (
          locationGranted === PermissionsAndroid.RESULTS.GRANTED &&
          cameraGranted === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log(t("All permissions granted"));
        } else {
          console.log(t("One or more permissions denied"));
        }
      } catch (err) {
        console.warn(err, "catch erroooooooor121212/90909090900900");
      }
    } else if (Platform.OS === "ios") {
      try {
        const cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
    
        if (
          cameraStatus === RESULTS.GRANTED
        ) {
          console.log("All permissions granted on iOS");
        } else {
          console.log("One or more permissions denied on iOS");
        }

      } catch (err) {
        console.warn(err, "catch error 12121 -=-=-==-==-=-");
      }
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);


  const Icon = ({ img, focused, height, width }) => (
    <Image
      source={img}
      style={{
        height: height ? height : 22,
        width: width ? width : 22,
        tintColor: focused ? Colors.primary : Colors.black,
      }}
      resizeMode="contain"
    />
  );
  const openStore = () => {
    const url =
      Platform.OS === "ios"
        ? "https://apps.apple.com/nl/app/erp-portaal/id6523437695"
        : "https://play.google.com/store/apps/details?id=com.erpportaal&hl=nl";

    Linking.openURL(url).catch((err) =>
      console.error("Error opening store:", err)
    );
  };
  const Role = userData?.user?.role;
  return (
    <>
      <View>
        <Modal
          isVisible={visible}
          onBackdropPress={() => setVisible(false)}
          avoidKeyboard={true}
          style={{ margin: 0 }}
        >
          <View
            style={[
              styles.modal,
              { width: "90%", alignSelf: "center", paddingVertical: 20 },
            ]}
          >
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={styles.closebtnbg}
                onPress={() => setVisible(false)}
              >
                <Image source={Images.close} style={{ height: 20, width: 20 }} />
              </TouchableOpacity>
            </View>
            <Text
              style={{
                fontSize: 18,
                fontFamily: FONTS.LexendBold,
                marginBottom: 10,
                color: Colors.black,
              }}
            >
              Update Available
            </Text>
            <Text style={{ fontSize: 16, fontFamily: FONTS.LexendRegular, color: Colors.black }}>
              Your app version is outdated. Please update to the latest version.
            </Text>

            <TouchableOpacity
              onPress={openStore}
              style={{
                marginTop: 20,
                padding: 10,
                backgroundColor: Colors.primary,
                borderRadius: 5,
                fontFamily: FONTS.LexendRegular,
              }}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontFamily: FONTS.LexendBold,
                  alignSelf: "center",
                }}
              >
                {t("Update Now")}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
      {loading ?

        <Loader />
        :
        <Tab.Navigator
        initialRouteName="MenuScreen"
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
              backgroundColor: Colors.litegray,
            },
          }}
        >


          {permission?.home_timeline?.read == 1 ? (
            <Tab.Screen
              name="TimelineScreen"
              component={TimelineScreen}
              options={{
                tabBarIcon: ({ focused }) => (
                  <Icon img={Images.home} focused={focused} />
                ),
              }}
            />
          ) : null}

          {permission?.calendar_timeline?.read == 1 ? (
            <Tab.Screen
              name="TimelinecalanderScreen"
              component={TimelinecalanderScreen}
              options={{
                tabBarIcon: ({ focused }) => (
                  <Icon img={Images.date} focused={focused} />
                ),
              }}
            />
          ) : null}
       


          <Tab.Screen
            name="MenuScreen"
            component={MenuScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <Icon img={Images.menu} focused={focused} />
              ),
            }}
          />


          {permission?.taxi_booking?.read == 1 ? (
            <Tab.Screen
              name="TaxiBokking"
              component={TaxiBokking}
              options={{

                tabBarIcon: ({ focused }) => (
                  <Icon img={Images.taxi} focused={focused} height={25} width={25} />
                ),
              }}
            />
          ) : null}

        </Tab.Navigator>
      }
    </>
  );
};
const styles = StyleSheet.create({
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    // maxHeight: heightPercentageToDP("90%"),
  },
  closebtnbg: {
    height: 35,
    width: 35,
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
})