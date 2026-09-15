import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import ApiService from "../utils/Apiservice";
import apiConstants, { pay_job, pay_orders } from "../api/apiConstants";
import { getData } from "../utils/storeData";
import { Colors } from "../constants/color";
import BlueHeader from "../components/BlueHeader";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { useTranslation } from "react-i18next";
import { Images } from "../constants/images";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import Footer from "../components/Footer";

const Payjob = ({ route }) => {
  const { t } = useTranslation();
  const { item } = route.params;
  const [payjob, Setpayjob] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [isDescending, setIsDescending] = useState(true);

  const FetchPayjob = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.pay_job, {
        includeToken: true,
        customData: {
          role: getdata.data.user.role,
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
        },
      });
      if (data) {
        console.log(data, "ijndicsjm=-=-=-=");
        Setpayjob(data.data);
      } else {
        console.log("No data found");
      }
    } catch {
      console.log("Error");
    }
  };

  useEffect(() => {
    FetchPayjob();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    FetchPayjob();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderItem = ({ item }) => {
    // const isExpanded = expandedItemId === item.id;
    return (
      <>
        {/* {payorderlist ? ( */}
        <TouchableOpacity
        // onPress={() => {
        //   setPayorderList(false),
        //     setPayorderDetails(true),
        //     setExpandedItemId(item.id);
        // }}
        // onPress={() => handleItemClick(item.id)}
        >
          <View style={styles.Box}>
            {/* <View style={styles.textContainer}> */}
            {/* <Text style={styles.name}>{item.id || "--"}</Text> */}
            <Text style={styles.standard}>
              {t("id")} :{" "}
              <Text style={styles.standard1}>
                {item.pay_job_generated_number}
              </Text>
            </Text>
            {/* </View> */}
            <Text style={styles.standard}>
              {t("Pay order")} :{" "}
              <Text style={[styles.standard1]}>{item.pay_order_nr}</Text>
            </Text>

            <View style={{ flexDirection: "row" }}>
              <Text style={styles.standard}>{t("Description")} : </Text>
              <Text
                style={[
                  styles.standard1,
                  {
                    width: "70%",
                  },
                ]}
              >
                {item?.description || "--"}
              </Text>
            </View>

            <Text style={styles.standard}>
              {t("Amount")} :{" "}
              <Text style={styles.standard1}>
                {item.rent_currency}{" "}
                {parseFloat(item?.amount).toFixed(2) || "--"}
              </Text>
            </Text>
            <Text style={styles.standard}>
              {t("Date")} :{" "}
              <Text style={styles.standard1}>
                {item.start_date || "-"} - {item?.end_date || "-"}
              </Text>
            </Text>
          </View>
          {/* </View> */}
        </TouchableOpacity>
        {/* ) : null} */}

        {/* {payorderdetails && isExpanded ? ( */}
        {/* <View style={styles.detailsContainer}>
          <Text>{t("Payment Details")}</Text>
          <Text>
            {t("Pay Order ID:")} {paymentDetails?.pay_order_id}
          </Text>

        </View> */}
        {/* ) : null} */}
      </>
    );
  };

  useEffect(() => {
    if (!payjob || !Array.isArray(payjob)) {
      setFilteredTasklist([]);
      return;
    }
    const filterBySearchQuery = (pay) =>
      pay.pay_order_nr?.toLowerCase().includes(searchQuery?.toLowerCase());

    const filterBySelectedStatus = (pay) => {
      if (selectedItems.length === 0) return true; // No filter applied
      return selectedItems.includes(pay.pay_order_nr);
    };

    const filtered = payjob
      .filter(filterBySearchQuery)
      .filter(filterBySelectedStatus);
    setFilteredTasklist(filtered);
  }, [searchQuery, payjob, selectedItems]);

  const sortByCreatedAt = () => {
    console.log("sort data by amount aec/des");
    const sortedData = [...payjob].sort((a, b) => {
      const aName = a?.amount?.toLowerCase() || "";
      const bName = b?.amount?.toLowerCase() || "";

      return isDescending
        ? bName.localeCompare(aName) // Descending order
        : aName.localeCompare(bName); // Ascending order
    });

    Setpayjob(sortedData);
    setIsDescending(!isDescending); // Toggle sort direction
  };

  return (
    <>
      <StatusBar backgroundColor={item.color_code} barStyle={"light-content"} />
      <BlueHeader
        bgcolor={item.color_code}
        title={"Pay Job"}
        Righticon={Images.refresh}
        onPressRight={FetchPayjob}
        SearchBarInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        arrowOnPress={sortByCreatedAt}
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
        {/* <Footer /> */}
      </View>
    </>
  );
};

export default Payjob;

const styles = StyleSheet.create({
  emptyText: {
    textAlign: "center",
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    marginTop: 20,
  },
  Box: {
    paddingVertical: 10,
    borderWidth: 1,
    marginTop: RFValue(15),
    borderRadius: 10,
    borderColor: Colors.Boxgray,
    paddingHorizontal: RFValue(10),
    marginHorizontal: RFValue(12),
    backgroundColor: Colors.white,
  },
  textContainer: {
    // flexDirection: "column",
    // justifyContent: "center",
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
    // backgroundColor: Colors.red,
  },
});
