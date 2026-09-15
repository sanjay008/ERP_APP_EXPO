import {
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
import { SafeAreaView } from "react-native-safe-area-context";
import Filtersortmodal from "../components/Filtersortmodal";
import Loader from "../components/loading";

const Connection = ({ navigation, route }) => {
  const { bgcolor } = route.params;
  const { type } = route.params || {};
  const { t } = useTranslation();
  const [connection, setconnection] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const Connections = async () => {
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
      const data = await ApiService(apiConstants.Connections, {
        includeToken: true,
        customData: {
          id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          ...(type === "child" && { soort_relatie: "kind" }),
        },
      });
      if (data.status) {
        // setLoading(false);
        setconnection(data.data);
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
    Connections();
  }, []);

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          if (type == "child") {
            navigation.navigate("ChildContract", {
              id: item.id,
              bgcolor: bgcolor,
            });
          } else {
            navigation.navigate("Connectiondetails", {
              id: item.id,
              color: bgcolor,
            });
          }
        }}
      >
        <View style={styles.Box}>
          <Image source={{ uri: item.file_path }} style={styles.image} />
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={2}>
              {item.display_name}
            </Text>
            <Text style={styles.standard}>{item.soort_relatie}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    const filterBySearchQuery = (task) =>
      task.display_name.toLowerCase().includes(searchQuery.toLowerCase());

    const filterBySelectedStatus = (task) => {
      if (selectedItems.length === 0) return true;
      return selectedItems.includes(task.soort_relatie);
    };

    const filtered = connection
      .filter(filterBySearchQuery)
      .filter(filterBySelectedStatus);
    setFilteredTasklist(filtered);
  }, [searchQuery, connection, selectedItems]);

  const arrowOnPress = (text) => {
    console.log("sorting data ", text);
    const sortedData = [...connection];

    // Toggle sort order
    const newSortOrder = sortOrder === t("asc") ? t("desc") : t("asc");
    setSortOrder(newSortOrder);

    sortedData.sort((a, b) => {
      // Determine values to compare
      const aValue =
        text === "Name"
          ? getSortValuename(a) || ""
          : text === "Type"
          ? getSortValuetype(a) || ""
          : "";
      const bValue =
        text === "Name"
          ? getSortValuename(b) || ""
          : text === "Type"
          ? getSortValuetype(b) || ""
          : "";
      // Perform string comparison
      if (newSortOrder === t("asc")) {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    // Update data
    setconnection(sortedData);
  };

  const getSortValuename = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.display_name.toLowerCase();
      case t("desc"):
        return item?.display_name.toLowerCase();
      default:
        return item?.display_name.toLowerCase();
    }
  };
  const getSortValuetype = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.soort_relatie.toLowerCase();
      case t("desc"):
        return item?.soort_relatie.toLowerCase();
      default:
        return item?.soort_relatie.toLowerCase();
    }
  };
  const onRefresh = () => {
    setRefreshing(true);
    Connections();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: bgcolor }]}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {loading && <Loader color={Colors.primary} />}
      <BlueHeader
        bgcolor={bgcolor}
        title={type == "child" ? t("Kind") : t("Connections")}
        Righticon={Images.refresh}
        onPressRight={Connections}
        SearchBarInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        sort={Images.arrow}
        onPressfilter={() => setSortModalVisible(!sortmodalVisible)}
      />

      {/* <View style={styles.headerbackground}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backbtn}
        >
          <Image source={Images.back} style={styles.backimage} />
        </TouchableOpacity> 
        <Text style={styles.header}>
          {type == "child" ? t("Kind Overeenkomst") : t("Connections")}
        </Text>
      </View> */}
      <View style={styles.background}>
        <FlatList
          data={filteredTasklist}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
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
      </View>

      <Filtersortmodal
        sortModalVisible={sortmodalVisible}
        setSortModalVisible={setSortModalVisible}
        handleSortPress={arrowOnPress}
        // filterModalVisible={filterModalvisible}
        // setFilterModalVisible={setFilterModalVisible}
        // handleCheckboxChange={handleCheckboxChange}
        // applyFilters={applyFilters}
        // statusData={statusdata}
        // selectedStatusIds={selectedStatusIds}
        // modalheight={"90%"}
        data={[
          { id: "1", title: "Name" },
          { id: "2", title: "Status" },
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
              { id: "2", title: "Type" },
              // { id: "3", title: "Status" },
              // { id: "4", title: "Date" },
            ]}
            ItemSeparatorComponent={() => {
              return <View style={styles.line} />;
            }}
            contentContainerStyle={{ marginHorizontal: 24 }}
            ListHeaderComponent={() => {
              return (
                <Text
                  style={[
                    styles.modalname,
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
                      styles.modalname,
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
      </Modal> */}

      {/* <Footer /> */}
    </>
    // </SafeAreaView>
  );
};

export default Connection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    // backgroundColor: Colors.black,
    backgroundColor: Colors.litegray1,
    // height: "100%",
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
    marginTop: RFValue(15),
    borderRadius: 10,
    borderColor: Colors.litegray,
    paddingLeft: RFValue(10),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  image: {
    height: RFValue(55),
    width: RFValue(55),
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
  line: { height: 1, backgroundColor: Colors.litegray },
});
