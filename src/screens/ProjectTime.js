import {
  FlatList,
  // SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Colors } from "../constants/color";
import Header from "../components/header";
import { t } from "i18next";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import ApiService from "../utils/Apiservice";
import { Images } from "../constants/images";
import SelectDropdown from "react-native-select-dropdown";
import Loader from "../components/loading";
import BlueHeader from "../components/BlueHeader";
import { heightPercentageToDP } from "react-native-responsive-screen";
import Footer from "../components/Footer";
import Filtersortmodal from "../components/Filtersortmodal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

const ProjectTime = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { bgcolor } = route.params;
  const [expandedItemId2, setExpandedItemId2] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectstimee, setProjectstimee] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [Loding, setLoding] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [filterModalvisible, setFilterModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusdata, setStatusData] = useState([]);
  const [selectedStatusIds, setSelectedStatusIds] = useState([]);
  const [isDescending, setIsDescending] = useState(true);

  // console.log("=-=-00909090909090", projectstimee);
  const toggleItem = (itemId) => {
    setExpandedItemId2((prevId) => (prevId === itemId ? null : itemId));
  };
  const formatTime = (time) => {
    if (!time) return ""; // Handle null or undefined time
    return time.length > 5 ? time.slice(0, 5) : time; // If 'HH:mm:ss', extract 'HH:mm'; else, return as is
  };

  const getprojectsData = async () => {
    setLoding(true);
    console.log("=-=--=");
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getprojects, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data.status) {
        setLoding(false);
        setProjects(data.data);
      } else {
        setLoding(false);
      }
    } catch (err) {
      setLoding(false);
      console.log("Error fetching connections employee data :", err);
    }
  };

  // const handleSelectItem = (selectedItem, index) => {
  //   console.log("=-=-");
  //   setSelectedItem(selectedItem);
  //   GetProjectTimeData(selectedItem);
  // };

  // const GetProjectTimeData = async (selectedItem) => {
  //   setLoding(true);
  //   try {
  //     const getdata = await getData("USERDATA");
  //     const data = await ApiService(apiConstants.projecttimeregistration, {
  //       includeToken: true,
  //       customData: {
  //         relaties_id: getdata.data.relaties.id,
  //         project_id: selectedItem && selectedItem.id,
  //       },
  //     });

  //     if (data.status) {
  //       setLoding(false);
  //       setProjectstimee(data.data);
  //     } else {
  //       setLoding(false);
  //       console.log("False");
  //     }
  //   } catch (err) {
  //     console.log("Error fetching connections:", err);
  //   }
  // };

  useEffect(() => {
    console.log("=-=--=1111");
    getprojectsData();
  }, []);

  const renderItem1 = ({ item }) => {
    const formattedTime = `${formatTime(item.original_start_time)}-${formatTime(
      item.original_end_time
    )}`;
    const Breakk = formatTime(item.break_time ? item.break_time : "--");
    return (
      <>
        <View style={styles.row1}>
          <Text style={styles.cell}>{item.current_date || "--"}</Text>
          <Text style={styles.cell}>{formattedTime}</Text>
          <Text style={styles.cell}>{Breakk}</Text>
          <View
            style={[
              styles.cell,
              styles.box1,
              {
                backgroundColor:
                  item.approved_disapproved == 1
                    ? "#E0FCE0"
                    : item.approved_disapproved == 2
                    ? "#F8EBEB"
                    : Colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.cell,
                {
                  color:
                    item.approved_disapproved == 1
                      ? "#30e930"
                      : item.approved_disapproved == 2
                      ? "#e3afaf"
                      : Colors.black,
                },
              ]}
            >
              {item.total_time ? item.total_time : "--"}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const renderItemForProject = ({ item }) => {
    return (
      <>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ProjectTimeDetails", {
              item: item,
              color: bgcolor,
            })
          }
          style={{
            borderWidth: 1,
            borderColor: Colors.litegray,
            marginTop: 10,
            marginHorizontal: 20,
            padding: 8,
            borderRadius: 7,
            flexDirection: "row",
            paddingLeft: 10,
            backgroundColor: Colors.white,
          }}
        >
          <Image
            source={{
              // uri: `https://app.erpportaal.nl/public/media/project_images/${item.project_image}`,
              uri: item.project_image,
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
          <View
            style={{
              paddingLeft: 10,
              justifyContent: "space-around",
              width: "80%",
            }}
          >
            <Text style={[styles.day, { fontFamily: FONTS.LexendMedium }]}>
              {item.project_name}
            </Text>
            <Text style={[styles.day, { width: "95%", fontSize: 12 }]}>
              {item?.relaties_owners.map((owner, index) => (
                <Text key={index}>
                  {owner.display_name}
                  {index < item.relaties_owners.length - 1 && ", "}
                </Text>
              ))}
            </Text>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  useEffect(() => {
    const filterBySearchQuery = (pro) =>
      pro.project_name.toLowerCase().includes(searchQuery.toLowerCase());

    const filterBySelectedStatus = (pro) => {
      if (selectedItems.length === 0) return true;
      return selectedItems.includes(pro?.contract_status);
    };
    const filtered = projects
      .filter(filterBySearchQuery)
      .filter(filterBySelectedStatus);
    setFilteredTasklist(filtered);
  }, [searchQuery, projects, selectedItems]);

  // const arrowOnPress = (text) => {
  //   console.log("sorting data ", text);
  //   const sortedData = [...projects];

  //   const newSortOrder = sortOrder === t("asc") ? t("desc") : t("asc");
  //   setSortOrder(newSortOrder);
  //   sortedData.sort((a, b) => {
  //     const aValue = text === "Name" ? getSortValuename(a) || "" : "";
  //     const bValue = text === "Name" ? getSortValuename(b) || "" : "";

  //     if (newSortOrder === t("asc")) {
  //       return aValue.localeCompare(bValue);
  //     } else {
  //       return bValue.localeCompare(aValue);
  //     }
  //   });
  //   setProjects(sortedData);
  // };

  // const getSortValuename = (item) => {
  //   // Determine the value to sort based on the current sorting order
  //   switch (sortOrder) {
  //     case t("asc"):
  //       return item?.project_name.toLowerCase();
  //     case t("desc"):
  //       return item?.project_name.toLowerCase();
  //     default:
  //       return item?.project_name.toLowerCase();
  //   }
  // };

  const sortByCreatedAt = () => {
    const sortedData = [...projects].sort((a, b) => {
      // Use localeCompare for string comparison
      return isDescending
        ? b.project_name
            .toLowerCase()
            .localeCompare(a.project_name.toLowerCase()) // Descending order
        : a.project_name
            .toLowerCase()
            .localeCompare(b.project_name.toLowerCase()); // Ascending order
    });

    setProjects(sortedData);
    setIsDescending(!isDescending); // Toggle sort direction
  };

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: bgcolor }]}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {/* <Header title={t("Project Time")} back /> */}
      <BlueHeader
        bgcolor={bgcolor}
        title={t("Project Time")}
        Righticon={Images.refresh}
        onPressRight={getprojectsData}
        SearchBarInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        sort={Images.arrow}
        onPressfilter={sortByCreatedAt}
      />
      <View
        style={{
          backgroundColor: Colors.litegray1,
          height: "100%",
          marginTop: heightPercentageToDP(-1),
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          flex: 1,
          paddingTop: 10,
        }}
      >
        {Loding && <Loader />}
        <FlatList
          bounces={false}
          data={filteredTasklist}
          renderItem={renderItemForProject}
          ListEmptyComponent={() => (
            <View style={styles.emptyListContainer}>
              <Text
                style={[styles.day, { alignSelf: "center", marginTop: 15 }]}
              >
                {t("No Data")}
              </Text>
            </View>
          )}
        />
      </View>
      {/* <Filtersortmodal
        sortModalVisible={sortmodalVisible}
        setSortModalVisible={setSortModalVisible}
        // handleSortPress={sortByCreatedAt}
        // data={[{ id: "1", title: "Name" }]}
      /> */}
      {/* <Footer /> */}
    </>
    // </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  box: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.litegray,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  renderitemmain: { flexDirection: "row", alignItems: "center" },
  day: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  statusbg: { alignItems: "center" },
  statusbox: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
  statusname: {
    fontSize: RFValue(13),
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 10 },
  renderdetails: { flexDirection: "row", alignItems: "center" },
  daydetails: {
    fontSize: RFValue(14),
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
  },
  data: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  date: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  listContent: { padding: 16 },
  listContent: { padding: 16 },
  dropdownButtonStyle: {
    height: RFValue(45),
    borderWidth: 1,
    borderColor: Colors.litegray,
    width: "100%",
    borderRadius: 7,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: RFValue(5),
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    marginLeft: "3%",
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  dropdownMenuStyle: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  dropdownItemStyle: {
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginTop: RFValue(5),
  },
  box: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.litegray,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  renderitemmain: { flexDirection: "row", alignItems: "center" },
  day: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  statusbg: { alignItems: "center" },
  statusbox: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
  statusname: {
    fontSize: RFValue(13),
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 10 },
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
    backgroundColor: "#f1f1f1",
    borderRadius: 5,
  },
  headerCell: {
    flex: 1,
    alignSelf: "center",
    textAlign: "center",
    fontFamily: FONTS.LexendMedium,
    // textAlign: 'center',
    fontSize: 13,
  },
  row1: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cell: {
    flex: 1,
    alignSelf: "center",
    fontSize: 12,
    textAlign: "center",
    fontFamily: FONTS.LexendRegular,
  },
  box1: {
    // borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProjectTime;
