import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Colors } from "../constants/color";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import { widthPercentageToDP } from "react-native-responsive-screen";
import BlueHeader from "../components/BlueHeader";
import { Images } from "../constants/images";
import Filtersortmodal from "../components/Filtersortmodal";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import { useFocusEffect } from "@react-navigation/native";
import ApiService from "../utils/Apiservice";
import { t } from "i18next";
import Loader from "../components/loading";

const Ticket = ({ navigation, route }) => {
  const { item } = route.params || {};
  // console.log(item);
  const [isAsc, setIsAsc] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalvisible, setFilterModalVisible] = useState(false);
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [ticketsList, setTicketslist] = useState([]);
  const [selectedStatusIds, setSelectedStatusIds] = useState([]);
  const [statusdata, setStatusData] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [AllPermission, setPermissions] = useState(null);
  useEffect(() => {
    const fetchPermission = async () => {
      try {
        const getdata = await getData("USERDATA");
        console.log("Permi userdata", getdata);

        if (
          !getdata ||
          !getdata.data ||
          !getdata.data.user ||
          !getdata.data.relaties
        ) {
          console.log("Missing required user data:", getdata);
          return;
        }

        const response = await ApiService(apiConstants.permission, {
          includeToken: true,
          customData: {
            relaties_id: getdata.data.relaties.id,
            user_id: getdata.data.user.id,
            role: getdata.data.user.role,
          },
        });

        // ✅ Check response.status === 200 or expected code
        if (response?.data) {
          setPermissions(response.data);
          console.log("response.data Permission ==>", response.data);
        } else {
          console.log("Unexpected response format or error:", response);
        }
      } catch (error) {
        console.log("Error fetching permission:", error);
      }
    };
if(AllPermission == null){
  fetchPermission();
}
  }, []);
  useEffect(() => {
    setFilteredTasklist(ticketsList);
  }, [ticketsList]);

  useEffect(() => {
    const filterBySearchQuery = (task) =>
      task?.project_data?.project_name
        .toLowerCase()
        .includes(search.toLowerCase());

    const filterBySelectedStatus = (task) => {
      if (selectedItems.length === 0) return true;
      return selectedItems.includes(task?.ticket_status_data?.id);
    };

    const filtered = ticketsList
      .filter(filterBySearchQuery)
      .filter(filterBySelectedStatus);
    setFilteredTasklist(filtered);
  }, [search, ticketsList, selectedItems]);

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
    const filtered = ticketsList.filter((task) => {
      const filterBySearchQuery = task?.project_data?.project_name
        ?.toLowerCase()
        ?.includes(search.toLowerCase());
      const filterBySelectedStatus =
        selectedStatusIds.length === 0 ||
        selectedStatusIds?.includes(task?.ticket_status_data?.id);

      return filterBySearchQuery && filterBySelectedStatus;
    });
    setFilteredTasklist(filtered);
  };
  const fetchTasklist = async () => {
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
      const data = await ApiService(apiConstants.get_tickets, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
        },
      });
      
      if (data.status) {
        setTicketslist(data.data);
      } else {
        console.log("Failed to fetch connections.");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };
  
  const StusSearch = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
        customData: {
          slug: "ticket",
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

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      fetchTasklist();
    }, 1000);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasklist();
      StusSearch();
    }, [])
  );
  const SortDataFun = () => {
    const sorted = [...filteredTasklist]
      .map(item => ({
        ...item,
        idNum: Number(item.id) || 0
      }))
      .sort((a, b) => (isAsc ? a.idNum - b.idNum : b.idNum - a.idNum))
      .map(({ idNum, ...rest }) => rest);

    setFilteredTasklist(sorted);
    setIsAsc(prev => !prev); // toggle next sorting order
  };
const formatDateNL = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
  const TodayDate = "2025-08-27";
  return (
    <>
      <StatusBar backgroundColor={"transparent"} translucent={true} />
      {refreshing && <Loader />}
      <BlueHeader
        bgcolor={item ? item.color_code : "#eba14d"}
        title={item ? t(item.item_title) : t("Ticket")}
        onPressfilter={() => setFilterModalVisible(true)}
        SearchBarInput
        value={search}
        onChangeText={(txt) => {
          setSearch(txt);
        }}
        arrowOnPress={SortDataFun}
        onPressRight={onRefresh}
        Righticon={Images.refresh}
      />

      {String(AllPermission?.project_tickets_view?.create) ==
        "1" && <TouchableOpacity
          onPress={() => navigation.navigate("CreateTicket", { item: item })}
          style={styles.AddBtn}
        >
          <Image source={Images.plus} style={{ width: 20, height: 20, }} />
          <Text style={styles.Text}>{"Ticket"}</Text>
          {/* <Text style={styles.Text}>{"Add"}</Text> */}
        </TouchableOpacity>}
      <FlatList
        style={{ paddingBottom: 50 }}
        ListFooterComponent={() => <View style={{ height: 50 }} />}
        data={filteredTasklist}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <View
            style={{
              height: 400,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, color: Colors.black }}>
              No Data Found
            </Text>
          </View>
        )}
        renderItem={({ item: itemmm }) => {
          if (search !== "") {
            let check = itemmm?.project_data?.project_name
              ?.toLowerCase()
              ?.includes(search?.toLowerCase());
            if (!check) return null;
          }
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("TicketDetails", {
                  item: {
                    ...itemmm,
                    color_code: item ? item.color_code : "#eba14d",
                  },
                })
              }
              style={styles.containerChild}
            >
              <View style={styles.nameview}>
<View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>

                <Text style={[styles.name, {}]}>
                  {itemmm?.ticket_title || "-"}
                </Text>
                  <View
                    style={{
                      flexDirection: "row-reverse",
                      marginTop: 10,
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    <Text
                      style={[styles.name, { fontSize: 15, paddingRight: 5 }]}
                    >
                      {itemmm?.id || "-"}
                    </Text>
                    <View
                      style={[
                        styles.aprooveView,
                        {
                          backgroundColor: itemmm?.ticket_status_data?.color
                            ? itemmm?.ticket_status_data?.color
                            : Colors.primary,

                          borderRadius: 5,
                        },
                      ]}
                    >
                      <Text style={styles.aprrove}>
                        {itemmm?.ticket_status_data?.status_name}
                      </Text>
                    </View>
                  </View>
</View>
                <Text style={[styles.name, { color: Colors.textgray }]}>
                 👤 {itemmm?.action_relatie_data?.display_name || "-"}
                </Text>
                <Text style={[styles.name, { color: Colors.textgray }]}>
                   📁 {itemmm?.project_data?.project_name || "-"}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    // backgroundColor:'red'

                  }}
                >
                  <View style={{flex:1}}>

                  <Text style={[styles.name, { color: Colors.textgray }]}>
                    
                     📅 {formatDateNL(itemmm?.created_at)}

                  </Text>
                  </View>
                  {/* Status */}
                
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <Filtersortmodal
        sortModalVisible={sortmodalVisible}
        setSortModalVisible={setSortModalVisible}
        // handleSortPress={arrowOnPress}
        filterModalVisible={filterModalvisible}
        setFilterModalVisible={setFilterModalVisible}
        handleCheckboxChange={handleCheckboxChange}
        applyFilters={applyFilters}
        statusData={statusdata}
        selectedStatusIds={selectedStatusIds}
        modalheight={"90%"}
        data={[
          { id: "1", title: "Id" },
          { id: "2", title: "Name" },
          { id: "3", title: "Status" },
          { id: "4", title: "Date" },
        ]}
      />
      {/* </ScrollView> */}
    </>
  );
};

export default Ticket;

const styles = StyleSheet.create({
  AddBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 7,
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 10
  },
  Text: {
    color: Colors.white,
    fontSize: RFValue(12),
    fontWeight: "500",
    fontFamily: FONTS.LexendRegular,
  },
  containerChild: {
    marginHorizontal: 20,
    // paddingVertical: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  // nameview: { justifyContent: "space-evenly", paddingLeft: 5 },
  name: { color: Colors.black, fontFamily: FONTS.LexendMedium, fontSize: 15 },
  aview: {
    justifyContent: "center",
    alignItems: "center",
  },
  aprrove: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
  },
  aprooveView: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
});
