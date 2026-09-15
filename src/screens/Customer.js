import {
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  // SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Colors } from "../constants/color";
import { RFValue } from "react-native-responsive-fontsize";
import { Images } from "../constants/images";
import { FONTS } from "../constants/fontFamily";
import { getData } from "../utils/storeData";
import apiConstants, { customer } from "../api/apiConstants";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  heightPercentageToDP,
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import Modal from "react-native-modal";
import Footer from "../components/Footer";
import Loader from "../components/loading";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
// import SvgUri from 'react-native-svg-uri';

const Customer = ({ navigation, route }) => {
  const { bgcolor } = route.params;
  const { type } = route.params || {};
  const { t } = useTranslation();
  const [customerr, setCustomer] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [isDescending, setIsDescending] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerlist, setcustomerlist] = useState(true);
  const [customerdetail, setCustomerdetail] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const fetchcustomer = async () => {
    // setLoading(true);
    if (!refreshing) {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } else {
      setRefreshing(false);
    }
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.customer, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          // soort_relatie: "opdrachtgever", ////customer type ==> client
        },
      });
      console.log("udhciu======", data);
      if (data.status) {
        // setLoading(false);
        setCustomer(data.data);
        console.log("udhciu======", data?.data);
      } else {
        // setLoading(false);
        console.log("False connections");
      }
    } catch (err) {
      // setLoading(false);
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    fetchcustomer();
  }, []);

  const handleWhatsAppPress = (item) => {
    const phoneNumber = item.whatsapp_number;

    if (phoneNumber) {
      // WhatsApp URL scheme for both Android and iOS
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;

      // Try to open WhatsApp directly without relying solely on canOpenURL
      Linking.openURL(whatsappUrl)
        .then(() => {
          console.log("WhatsApp opened successfully.");
        })
        .catch((err) => {
          console.error("Error opening WhatsApp:", err);

          // Provide fallback if WhatsApp is not installed
          Alert.alert(
            "WhatsApp Not Available",
            "WhatsApp is not installed on your device or cannot be opened. Would you like to install it?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Install",
                onPress: () => {
                  const storeUrl =
                    Platform.OS === "ios"
                      ? "https://apps.apple.com/app/whatsapp-messenger/id310633997"
                      : "https://play.google.com/store/apps/details?id=com.whatsapp";
                  Linking.openURL(storeUrl).catch((err) =>
                    console.error("Error opening store URL:", err)
                  );
                },
              },
            ]
          );
        });
    } else {
      Alert.alert(
        "Invalid Number",
        "The WhatsApp number is not valid. Please provide a valid phone number."
      );
    }
  };

  const renderItem = ({ item }) => {
    const isSelectedCustomer = selectedCustomerId === item.id;

    return (
      <>
        {customerlist ? (
          <TouchableOpacity
            onPress={() => {
              setCustomerdetail(true), setcustomerlist(false);
              setSelectedCustomerId(item.id);
            }}
          >
            <View style={styles.Box}>
              {item?.profile_image?.file_path?.endsWith(".svg") ? (
                <>
                  <SvgUri
                    uri={item.profile_image.file_path}
                    // uri="https://app.erpportaal.nl/public/media/relaties_images/profile_1725452033.svg"
                    // uri="https://app.erpportaal.nl/public/media/relaties_images/profile_1724995198.svg"
                    // uri="file:///Users/dreamworld/Documents/Mansi_Projects/Erp_App/erp_react/src/assets/useee.svg" // local path
                    // uri="file:///Users/dreamworld/Documents/Mansi_Projects/Erp_App/erp_react/src/assets/newww.svg"  // local path
                    width={RFValue(55)} // Adjust width as necessary
                    height={RFValue(55)} // Ensure height is set
                    style={styles.image}
                    onError={(error) => console.log("SVG load error:", error)}
                  />
                </>
              ) : (
                <Image
                  source={{
                    uri: item?.profile_image?.file_path || Images.userblanck,
                  }}
                  style={[
                    styles.image,
                    { height: RFValue(55), width: RFValue(55) },
                  ]}
                />
              )}

              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          ""
        )}

        {/* {customerdetail && isSelectedCustomer ? (
          <>
            <View style={{ alignSelf: "center", marginTop: 20 }}>
              {item?.profile_image?.file_path?.endsWith(".svg") ? (
                <SvgUri
                  uri={item.profile_image.file_path}
                  width={RFValue(100)}
                  height={RFValue(100)}
                  style={styles.image}
                  onError={(error) => console.log("SVG load error:", error)}
                />
              ) : (
                <Image
                  source={{
                    uri: item?.profile_image?.file_path || Images.userblanck,
                  }}
                  style={[
                    styles.image,
                    { height: RFValue(100), width: RFValue(100) },
                  ]}
                />
              )}
            </View>

            <View style={styles.detailsBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{item.display_name || "-"}</Text>
              </View>
              <View style={styles.line} />

              <View style={styles.row}>
                <Text style={styles.label}>Telefoon</Text>
                <Text style={styles.value}>
                  {item.telefoon_country_code || "-"}
                </Text>
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <Text style={styles.label}>Mobile No.</Text>
                <Text style={styles.value}>{item.mobiel || "-"}</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <Text style={styles.label}>Email Adres</Text>
                <Text style={styles.value}>{item.email_adres || "-"}</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <Text style={styles.label}>Whatsapp No.</Text>
                <Text style={styles.value}>{item.whatsapp_number || "-"}</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <Text style={styles.label}>Google maps</Text>
                <Text style={styles.value}>{item.google_maps || "-"}</Text>
              </View>
            </View>
          </>
        ) : null} */}

        {customerdetail && isSelectedCustomer ? (
          <>
            <View style={{ alignSelf: "center", marginTop: 20 }}>
              {item?.profile_image?.file_path?.endsWith(".svg") ? (
                <SvgUri
                  uri={item.profile_image.file_path}
                  width={RFValue(100)}
                  height={RFValue(100)}
                  style={styles.image}
                  onError={(error) => console.log("SVG load error:", error)}
                />
              ) : (
                <Image
                  source={{
                    uri: item?.profile_image?.file_path || Images.userblanck,
                  }}
                  style={[
                    styles.image,
                    { height: RFValue(100), width: RFValue(100) },
                  ]}
                />
              )}
            </View>

            <View style={styles.detailsBox}>
              <View style={styles.row}>
                <Text style={styles.label}>{t("Name")}</Text>
                <Text style={styles.value}>{item.display_name || "-"}</Text>
              </View>
              <View style={styles.line} />

              <View style={styles.row}>
                <Text style={styles.label}>{t("Telefoon")}</Text>
                <Text style={styles.value}>
                  {item.telefoon_country_code || "-"}
                </Text>
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <Text style={styles.label}>{t("Mobile No.")}</Text>
                <Text style={styles.value}>{item.mobiel || "-"}</Text>
              </View>

              <View style={styles.line} />
              <View style={styles.row}>
                <Text style={styles.label}>{t("Email Adres")}</Text>
                <Text style={styles.value}>{item.email_adres || "-"}</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <Text style={styles.label}>{t("Whatsapp No.")}</Text>
                <TouchableOpacity
                  onPress={
                    () => handleWhatsAppPress(item)
                    // Replace with a valid number including country code
                    // const phoneNumber = item.whatsapp_number; // Replace with a valid number including country code
                    // if (phoneNumber) {
                    //   // Open WhatsApp directly
                    //   const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
                    //   Linking.openURL(whatsappUrl).catch((err) => {
                    //     console.error("Error opening WhatsApp:", err);
                    //     Alert.alert(
                    //       "Error Opening WhatsApp",
                    //       "WhatsApp is installed, but we couldn't open it. Please try again or ensure it's properly configured."
                    //     );
                    //   });
                    // } else {
                    //   Alert.alert(
                    //     "Invalid Number",
                    //     "The WhatsApp number is not valid. Please provide a valid phone number."
                    //   );
                    // }
                  }
                >
                  <Text
                    style={[
                      styles.value,
                      {
                        color: Colors.primaryblue,
                        textDecorationLine: "underline",
                        width: "55",
                      },
                    ]}
                  >
                    {item.whatsapp_number}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <Text style={styles.label}>{t("Google maps")}</Text>
                <Text style={styles.value}>{item.google_maps || "-"}</Text>
              </View>
            </View>
            {/* <View style={styles.Box}></View> */}
          </>
        ) : null}
      </>
    );
  };

  useEffect(() => {
    const filterBySearchQuery = (task) =>
      task.display_name?.toLowerCase().includes(searchQuery?.toLowerCase());

    const filterBySelectedStatus = (task) => {
      if (selectedItems.length === 0) return true; // No filter applied
      return selectedItems.includes(task.soort_relatie);
    };

    const filtered = customerr
      .filter(filterBySearchQuery)
      .filter(filterBySelectedStatus);
    setFilteredTasklist(filtered);
  }, [searchQuery, customerr, selectedItems]);

  const sortByCreatedAt = () => {
    const sortedData = [...customerr].sort((a, b) => {
      // Ensure display_name is not null or undefined by using a fallback value
      const aName = a?.display_name?.toLowerCase() || "";
      const bName = b?.display_name?.toLowerCase() || "";

      return isDescending
        ? bName.localeCompare(aName) // Descending order
        : aName.localeCompare(bName); // Ascending order
    });

    setCustomer(sortedData);
    setIsDescending(!isDescending); // Toggle sort direction
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchcustomer();
    console.log("task refresh ==========");
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: bgcolor }]}>
    <>
      {loading && <Loader color={Colors.primary} />}
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      <BlueHeader
        bgcolor={bgcolor}
        goback={
          customerdetail
            ? () => {
                setCustomerdetail(false);
                setcustomerlist(true);
              }
            : null // Don't set anything here, just pass null for default behavior
        }
        title={customerdetail ? t("Details") : t("Customer")}
        Righticon={Images.refresh}
        onPressRight={fetchcustomer}
        SearchBarInput={!customerdetail}
        value={searchQuery}
        onChangeText={setSearchQuery}
        sort={Images.arrow}
        onPressfilter={sortByCreatedAt}
      />

      <View style={styles.background}>
        <FlatList
          data={filteredTasklist}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Image
                source={Images.noconnection}
                style={styles.fallbackImage}
              />
            </View>
          )}
          contentContainerStyle={{
            paddingBottom: 30, // Adds bottom padding to the content
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary, "#F048C6"]}
              tintColor={Colors.primary}
            />
          }
        />
      </View>

      {/* <Footer /> */}
      {/* </SafeAreaView> */}
    </>
  );
};

export default Customer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  detailtext: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.primary,
  },
  headerbackground: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: "5%",
  },
  header: {
    fontSize: RFValue(19),
    fontFamily: FONTS.LexendMedium,
    color: Colors.white,
    left: wp("18%"),
    alignSelf: "center",
  },
  backimage: {
    height: 20,
    width: 20,
    tintColor: Colors.white,
  },
  background: {
    backgroundColor: Colors.litegray1,
    height: "100%",
    marginTop: heightPercentageToDP(-1),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flex: 1,
  },
  backbtn: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 35,
    width: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  Box: {
    paddingVertical: 10,
    width: "90%",
    alignSelf: "center",
    borderWidth: 1,
    marginTop: heightPercentageToDP(1),
    borderRadius: 10,
    borderColor: Colors.litegray,
    paddingLeft: RFValue(10),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  image: {
    marginRight: RFValue(15),
    borderRadius: RFValue(5),
    borderWidth: 1,
    borderColor: Colors.litegray,
  },
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
    width: "75%",
  },
  name: {
    fontSize: RFValue(13),
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    flexWrap: "wrap",
  },
  standard: {
    fontSize: RFValue(12),
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    marginTop: RFValue(18),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFValue(120),
  },
  fallbackImage: {
    width: RFValue(200),
    height: RFValue(200),
    resizeMode: "contain",
  },
  noDataText: {
    marginTop: RFValue(20),
    fontSize: RFValue(16),
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  up: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 35,
    width: 35,
    justifyContent: "center",
    alignItems: "center",
  },

  modalname: {
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
  },
  checkView: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(12),
  },
  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
    marginHorizontal: 10,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    color: Colors.textgray,
  },
  value: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    color: Colors.primaryblue,
    textAlign: "right",
    flexWrap: "wrap",
    width: "55%",
  },
  detailsBox: {
    marginHorizontal: 15,
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    backgroundColor: Colors.white,
  },
});
