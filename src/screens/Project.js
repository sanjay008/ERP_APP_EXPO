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
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import { Images } from "../constants/images";
import { getData } from "../utils/storeData";
import ApiService from "../utils/Apiservice";
import apiConstants from "../api/apiConstants";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import { Colors } from "../constants/color";
import Loader from "../components/loading";
import BlueHeader from "../components/BlueHeader";
import { t } from "i18next";
import { heightPercentageToDP } from "react-native-responsive-screen";
import Footer from "../components/Footer";
import Modal from "react-native-modal";
import ButtonComponent from "../components/buttonComponent";
import CheckBox from "react-native-check-box";
import { SafeAreaView } from "react-native-safe-area-context";
import Filtersortmodal from "../components/Filtersortmodal";
import { useTranslation } from "react-i18next";

const Project = ({ navigation, route }) => {
    const { t } = useTranslation();
  const { bgcolor } = route.params;
  const [project, setProject] = useState([]);
  const [Loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [filterModalvisible, setFilterModalVisible] = useState(false);
  const [statusdata, setStatusData] = useState([]);
  const [selectedStatusIds, setSelectedStatusIds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const StusSearch = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
        customData: {
          slug: "project",
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
    getprojectsData();
    StusSearch();
  }, []);

  // const getprojectsData = async () => {
  //   setLoding(true);
  //   try {
  //     const getdata = await getData("USERDATA");
  //     const data = await ApiService(apiConstants.getprojects, {
  //       includeToken: true,
  //       customData: {
  //         relaties_id: getdata.data.relaties.id,
  //       },
  //     });
  //     if (data.status) {
  //       setLoding(false);
  //       setProject(data.data);
  //       console.log("=-=--=1111", data.data);
  //     } else {
  //       setLoding(false);
  //     }
  //   } catch (err) {
  //     setLoding(false);
  //     console.log("Error fetching connections employee data :", err);
  //   }
  // };

  const getprojectsData = async () => {
    // setLoding(true);
    if (!refreshing) {
      // setLoading(false);
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } else {
      // setLoading(true);
      setRefreshing(false);
    }
    setRefreshing(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getprojects, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
        },
      });
      console.log('getdata.data.relaties.id',getdata.data.relaties.id);
      
      if (data.status) {
        setProject(Array.isArray(data.data) ? data.data : []); // Ensure it's an array
      } else {
        setProject([]); // Fallback to an empty array
      }
    } catch (err) {
      setProject([]); // Handle error by setting an empty array
      console.log("Error fetching connections employee data :", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    getprojectsData();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const formatDate = (dateString) => {
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
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  const renderItem1 = ({ item }) => {
    return (
      <View
        style={{
          backgroundColor: Colors.white,
          borderRadius: 10,
          marginVertical: 5,
          paddingHorizontal: 10,
        }}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ProjectDetails", {
              item: item,
              color: bgcolor,
              id:item.id
            })
          }
          style={styles.row1}
        >
          <Image
            source={{
              uri: item.project_image ? item.project_image : Images.userblanck,
              // uri: `https://app.erpportaal.nl/public/media/project_images/${item.project_image}`,
            }}
            style={{
              height: 70,
              width: 70,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: Colors.litegray,
            }}
            defaultSource={Images.userblanck}
          />
          <Text style={[styles.cell, { textAlign: "left",   marginLeft:10 }]}>
            {item.project_name}
          </Text>
          {/* <Text style={styles.cell}>{formatDate(item.deadline)}</Text> */}
          <View
            style={[
              // styles.cell,
              styles.box1,
              {
                backgroundColor:item.project_status_data_api.color || Colors.primary,
      
                
              },
            ]}
          >
            <Text
              style={{
                color: Colors.white,
                fontSize: 12,
                fontFamily: FONTS.LexendRegular,
             
              }}
            >
              {item.project_status_data_api.status_name
                ? item.project_status_data_api.status_name
                : "--"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handleCheckboxChange = (item) => {
    const newSelectedIds = [...selectedStatusIds];
    if (newSelectedIds.includes(item.id)) {
      newSelectedIds.splice(newSelectedIds.indexOf(item.id), 1);
    } else {
      newSelectedIds.push(item.id);
    }
    setSelectedStatusIds(newSelectedIds);
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    const filtered = project.filter((pro) => {
      const filterBySearchQuery = pro.project_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      console.log(
        "dfjvkdfvidfjdfikcheck darta===1111111=",
        filterBySearchQuery
      );
      const filterBySelectedStatus =
        selectedStatusIds.length === 0 ||
        selectedStatusIds.includes(pro?.project_status_data_api?.id);
      console.log(
        "dfjvkdfvidfjdfikcheck darta===222222=",
        filterBySelectedStatus
      );
      return filterBySearchQuery && filterBySelectedStatus;
    });
    setFilteredTasklist(filtered);
  };

  useEffect(() => {
    const filterBySearchQuery = (pro) =>
      pro.project_name.toLowerCase().includes(searchQuery.toLowerCase());

    const filterBySelectedStatus = (pro) => {
      if (selectedItems.length === 0) return true;
      return selectedItems.includes(pro?.project_status_data_api?.id);
    };
    const filtered = project
      .filter(filterBySearchQuery)
      .filter(filterBySelectedStatus);
    setFilteredTasklist(filtered);
  }, [searchQuery, project, selectedItems]);

  const arrowOnPress = (text) => {
    console.log("sorting data ", text);
    const sortedData = [...project];

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
    setProject(sortedData);
  };

  const getSortValuename = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.project_name.toLowerCase();
      case t("desc"):
        return item?.project_name.toLowerCase();
      default:
        return item?.project_name.toLowerCase();
    }
  };

  const getSortValuestuts = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.project_status_data_api?.status_name.toLowerCase();
      case t("desc"):
        return item?.project_status_data_api?.status_name.toLowerCase();
      default:
        return item?.project_status_data_api?.status_name.toLowerCase();
    }
  };

  return (
    // <SafeAreaView style={{ flex: 1, backgroundColor: bgcolor }}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {/* <Header
        lefticon={Images.back}
        lefticonclick={() => navigation.goBack()}
        title={"projecten"}
      /> */}
      <BlueHeader
        bgcolor={bgcolor}
        title={t("Project")}
        Righticon={Images.refresh}
        onPressRight={getprojectsData}
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
        {Loading && <Loader />}
        <FlatList
          // bounces={false}
          data={filteredTasklist}
          renderItem={renderItem1}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() =>
            // <Text>jsfrhnvfikuhnvf</Text>
            project && project.length > 0 ? (
              <View style={styles.header}>
                {/* <Text style={styles.headerCell}>Project Image</Text> */}
                <Text style={styles.headerCell}>{t("Project Naam")}</Text>
                {/* <Text style={[styles.headerCell, { left: 30 }]}>Date</Text> */}
                <Text style={[styles.headerCell, { textAlign: "right" }]}>
                  {t("Status")}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyListContainer}>
              <Text
                style={{
                  alignSelf: "center",
                  marginTop: 15,
                  fontFamily: FONTS.LexendRegular,
                  color: Colors.black,
                }}
              >
                {t("No Data")}
              </Text>
            </View>
          )}
          contentContainerStyle={{
            marginHorizontal: 10,
            padding: 5,
            marginTop: 20,
            paddingBottom: 20,
            // backgroundColor: Colors.white,
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
        data={[
          { id: "1", title: "Name" },
          { id: "2", title: "Status" },
        ]}
      />

      {/* <Footer /> */}
    </>
  );
};

export default Project;

const styles = StyleSheet.create({
  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 5 },
  renderdetails: { flexDirection: "row", alignItems: "center" },
  daydetails: {
    fontSize: RFValue(14),
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
  },
  data: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  date: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    backgroundColor: Colors.lightprimary,
    borderRadius: 5,
    marginBottom: 10,
  },
  headerCell: {
    flex: 1,
    marginHorizontal: 20,
    // alignSelf: "center",
    // textAlign: "center",
    fontFamily: FONTS.LexendMedium,
    // textAlign: 'center',
    fontSize: 13,
    color: Colors.black,
  },
  row1: {
    flexDirection: "row",
    // borderBottomWidth: 1,
    // borderBottomColor: "#ccc",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cell: {
    flex: 3,
    alignSelf: "center",
    fontSize: 12,
    textAlign: "center",
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    // width: "20%",
  },
  box1: {
    // borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
    flex: 2,
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
  filtertext: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 24,
    paddingVertical: 10,
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
  },
});
