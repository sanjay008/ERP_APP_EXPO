import {
  StyleSheet,
  Text,
  View,
  // SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";

import apiConstants from "../api/apiConstants";
import { getData } from "../utils/storeData";
import { useTranslation } from "react-i18next";
import Loader from "../components/loading";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { Images } from "../constants/images";
import Modal from "react-native-modal";
import ButtonComponent from "../components/buttonComponent";
import CheckBox from "react-native-check-box";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import Filtersortmodal from "../components/Filtersortmodal";

const Contract = ({ navigation, route }) => {
  const { bgcolor } = route.params;
  const { t } = useTranslation();
  const [contract, setContract] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [filterModalvisible, setFilterModalVisible] = useState(false);
  const [statusdata, setStatusData] = useState([]);
  const [selectedStatusIds, setSelectedStatusIds] = useState([]);
  const [oldData, setOldData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const StusSearch = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
        customData: {
          slug: "tenant_contract",
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

  const TenantContract = async () => {
    // setLoading(true);
    if (!refreshing) {
      setLoading(false);
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } else {
      setLoading(true);
      setRefreshing(false);
    }
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.tenantcontract, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data.status) {
        setOldData(data.data);
        setContract(data.data);
        console.log("jfdhnvdjkfvjk====", data.data.status);
        setLoading(false);
      } else {
        setOldData([]);
        setLoading(false);
        console.log("false Contract");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    TenantContract();
    StusSearch();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-"; // or any default value you want to return when the dateString is invalid
    }
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const [year, month, day] = dateString.split("-");
    // Check if dateString has a valid format
    if (!year || !month || !day) {
      return "-"; // return empty string or handle as needed if the format is invalid
    }
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  const renderItem = ({ item }) => {
    return (
      <View style={{ marginHorizontal: 20 }}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Contractdetails", {
              id: item.id,
              color: bgcolor,
            })
          }
        >
          <View style={styles.box}>
            <View style={styles.row}>
              <Text style={styles.title}>
                {item?.object_data?.display_name}
              </Text>

              {item.status && (
                <View style={styles.statusbg}>
                  <View
                    style={[
                      styles.statusbox,
                      {
                        backgroundColor: item?.status?.color || Colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.statusname}>
                      {item?.status?.status_name}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <View style={styles.line}></View>
            <View style={styles.row}>
              <Text style={styles.label}>{t("Debiteurennummer")}</Text>
              <Text style={styles.value}>{item.debtor_number}</Text>
            </View>
            <View style={styles.line}></View>
            <View style={styles.row}>
              <Text style={styles.label}>{t("Start Datum")}</Text>
              <Text style={styles.value}>{formatDate(item.from)}</Text>
            </View>

            <View style={styles.line}></View>
            <View style={styles.row}>
              <Text style={styles.label}>{t("End Datum")}</Text>
              <Text style={styles.value}>{formatDate(item.end)}</Text>
              {/* <Text style={styles.value}>{item.end}</Text> */}
            </View>
            <View style={styles.line}></View>
            <View style={styles.row}>
              <Text style={styles.label}>{t("Straat")}</Text>
              <Text style={styles.value}>
                {(item.street !== undefined && item.street !== null
                  ? item.street
                  : item?.object_data?.street || "- ") +
                  " | " +
                  (item.house_nr !== undefined && item.house_nr !== null
                    ? item.house_nr
                    : item?.object_data?.house_nr || "- ")}
              </Text>
            </View>
            <View style={styles.line}></View>
            <View style={styles.row}>
              <Text style={styles.label}>{t("Price")}</Text>
              <Text style={styles.value}>
                {item.currency_data.symbol} {item.rent_price}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    const filterBySearchQuery = (contract) => {
      const displayName = contract?.object_data?.display_name || ""; // Default to empty string if undefined
      return displayName.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const filterBySelectedStatus = (contract) => {
      if (selectedItems.length === 0) return true;
      return selectedItems.includes(contract?.status?.id);
    };
    // Ensure contract is an array before calling filter
    if (Array.isArray(contract)) {
      const filtered = contract
        .filter(filterBySearchQuery)
        .filter(filterBySelectedStatus);
      setFilteredTasklist(filtered);
    } else {
      console.warn("contract is not an array:", contract);
    }
  }, [searchQuery, contract, selectedItems]);

  const applyFilters = () => {
    console.log("apply filterrrrrr====");
    setFilterModalVisible(false);
    const filtered = contract.filter((item) => {
      const displayName = item?.object_data?.display_name || ""; // Handle undefined values
      const filterBySearchQuery = displayName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const filterBySelectedStatus =
        selectedStatusIds.length === 0 ||
        selectedStatusIds.includes(item?.status?.id);
      return filterBySearchQuery && filterBySelectedStatus;
    });
    setFilteredTasklist(filtered);
  };

  const handleCheckboxChange = (item) => {
    console.log("jkfnvhdfjkun========filter ");
    const newSelectedIds = [...selectedStatusIds];
    if (newSelectedIds.includes(item.id)) {
      newSelectedIds.splice(newSelectedIds.indexOf(item.id), 1);
    } else {
      newSelectedIds.push(item.id);
    }
    setSelectedStatusIds(newSelectedIds);
  };

  const arrowOnPress = (text) => {
    console.log("sorting data ", text);
    const sortedData = [...contract];

    // Toggle sort order
    const newSortOrder = sortOrder === t("asc") ? t("desc") : t("asc");
    setSortOrder(newSortOrder);

    sortedData.sort((a, b) => {
      // Determine values to compare
      const aValue =
        text === "Name"
          ? getSortValuename(a) || ""
          : text === "Status"
          ? getSortValuestuts(a) || ""
          : "";
      const bValue =
        text === "Name"
          ? getSortValuename(b) || ""
          : text === "Status"
          ? getSortValuestuts(b) || ""
          : "";
      // Perform string comparison
      if (newSortOrder === t("asc")) {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
    setContract(sortedData);
  };

  const getSortValuename = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.object_data?.display_name.toLowerCase();
      case t("desc"):
        return item?.object_data?.display_name.toLowerCase();
      default:
        return item?.object_data?.display_name.toLowerCase();
    }
  };

  const getSortValuestuts = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.status?.status_name.toLowerCase();
      case t("desc"):
        return item?.status?.status_name.toLowerCase();
      default:
        return item?.status?.status_name.toLowerCase();
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    TenantContract();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: bgcolor }]}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {loading && <Loader color={Colors.primary} />}
      {/* <Header back title={t("Huur Overeenkomst")} /> */}
      <BlueHeader
        bgcolor={bgcolor}
        title={t("Huur Overeenkomst")}
        Righticon={Images.refresh}
        onPressRight={TenantContract}
        SearchBarInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        arrowOnPress={() => setSortModalVisible(!sortmodalVisible)}
        onPressfilter={() => setFilterModalVisible(true)}
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
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary, "#F048C6"]}
              tintColor={Colors.primary}
            />
          }
        >
          <FlatList
            data={filteredTasklist}
            renderItem={renderItem}
            keyExtractor={(item) => item.id?.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: RFValue(20) }}
            ListEmptyComponent={() => {
              return (
                <Text style={styles.emptyText}>No Tenant Contract Found .</Text>
              );
            }}
          />
        </ScrollView>
      </View>

      {/* <Modal
        animationType="slide"
        animationOut={"slideInDown"}
        animationIn={"slideInDown"}
        onSwipeComplete={() => {
          setSortModalVisible(false);
        }}
        onBackdropPress={() => {
          setSortModalVisible(false);
        }}
        onBackButtonPress={() => {
          setSortModalVisible(false);
        }}
        swipeDirection="down"
        style={{
          justifyContent: "flex-end",
          margin: 0,
          backgroundColor: Colors.transparant,
        }}
        visible={sortmodalVisible}
      >
        <View
          style={{
            flex: 1,
            // height: '30%',
            position: "absolute",
            bottom: 0,
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30,
            backgroundColor: Colors.white,
            width: "100%",
            paddingTop: 20,
            paddingBottom: 35,
          }}
        >
          <FlatList
            data={[
              { id: "1", title: "Name" },
              { id: "2", title: "Status" },
            ]}
            ItemSeparatorComponent={() => {
              return <View style={styles.line} />;
            }}
            contentContainerStyle={{ marginHorizontal: 24 }}
            ListHeaderComponent={() => {
              return (
                <Text
                  style={[
                    styles.name,
                    { fontFamily: FONTS.LexendSemiBold, fontSize: 24 },
                  ]}
                >
                  {t("Sort By")}
                </Text>
              );
            }}
            renderItem={({ item, index }) => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    setSortModalVisible(false), arrowOnPress(item.title);
                  }}
                  style={[
                    styles.checkView,
                    { justifyContent: "space-between" },
                  ]}
                >
                  <Text
                    style={[
                      styles.name,
                      { fontFamily: FONTS.LexendRegular, fontSize: 17 },
                    ]}
                  >
                    {"   "}
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.up,
                      {
                        transform: [
                          sortOrder == "asc"
                            ? { rotate: "180deg" }
                            : { rotate: "0deg" },
                        ],
                      },
                    ]}
                    onPress={() => {
                      setSortModalVisible(false), arrowOnPress(item.title);
                    }}
                  >
                    <Image
                      source={Images.downArrow}
                      style={{ height: 18, width: 18 }}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      <Modal
        isVisible={filterModalvisible}
        style={{
          justifyContent: "flex-end",
          margin: 0,
          backgroundColor: Colors.transparant,
        }}
        onBackdropPress={() => {
          setFilterModalVisible(false);
        }}
        onBackButtonPress={() => {
          setFilterModalVisible(false);
        }}
      >
        <View style={[styles.modal]}>
          <FlatList
            data={statusdata}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => {
              return <View style={styles.line} />;
            }}
            ListHeaderComponent={() => {
              return <Text style={styles.filtertext}>{t("Filter")}</Text>;
            }}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  style={styles.checkView}
                  onPress={() => handleCheckboxChange(item)}
                  activeOpacity={0.5}
                >
                  <CheckBox
                    onClick={() => handleCheckboxChange(item)}
                    isChecked={selectedStatusIds.includes(item.id)}
                    checkBoxColor={Colors.litegray}
                    checkedCheckBoxColor={Colors.primary}
                  />
                  <Text
                    style={{
                      fontFamily: FONTS.LexendRegular,
                      color: Colors.black,
                    }}
                  >
                    {"   "}
                    {item.status_name}
                  </Text>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id.toString()}
          />
          <ButtonComponent
            title={"Apply Filter"}
            onPress={() => applyFilters()}
            marginTop={"5%"}
          />
          {/* <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginHorizontal: 24,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setSelectedStatusIds([]);
                setSelectedItems([]);
                searchStatus([]);
              }}
              style={styles.btn}
            >
              <Text style={[styles.name, { color: Colors.white }]}>
                {t("Herstellen")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                searchStatus(selectedItems);
                setFilterModalVisible(false);
                // applyFilters();
              }}
              style={styles.btn}
            >
              <Text style={[styles.name, { color: Colors.white }]}>
                {t("Zoeken")}
              </Text>
            </TouchableOpacity>
          </View> */}
      {/* </View>
      </Modal> */}

      <Filtersortmodal
        sortModalVisible={sortmodalVisible}
        setSortModalVisible={setSortModalVisible}
        handleSortPress={arrowOnPress}
        filterModalVisible={filterModalvisible}
        setFilterModalVisible={setFilterModalVisible}
        handleCheckboxChange={handleCheckboxChange}
        applyFilters={applyFilters}
        statusData={statusdata}
        selectedStatusIds={selectedStatusIds}
        modalheight={"90%"}
        data={[
          { id: "1", title: "Name" },
          { id: "2", title: "Status" },
        ]}
      />

      {/* <Footer /> */}
    </>
    // {/* </SafeAreaView> */}
  );
};

export default Contract;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  box: {
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    backgroundColor: Colors.white,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    color: Colors.textgray,
  },
  value: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(12),
    color: Colors.black,
    textAlign: "right",
    flexWrap: "wrap",
    width: "55%",
  },
  line: {
    height: 1,
    backgroundColor: Colors.litegray,
    marginVertical: 5,
  },
  title: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(14),
    color: Colors.black,
    flex: 6,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    marginTop: 20,
  },
  statusbg: {
    flexDirection: "row",
    flex: 4,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  statusbox: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
  },
  statusname: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.white,
  },
  checkView: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(12),
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
  name: { color: Colors.black, fontFamily: FONTS.LexendMedium, fontSize: 15 },
  modal: {
    flex: 1,
    position: "absolute",
    bottom: 0,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    backgroundColor: Colors.white,
    width: "100%",
    paddingTop: 20,
    paddingBottom: 35,
    paddingHorizontal: 20,
    height: heightPercentageToDP("90%"),
  },
  btn: {
    height: RFValue(41),
    backgroundColor: Colors.primary,
    width: "45%",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
    marginTop: 15,
  },
  filtertext: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 24,
    paddingVertical: 10,
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
  },
});
