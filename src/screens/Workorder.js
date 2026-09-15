import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
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
import Header from "../components/header";
import { Colors } from "../constants/color";
import SearchBar from "../components/searchBar";
import { Images } from "../constants/images";
import { FONTS } from "../constants/fontFamily";
import Modal from "react-native-modal";
import CheckBox from "react-native-check-box";
import { RFValue } from "react-native-responsive-fontsize";
import apiConstants from "../api/apiConstants";
import { getData, storeData } from "../utils/storeData";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import { useFocusEffect } from "@react-navigation/native";
import SelectDropdown from "react-native-select-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";

const Workorder = ({ navigation, route }) => {
  const { bgcolor } = route.params;
  const { t } = useTranslation();
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [search, setSearch] = useState("");
  const [oldData, setOldData] = useState([]);
  const [StutsData, setStutsData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchStatuss, setSearchStatuss] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [data, setData] = useState([]);
  const [logo, setLogo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    WorkorderUserList(searchStatuss);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    Companylogo();
    StusSearch();
    WorkorderUserList(searchStatuss);
  }, []);
  const Companylogo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setLogo(companylogo);
  };
  // useFocusEffect(
  //   useCallback(() => {
  //     StatusBar.setBackgroundColor(Colors.white);
  //     StatusBar.setBarStyle("dark-content");
  //   }, [])
  // );

  useEffect(() => {
    const defaultSelectedItems = StutsData.filter(
      (item) =>
        item?.workorder_status?.status_name !== t("Approved & Start") &&
        item?.workorder_status?.status_name !== t("Invoiced")
    );
    setSelectedItems(defaultSelectedItems);
  }, [StutsData]);

  const RenderItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Details", { id: item.id, color: bgcolor })
        }
        style={styles.container}
      >
        <Image
          source={{
            uri: item?.relaties_customer?.relaties_profile_img,
          }}
          style={styles.pimage}
        />
        <View style={styles.nameview}>
          <Text style={[styles.name, { width: widthPercentageToDP("32%") }]}>
            {item?.relaties_customer?.display_name || "--"}
          </Text>
          <Text numberOfLines={1} style={styles.username}>
            {item.gmaps_working_address == null ||
              item.gmaps_working_address == ""
              ? "--"
              : item.gmaps_working_address}{" "}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "92%",
            }}
          >
            <Text
              style={{
                color: Colors.primary,
                fontFamily: FONTS.LexendMedium,
                fontSize: 14,
              }}
            >
              {item.order_id}
            </Text>
            <Text
              style={{
                color: Colors.textgray,
                fontFamily: FONTS.LexendMedium,
                fontSize: 14,
              }}
            >
              {item.execution_date}
            </Text>
          </View>
        </View>
        <View style={styles.aview}>
          <View
            style={[
              styles.aprooveView,
              {
                backgroundColor: item?.workorder_status?.color,
              },
            ]}
          >
            <Text style={styles.aprrove}>
              {item?.workorder_status?.status_name}
            </Text>
          </View>
          <Text style={styles.date}>{item.date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const Edit = () => { };
  // const StusSearch = async () => {
  //   const requestData = new FormData();
  //   const verify_token = await getData("USERDATA");
  //   requestData.append("token", verify_token.data.user.verify_token);
  //   requestData.append("slug", "task_n_order");
  //   const companylogo = await getData("COMPANYLOGO");
  //   setLogo(companylogo);
  //   axios({
  //     method: "POST",
  //     url: apiConstants.getstatus,
  //     data: requestData,
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //   })
  //     .then((res) => {
  //       if (res.data.status) {
  //         setStutsData(res.data.data);
  //         storeData("STATUSDATA", res.data.data);
  //       } else {
  //         Edit();
  //         console.log("false fhnftjnfyjfyrhj");
  //       }
  //     })
  //     .catch((err) => console.log(err));
  // };

  // const WorkorderUserList = async (workorder_status = []) => {
  //   const requestData = new FormData();

  //   const user = await getData("USERDATA");
  //   requestData.append("token", user.data.user.verify_token);
  //   requestData.append("role", user.data.user.role);
  //   requestData.append("relaties_id", user.data.relaties.id);
  //   console.log("Workorderuitvoer details ====", requestData);

  //   if (workorder_status.length > 0) {
  //     workorder_status.forEach((item) => {
  //       requestData.append("status_id[]", item);
  //       console.log("+++", item);
  //     });
  //   }
  //   axios({
  //     method: "POST",
  //     url: apiConstants.Workorderuitvoer,
  //     data: requestData,
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //   })
  //     .then((res) => {
  //       if (res.data.status) {
  //         setOldData(res.data.data);
  //         setData(res.data.data);
  //         setErrorMessage("");
  //       } else {
  //         console.log("falseszcsds", requestData);
  //         setOldData([]);
  //         setData([]);
  //       }
  //     })
  //     .catch((err) => console.log(err));
  // };

  const StusSearch = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
        customData: {
          slug: "task_n_order",
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      // console.log(data, "suv==========");
      if (data.status) {
        setStutsData(data.data);
        storeData("STATUSDATA", data.data);
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };
  const WorkorderUserList = async () => {
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
      const data = await ApiService(apiConstants.Workorderuitvoer, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data.status) {
        setOldData(data.data);
        setData(data.data);
        setErrorMessage("");
      } else {
        console.log("Failed to fetch connections.");
        setOldData([]);
        setData([]);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const searchFilterFunction = (text) => {
    console.log("search item!!", text);
    if (text !== "") {
      let tempData = data.filter((item) => {
        return (
          item?.relaties_customer?.display_name
            .toLowerCase()
            .includes(text.toLowerCase()) ||
          item?.workorder_status?.status_name
            .toLowerCase()
            .includes(text.toLowerCase()) ||
          item.order_id?.toLowerCase()?.includes(text.toLowerCase()) ||
          item.execution_date?.toLowerCase()?.includes(text.toLowerCase())
        );
      });
      setData(tempData);
      if (tempData.length === 0) {
        // setErrorMessage("NO ORDERS");
      } else {
        setErrorMessage("");
      }
    } else {
      setData(oldData);
      setErrorMessage("");
    }
  };

  const searchStatus = (statusArray) => {
    if (statusArray.length > 0) {
      const filteredData = oldData.filter((item) =>
        statusArray.includes(item?.workorder_status?.id)
      );
      setData(filteredData);
    } else {
      setData(oldData);
    }
  };

  const handleCheckboxChange = (item) => {
    const newSelectedItems = [...selectedItems];
    if (newSelectedItems.includes(item.id)) {
      newSelectedItems.splice(newSelectedItems.indexOf(item.id), 1);
    } else {
      newSelectedItems.push(item.id);
    }
    setSelectedItems(newSelectedItems);
  };

  // const arrowOnPress = (text) => {
  //   console.log("sorting data ", text);
  //   const sortedData = [...data];

  //   const newSortOrder = sortOrder === t("asc") ? t("desc") : t("asc");
  //   setSortOrder(newSortOrder);

  //   sortedData.sort((a, b) => {
  //     const aValue =
  //       text == "Name"
  //         ? getSortValuename(a)
  //         : text == "Status"
  //         ? getSortValuestuts(a)
  //         : text == "Id"
  //         ? getSortValueid(a)
  //         : text == "Date"
  //         ? getSortValuedate(a)
  //         : "";
  //     const bValue =
  //       text == "Name"
  //         ? getSortValuename(b)
  //         : text == "Status"
  //         ? getSortValuestuts(b)
  //         : text == "Id"
  //         ? getSortValueid(b)
  //         : text == "Date"
  //         ? getSortValuedate(b)
  //         : "";

  //     if (sortOrder === "asc") {
  //       return aValue.localeCompare(bValue);
  //     } else {
  //       return bValue.localeCompare(aValue);
  //     }
  //   });

  //   setData(sortedData);
  // };

  const arrowOnPress = (text) => {
    console.log("sorting data ", text);
    const sortedData = [...data];

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
            : text === "Id"
              ? getSortValueid(a) || ""
              : text === "Date"
                ? getSortValuedate(a) || ""
                : "";
      const bValue =
        text === "Name"
          ? getSortValuename(b) || ""
          : text === "Status"
            ? getSortValuestuts(b) || ""
            : text === "Id"
              ? getSortValueid(b) || ""
              : text === "Date"
                ? getSortValuedate(b) || ""
                : "";

      // Perform string comparison
      if (newSortOrder === t("asc")) {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    // Update data
    setData(sortedData);
  };

  const getSortValuename = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.relaties_customer?.display_name.toLowerCase();
      case t("desc"):
        return item?.relaties_customer?.display_name.toLowerCase();
      default:
        return item?.relaties_customer?.display_name.toLowerCase();
    }
  };
  const getSortValuestuts = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.workorder_status?.status_name.toLowerCase();
      case t("desc"):
        return item?.workorder_status?.status_name.toLowerCase();
      default:
        return item?.workorder_status?.status_name.toLowerCase();
    }
  };
  const getSortValueid = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item.order_id.toLowerCase();
      case t("desc"):
        return item.order_id.toLowerCase();
      default:
        return item.order_id.toLowerCase();
    }
  };
  const getSortValuedate = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item.execution_date.toLowerCase();
      case t("desc"):
        return item.execution_date.toLowerCase();
      default:
        return item.execution_date.toLowerCase();
    }
  };

  return (
    // <SafeAreaView style={[styles.safe, { backgroundColor: bgcolor }]}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {/* <Header
        source={{ uri: logo }}
        rightIcon={Images.refresh}
        rightIconClick={onRefresh}
        back
      />
      <SearchBar
        arrowOnPress={() => setSortModalVisible(!sortmodalVisible)}
        // arrowOnPress={arrowOnPress}
        value={search}
        onChangeText={(txt) => {
          setSearch(txt), searchFilterFunction(txt);
        }}
        onPress={() => setModalVisible(true)}
      /> */}
      <BlueHeader
        bgcolor={bgcolor}
        title={t("Work Orders")}
        onPressfilter={() => setModalVisible(true)}
        SearchBarInput
        value={search}
        onChangeText={(txt) => {
          setSearch(txt), searchFilterFunction(txt);
        }}
        onPressRight={onRefresh}
        Righticon={Images.refresh}
        arrowOnPress={() => setSortModalVisible(!sortmodalVisible)}
      />

      {errorMessage ? (
        <View
          style={{
            alignSelf: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: Colors.black,
              fontFamily: FONTS.LexendRegular,
              marginTop: 20,
            }}
          >
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <Modal
        animationType="slide"
        animationOut={"slideInDown"}
        animationIn={"slideInDown"}
        onSwipeComplete={() => {
          setModalVisible(false);
        }}
        onBackdropPress={() => {
          setModalVisible(false);
        }}
        onBackButtonPress={() => {
          setModalVisible(false);
        }}
        style={{
          justifyContent: "flex-end",
          margin: 0,
          backgroundColor: Colors.transparant,
        }}
        visible={modalVisible}
      >
        <View
          style={{
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
          }}
        >
          <FlatList
            data={StutsData}
            ItemSeparatorComponent={() => {
              return <View style={styles.line} />;
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ marginHorizontal: 24 }}
            ListHeaderComponent={() => {
              return (
                <Text
                  style={[
                    styles.name,
                    { fontFamily: FONTS.LexendSemiBold, fontSize: 24 },
                  ]}
                >
                  {t("Filter")}
                </Text>
              );
            }}
            renderItem={({ item, index }) => {
              return (
                // <View style={styles.checkView}>
                //   <CheckBox
                //     style={styles.checkbox}
                //     onClick={() => handleCheckboxChange(item)}
                //     isChecked={selectedItems.includes(item.id)}
                //     checkBoxColor={Colors.litegray}
                //     checkedCheckBoxColor={Colors.primary}
                //   />
                //   <Text
                //     style={[styles.name, { fontFamily: FONTS.LexendRegular }]}
                //   >
                //     {"   "}
                //     {item.status_name}
                //   </Text>
                // </View>
                <TouchableOpacity
                  style={styles.checkView}
                  onPress={() => handleCheckboxChange(item)}
                  activeOpacity={0.5}
                >
                  <CheckBox
                    onClick={() => handleCheckboxChange(item)}
                    isChecked={selectedItems.includes(item.id)}
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
          />
          <View
            style={
              {
                // flexDirection: "row",
                // justifyContent: "space-between",
                // marginHorizontal: 24,
              }
            }
          >
            {/* <TouchableOpacity
              onPress={() => {
                setSelectedItems([]);
                searchStatus([]);
              }}
              style={styles.btn}
            >
              <Text style={[styles.name, { color: Colors.white }]}>
                {t("Herstellen")}
              </Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              onPress={() => {
                searchStatus(selectedItems);
                setModalVisible(false);
              }}
              style={styles.btn}
            >
              <Text style={[styles.name, { color: Colors.white }]}>
                {t("Zoeken")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
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
              { id: "1", title: "Id" },
              { id: "2", title: "Name" },
              { id: "3", title: "Status" },
              { id: "4", title: "Date" },
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

      <View
        style={{
          backgroundColor: Colors.litegray1,
          height: "100%",
          marginTop: heightPercentageToDP(-1),
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          paddingTop: 20,
          flex: 1,
        }}
      >
        <FlatList
          showsVerticalScrollIndicator={false}
          data={data}
          renderItem={RenderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          // ItemSeparatorComponent={() => <View style={styles.line} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t("No Work Order Found.")}</Text>
          }
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
    </>
    // {/* </SafeAreaView> */}
  );
};

export default Workorder;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 5 },
  container: {
    marginHorizontal: 20,
    flexDirection: "row",
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  pimage: { height: 50, width: 50, borderRadius: 7 },
  nameview: { justifyContent: "space-evenly", paddingLeft: 10 },
  name: { color: Colors.black, fontFamily: FONTS.LexendMedium, fontSize: 15 },
  username: {
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    width: widthPercentageToDP("32%"),
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    marginTop: 20,
  },
  aview: {
    position: "absolute",
    right: 10,
    top: 10,
    justifyContent: "space-evenly",
    height: "100%",
  },
  aprooveView: {
    padding: 5,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 6,
  },
  aprrove: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
  },

  date: {
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  checkView: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(12),
  },
  btn: {
    height: RFValue(41),
    backgroundColor: Colors.primary,
    // width: "45%",
    paddingHorizontal: 20,
    // alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
    marginTop: 15,
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalOptionsContainer: {
    position: "absolute",
    top: 50,
    right: 4,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "space-around",
    elevation: 5,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  option: {
    padding: 10,
    color: Colors.black,
  },
  logout: {
    color: Colors.black,
    fontSize: 16,
    alignSelf: "center",
    fontFamily: FONTS.LexendRegular,
    marginTop: 15,
    alignSelf: "flex-start",
    paddingHorizontal: 25,
  },
  bottmModal: {
    flexDirection: "row",
    marginTop: 34,
    justifyContent: "space-evenly",
    marginHorizontal: 24,
  },
  no: {
    color: Colors.black,
    fontSize: 18,
    fontFamily: FONTS.LexendRegular,
    paddingHorizontal: 20,
  },
  mdlbutton: {
    height: 45,
    backgroundColor: Colors.litegray,
    justifyContent: "center",
    marginBottom: 32,
    borderRadius: 4,
  },
  mview: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
    backgroundColor: Colors.transparant,
  },
  mcontainer: {
    flex: 1,
    position: "absolute",
    borderRadius: 10,
    backgroundColor: Colors.white,
    width: "100%",
  },
  icons: {
    height: 110,
    width: 110,
    borderWidth: 2,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 15,
    borderColor: Colors.primary,
  },
});