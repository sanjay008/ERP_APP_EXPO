import {
  Alert,
  FlatList,
  Image,
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
import apiConstants from "../api/apiConstants";
import { useFocusEffect } from "@react-navigation/native";
import Header from "../components/header";
import { useTranslation } from "react-i18next";
import { heightPercentageToDP } from "react-native-responsive-screen";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import Filtersortmodal from "../components/Filtersortmodal";
import Modal from "react-native-modal";
import ButtonComponent from "../components/buttonComponent";
import CheckBox from "react-native-check-box";
import Loader from "../components/loading";
import { SafeAreaView } from "react-native-safe-area-context";

const Employee = ({ navigation, route }) => {
  const { bgcolor, type } = route.params;
  const { t } = useTranslation();
  const [originalData, setOriginalData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [isDescending, setIsDescending] = useState(true);
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [filterModalvisible, setFilterModalVisible] = useState(false);
  const [selectedStatusIds, setSelectedStatusIds] = useState([]);
  const [statusdata, setStatusData] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const Employees = async () => {
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

      const data = await ApiService(apiConstants.employee, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          // ...(type === "leaverequest" && { soort_relatie: "kind" }),
        },
      });
      if (data.status) {
        setLoading(false);
        const formattedData = data.data.map((item) => ({
          ...item.contract,
          display_name: item.display_name,
          leave_details: item.leave_details,
          created_at: item.contract.created_at,
          // status_id: item.contract_status,
        }));
        setOriginalData(formattedData);
        setDisplayedData(formattedData);
        // console.log(formattedData, "ajushak========employeeeeeeeee");
      } else {
        setLoading(false);
        console.log("False connections");
      }
    } catch (err) {
      setLoading(false);

      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    Employees();
    StusSearch();
  }, []);

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          if (type == "leaverequest") {
            navigation.navigate("Absencerequest", {
              id: item.id,
              relaties_id: item.relaties_id,
              type: "leaverequest",
              bgcolor: bgcolor,
              employee_name: item.contract_name,
            });
          } else {
            navigation.navigate("Employeedetails", {
              id: item.id,
              color: bgcolor,
            });
          }
        }}
      >
        <View style={styles.Box}>
          <View style={styles.textContainer}>
            <Text style={styles.name}>{item.contract_name || "--"}</Text>
            <Text style={styles.standard}>
              {t("Datum")} :{" "}
              <Text style={styles.standard1}>
                {item.from} {"--"} {item.end} ({item.contract_month})
              </Text>
            </Text>
            <Text style={styles.standard}>
              {t("Function Title")} :{" "}
              <Text style={styles.standard1}>
                {item?.positiondata?.position_title}
              </Text>
            </Text>
            <Text style={styles.standard}>
              {t("Type")} :{" "}
              <Text style={styles.standard1}>
                {" "}
                {item?.contract_template_data?.template_name || "--"}
              </Text>
            </Text>
            <Text style={styles.standard}>
              {t("Contract uren")} :
              <Text style={styles.standard1}>
                {" "}
                {item?.contract_hour_per_week || "--"} {"- min:"}{" "}
                {item?.minimal_hour_per_week || "--"} {"- max:"}
                {item?.maximum_hour_per_week || "--"}
              </Text>
            </Text>
            <Text style={styles.standard}>
              {t("Employer")} :{" "}
              <Text style={styles.standard1}>{item?.display_name || "--"}</Text>
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            {/* --------------- */}
            {item.period_name ? (
              // <View style={styles.statusbg}>
              <View
                style={[
                  styles.statusbox,
                  { backgroundColor: Colors.vibrantblue || Colors.primary },
                ]}
              >
                <Text style={styles.statusname}>{item.period_name}</Text>
              </View>
            ) : // </View>
            null}
            {item.status_name ? (
              // <View style={styles.statusbg}>
              <View
                style={[
                  styles.statusbox,
                  { backgroundColor: item.color || Colors.primary },
                ]}
              >
                <Text style={styles.statusname}>{item.status_name}</Text>
              </View>
            ) : // </View>
            null}
            {/* -------------- */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const StusSearch = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
        customData: {
          slug: "employee_contract",
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data.status) {
        setStatusData(data.data);
        // console.log(data.data, "suv==========");
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const handleCheckboxChange = (item) => {
    const newSelectedIds = [...selectedStatusIds];
    if (newSelectedIds.includes(item.id)) {
      console.log("djksuhcukdjs=====", newSelectedIds);
      newSelectedIds.splice(newSelectedIds.indexOf(item.id), 1);
    } else {
      console.log("djksuhcukdjs====0000000=", newSelectedIds);
      newSelectedIds.push(item.id);
    }
    setSelectedStatusIds(newSelectedIds);
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    const filtered = originalData.filter((pro) => {
      const filterBySearchQuery = pro.contract_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const filterBySelectedStatus =
        selectedStatusIds.length === 0 ||
        selectedStatusIds.includes(Number(pro.contract_status)); // Force contract_status to be a number
      return filterBySearchQuery && filterBySelectedStatus;
    });
    setFilteredTasklist(filtered);
  };

  useEffect(() => {
    const filterBySearchQuery = (pro) =>
      pro.contract_name.toLowerCase().includes(searchQuery.toLowerCase());

    const filterBySelectedStatus = (pro) => {
      if (selectedItems.length === 0) return true;
      return selectedItems.includes(pro?.contract_status);
    };
    const filtered = originalData
      .filter(filterBySearchQuery)
      .filter(filterBySelectedStatus);
    setFilteredTasklist(filtered);
  }, [searchQuery, originalData, selectedItems]);

  const arrowOnPress = (text) => {
    console.log("sorting data ", text);
    const sortedData = [...originalData];

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
    setOriginalData(sortedData);
  };

  const getSortValuename = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.contract_name.toLowerCase();
      case t("desc"):
        return item?.contract_name.toLowerCase();
      default:
        return item?.contract_name.toLowerCase();
    }
  };

  const getSortValuestuts = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.status_name.toLowerCase();
      case t("desc"):
        return item?.status_name.toLowerCase();
      default:
        return item?.status_name.toLowerCase();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Employees();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    // <SafeAreaView style={{ backgroundColor: bgcolor, flex: 1 }}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {/* <View style={styles.iconbg}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.icon]}
        >
          <Image
            source={Images.back}
            style={styles.searchicon}
            tintColor={Colors.white}
          />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.icon]} onPress={sortByCreatedAt}>
          <Image
            source={Images.arrow}
            style={styles.searchicon}
            tintColor={Colors.white}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.header}>{t("Arbeidsovereenkomst")}</Text> */}
      {loading && <Loader color={Colors.primary} />}
      <BlueHeader
        bgcolor={bgcolor}
        title={t("Arbeidsovereenkomst")}
        onPressRight={Employees}
        Righticon={Images.refresh}
        SearchBarInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        arrowOnPress={() => setSortModalVisible(!sortmodalVisible)}
        onPressfilter={() => setFilterModalVisible(true)}
      />
      <View style={styles.background}>
        <FlatList
          data={filteredTasklist}
          renderItem={renderItem}
          keyExtractor={(item) => item?.id?.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Image
                source={Images.noconnection}
                style={styles.fallbackImage}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary, "#F048C6"]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={{
            paddingBottom: 20, // Adds bottom padding to the content
          }}
        />
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
            { id: 1, title: "Name" },
            { id: 2, title: "Status" },
          ]}
        />

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
                    <View style={styles.up}>
                      <Image
                        source={Images.downArrow}
                        style={{ height: 18, width: 18 }}
                      />
                    </View>
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
          </View>
        </Modal> */}
      </View>
      {/* <Footer /> */}
      {/* </SafeAreaView> */}
    </>
  );
};

export default Employee;

const styles = StyleSheet.create({
  header: {
    fontSize: RFValue(19),
    fontFamily: FONTS.LexendMedium,
    color: Colors.white,
    alignSelf: "center",
    marginTop: heightPercentageToDP(3),
  },
  background: {
    backgroundColor: Colors.litegray1,
    height: "100%",
    marginTop: heightPercentageToDP(-1),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flex: 1,
  },
  icon: {
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
  name: {
    fontSize: RFValue(15),
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    marginBottom: 10,
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
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFValue(120),
  },
  fallbackImage: {
    width: RFValue(200),
    height: RFValue(200),
    resizeMode: "contain",
  },
  searchicon: {
    height: RFValue(20),
    width: RFValue(20),
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
  iconbg: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
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
  checkView: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(10),
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
    // height: heightPercentageToDP("90%"),
  },
});
