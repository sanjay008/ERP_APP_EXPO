import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import React, { useEffect, useState } from "react";
import ApiService from "../utils/Apiservice";
import apiConstants, { pay_orders } from "../api/apiConstants";
import { getData } from "../utils/storeData";
import { Colors } from "../constants/color";
import BlueHeader from "../components/BlueHeader";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { useTranslation } from "react-i18next";
import { Images } from "../constants/images";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import Footer from "../components/Footer";
import Filtersortmodal from "../components/Filtersortmodal";

const Payorder = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { item } = route.params;
  const [payorder, Setpayorder] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [payorderdetails, setPayorderDetails] = useState(false);
  const [payorderlist, setPayorderList] = useState(true);
  const [expandedItemId, setExpandedItemId] = useState(null);
  // const [paymentDetails, setPaymentDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [statusdata, setStatusData] = useState([]);
  const [filterModalvisible, setFilterModalVisible] = useState(false);
  const [selectedStatusIds, setSelectedStatusIds] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [isDescending, setIsDescending] = useState(true);

  const handleBackButtonPress = () => {
    if (payorderdetails) {
      // If on the details screen, go back to the list screen
      setPayorderDetails(false);
      setPayorderList(true);
    } else {
      // Otherwise, navigate to the home screen
      navigation.goBack();
    }
    return true; // Prevent the default back behavior
  };

  useEffect(() => {
    const backAction = () => {
      handleBackButtonPress();
      return true; // Indicate that we've handled the back button
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => {
      backHandler.remove(); // Cleanup the listener when the component unmounts
    };
  }, [payorderdetails, navigation]);

  // backhandler manage in one screen
  // useEffect(() => {
  //   const backAction = () => {
  //     handleBackButtonPress();
  //     return true; // Indicate that we've handled the back button
  //   };

  //   const backHandler = BackHandler.addEventListener(
  //     "hardwareBackPress",
  //     backAction
  //   );

  //   const unsubscribe = navigation.addListener("beforeRemove", (e) => {
  //     e.preventDefault();
  //     handleBackButtonPress();
  //   });

  //   return () => {
  //     backHandler.remove(); // Android cleanup
  //     unsubscribe(); // iOS cleanup
  //   };
  // }, [navigation, payorderdetails]);

  const FetchPayorder = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.pay_orders, {
        includeToken: true,
        customData: {
          role: getdata.data.user.role,
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
        },
      });
      if (data) {
        // console.log(data.data, "iahjndei====");
        Setpayorder(data.data.pay_orders);
      } else {
        console.log("No data found");
      }
    } catch {
      console.log("Error");
    }
  };
  const StusSearch = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
        customData: {
          slug: "Pay_order",
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      // console.log(data, "suv==========");
      if (data.status) {
        setStatusData(data.data);
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    FetchPayorder();
    StusSearch();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    FetchPayorder();
    console.log("task refresh ==========");
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  const handleItemClick = (itemId) => {
    setExpandedItemId(itemId);
    setPayorderList(false); // Hide the payorder list
    setPayorderDetails(true); // Show the payment details view

    // Fetch payment details for the selected pay order
    // const selectedPayment = DATA.find((order) => order.id === itemId);
    // const selectedPayment = payorder.find((order) => order.id === itemId);
    // if (selectedPayment) {
    //   setPaymentDetails(selectedPayment); // Set payment details for the selected pay order
    // }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }).format(date);
  };

  const renderItem = ({ item, index }) => {
    const isExpanded = expandedItemId === item.id;
    return (
      <>
        {payorderlist ? (
          <TouchableOpacity onPress={() => handleItemClick(item.id)}>
            <View style={styles.Box}>
              <View style={styles.textContainer}>
                <Text style={styles.standard}>
                  {t("Pay order")} :{"  "}
                  <Text style={styles.standard1}>{item.pay_order_nr}</Text>
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <Text style={styles.standard}>
                    {t("Description")} :{"  "}
                  </Text>
                  <Text style={[styles.standard1, { width: "75%" }]}>
                    {item?.description || "--"}
                  </Text>
                </View>
                <Text style={styles.standard}>
                  {t("Amount")} :{"  "}
                  <Text style={styles.standard1}>
                    {item?.rent_currencys?.symbol}{" "}
                    {parseFloat(item?.amount).toFixed(2) || "--"}
                  </Text>
                </Text>
                <Text style={styles.standard}>
                  {t("Outstading")} :
                  <Text style={styles.standard1}>
                    {"  "}
                    {item?.rent_currencys?.symbol}{" "}
                    {parseFloat(item.outstading).toFixed(2)}
                  </Text>
                </Text>
              </View>

              {item.module_status ? (
                <View style={styles.statusbg}>
                  <View
                    style={[
                      styles.statusbox,
                      {
                        backgroundColor:
                          item?.module_status?.color || Colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.statusname}>
                      {item?.module_status?.status_name}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        ) : null}

        {payorderdetails && isExpanded ? (
          <>
            <Text style={styles.title}>{item.pay_order_nr}</Text>
            <View style={styles.leaveBox}>
              <View style={styles.row}>
                <Text style={styles.label}>{t("Payment Order")}</Text>
                <Text style={styles.value}>{item.pay_order_nr}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t("Description")}</Text>
                <Text style={styles.value}>{item?.description || "-"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t("Amount")}</Text>
                <Text style={styles.value}>
                  {item?.rent_currencys?.symbol}{" "}
                  {parseFloat(item.amount).toFixed(2)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>{t("Paid")}</Text>
                <Text style={styles.value}>
                  {item?.rent_currencys?.symbol}{" "}
                  {parseFloat(item.paid).toFixed(2)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t("Outstanding")}</Text>
                <Text style={styles.value}>
                  {item?.rent_currencys?.symbol}{" "}
                  {parseFloat(item.outstading).toFixed(2)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t("Date")}</Text>
                <Text style={styles.value}>
                  {item.pay_order_start_date || "-"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t("Due Date")}</Text>
                <Text style={styles.value}>
                  {item.pay_order_end_date || "-"}
                </Text>
              </View>
              {item.module_status ? (
                <View style={styles.statusbg}>
                  <View
                    style={[
                      styles.statusbox,
                      {
                        backgroundColor:
                          item?.module_status?.color || Colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.statusname}>
                      {t(item?.module_status?.status_name)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
            {item?.payments && item.payments.length > 0 ? (
              <>
                <Text style={[styles.title, { fontSize: RFValue(14) }]}>
                  {t("Payments")}
                </Text>
                <View style={styles.leaveBox}>
                  <View style={[styles.row, { paddingBottom: 15 }]}>
                    <Text style={[styles.headerLabel, { textAlign: "left" }]}>
                      {t("Date")}
                    </Text>
                    <Text style={[styles.headerLabel, { textAlign: "center" }]}>
                      {t("Discription")}
                    </Text>
                    <Text style={[styles.headerLabel, { textAlign: "right" }]}>
                      {t("Amount")}
                    </Text>
                  </View>

                  {item.payments.map((subItem, index) => (
                    <>
                      <View
                        key={index}
                        style={[
                          styles.row,
                          index === item.payments.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.label,
                            { textAlign: "left", flex: 3, paddingRight: 10 },
                          ]}
                        >
                          {formatDate(subItem.created_at)}
                        </Text>
                        <Text
                          style={[
                            styles.label,
                            { textAlign: "center", flex: 3, paddingRight: 10 },
                          ]}
                        >
                          {subItem.description}
                        </Text>
                        <Text
                          style={[
                            styles.label,
                            { textAlign: "right", flex: 3, paddingRight: 10 },
                          ]}
                        >
                          {item?.rent_currencys?.symbol}{" "}
                          {parseFloat(subItem.amount).toFixed(2)}
                        </Text>
                      </View>
                    </>
                  ))}
                  <Text
                    style={[
                      styles.label,
                      {
                        alignSelf: "flex-end",
                        paddingVertical: 10,
                        fontSize: RFValue(13),
                      },
                    ]}
                  >
                    {t("Total paid")} :{"  "}
                    <Text style={[styles.value, { fontSize: RFValue(13) }]}>
                      {item?.rent_currencys?.symbol}{" "}
                      {parseFloat(item.paid).toFixed(2)}
                    </Text>
                  </Text>
                </View>
              </>
            ) : (
              <Text style={[styles.label, { alignSelf: "center" }]}>
                No Payments available
              </Text>
            )}
          </>
        ) : null}
      </>
    );
  };

  useEffect(() => {
    if (!payorder || !Array.isArray(payorder)) {
      setFilteredTasklist([]);
      return;
    }

    const filterBySearchQuery = (pay) =>
      pay.pay_order_nr?.toLowerCase().includes(searchQuery?.toLowerCase());

    const filterBySelectedStatus = (pay) => {
      if (selectedItems.length === 0) return true; // No filter applied
      return selectedItems.includes(pay.pay_order_nr);
    };

    const filtered = payorder
      .filter(filterBySearchQuery)
      .filter(filterBySelectedStatus);

    setFilteredTasklist(filtered);
  }, [searchQuery, payorder, selectedItems]);

  const handleCheckboxChange = (item) => {
    const newSelectedIds = [...selectedStatusIds];
    if (newSelectedIds.includes(item.id)) {
      // id is already checked so uncheck mate
      console.log("djksuhcukdjs=====", newSelectedIds);
      newSelectedIds.splice(newSelectedIds.indexOf(item.id), 1); // user uncheck the status so remove data using splice
    } else {
      console.log("djksuhcukdjs====0000000=", newSelectedIds);
      newSelectedIds.push(item.id); // else part inside check the id/ status and check after push the item
    }
    setSelectedStatusIds(newSelectedIds); //update the state
  };

  const applyFilters = () => {
    if (!payorder || !Array.isArray(payorder)) {
      // for empty ya invalid data
      setFilteredTasklist([]);
      setFilterModalVisible(false);
      return;
    }

    setFilterModalVisible(false);
    const filtered = payorder.filter((pro) => {
      const filterBySearchQuery = pro.pay_order_nr
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const filterBySelectedStatus =
        selectedStatusIds.length === 0 ||
        selectedStatusIds.includes(pro?.module_status?.id);
      return filterBySearchQuery && filterBySelectedStatus;
    });
    setFilteredTasklist(filtered);
  };

  // const sortByCreatedAt = () => {
  //   console.log("sort data by amount aec/des");
  //   const sortedData = [...payorder].sort((a, b) => {
  //     const aName = a?.amount?.toLowerCase() || "";
  //     const bName = b?.amount?.toLowerCase() || "";

  //     return isDescending
  //       ? bName.localeCompare(aName) // Descending order
  //       : aName.localeCompare(bName); // Ascending order
  //   });

  //   Setpayorder(sortedData);
  //   setIsDescending(!isDescending); // Toggle sort direction
  // };
  const sortByCreatedAt = () => {
    console.log("Attempting to sort data by amount asc/desc");

    // Check if payorder is empty or if all amounts are blank
    if (!payorder || payorder.length === 0) {
      console.log("No data to sort. Sorting not performed.");
      return; // Exit the function early
    }

    const allAmountsAreBlank = payorder.every((item) => !item?.amount);

    if (allAmountsAreBlank) {
      console.log("All amounts are blank. Sorting not performed.");
      return; // Exit the function early
    }

    const sortedData = [...payorder].sort((a, b) => {
      const aName = a?.amount ? String(a.amount).toLowerCase() : "";
      const bName = b?.amount ? String(b.amount).toLowerCase() : "";

      return isDescending
        ? bName.localeCompare(aName) // Descending order
        : aName.localeCompare(bName); // Ascending order
    });

    Setpayorder(sortedData);
    setIsDescending(!isDescending); // Toggle sort direction
  };

  return (
    <>
      <StatusBar backgroundColor={item.color_code} barStyle={"light-content"} />
      <BlueHeader
        bgcolor={item.color_code}
        title={payorderdetails ? "Details" : "Pay Order"}
        Righticon={Images.refresh}
        onPressRight={onRefresh}
        SearchBarInput={!payorderdetails}
        value={searchQuery}
        onChangeText={setSearchQuery}
        arrowOnPress={sortByCreatedAt}
        // arrowOnPress={() => setSortModalVisible(!sortmodalVisible)}
        onPressfilter={() => setFilterModalVisible(true)}
        goback={
          payorderdetails
            ? () => {
                setPayorderDetails(false);
                setPayorderList(true);
              }
            : null
        }
      />
      <View
        style={{
          backgroundColor: Colors.litegray1,
          height: "100%",
          marginTop: heightPercentageToDP(-1),
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          flex: 1,
        }}
      >
        <FlatList
          data={filteredTasklist}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t("No Pay Order Found.")}</Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary, "#F048C6"]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
        <Filtersortmodal
          sortModalVisible={false}
          filterModalVisible={filterModalvisible}
          setFilterModalVisible={setFilterModalVisible}
          handleCheckboxChange={handleCheckboxChange}
          applyFilters={applyFilters}
          statusData={statusdata}
          selectedStatusIds={selectedStatusIds}
        />
        {/* <Footer /> */}
      </View>
    </>
  );
};

export default Payorder;

const styles = StyleSheet.create({
  emptyText: {
    textAlign: "center",
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    marginTop: 20,
  },
  statusbg: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 1,
  },
  statusbox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginTop: 10,
    paddingVertical: 5,
  },
  statusname: {
    color: Colors.white,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  Box: {
    paddingVertical: 10,
    borderWidth: 2,
    marginTop: RFValue(15),
    borderRadius: 10,
    borderColor: Colors.Boxgray,
    paddingHorizontal: RFValue(10),
    marginHorizontal: RFValue(12),
    backgroundColor: Colors.white,
  },
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  standard: {
    fontSize: RFValue(12),
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    marginTop: RFValue(5),
  },
  standard1: {
    fontSize: RFValue(12),
    color: Colors.primaryblue,
    fontFamily: FONTS.LexendMedium,
    marginTop: RFValue(5),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
    borderBottomColor: Colors.litegray,
    borderBottomWidth: 1,
    paddingVertical: 5,
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
  leaveBox: {
    marginHorizontal: 15,
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    backgroundColor: Colors.white,
  },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.litegray,
    paddingBottom: 5,
    marginBottom: 5,
  },
  headerLabel: {
    fontFamily: FONTS.LexendBold,
    fontSize: RFValue(13),
    color: Colors.primaryblue,
    // textAlign: "center",
    flex: 3,
  },
  title: {
    fontSize: RFValue(16),
    fontFamily: FONTS.LexendMedium,
    alignSelf: "center",
    marginVertical: 10,
    color: Colors.black,
    marginHorizontal: 20,
  },
});
