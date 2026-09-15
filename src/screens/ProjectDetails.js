import {
  FlatList,
  Image,
  // SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import { Colors } from "../constants/color";
import { Images } from "../constants/images";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import { t } from "i18next";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import ApiService from "../utils/Apiservice";
import Loader from "../components/loading";

const ProjectDetails = ({ navigation, route }) => {
  const { item } = route.params || {};
  const { id } = route.params || {};
  const { color } = route.params;
  const [projectdata, setProjectdata] = useState();
  const [DATAA, setDATAA] = useState([]);
  const [loading, setLoading] = useState(false);


  // const DATAA = [
  //   {
  //     id: "1",
  //     // item: item,
  //     item: projectdata,
  //   },
  // ];

  const getProjectDetails = async () => {

    try {
      setLoading(true);
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.get_project_details, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          project_id: id,
        },
      });
      console.log(data.data[0].ticket_data, 'project_status_data_api');

      if (data.status) {
        setLoading(false);
        setProjectdata(data.data[0]);
        setDATAA([
          {
            id: "1",
            item: data.data[0],
          },
        ]);
      } else {
        setLoading(false);

        console.log("Failed to fetch connections.");
      }
    } catch (err) {
      setLoading(false);

      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    getProjectDetails();
  }, []);

  const renderItem = ({ item }) => {
    return (
      <View style={{ marginHorizontal: 20, marginTop: 10 }}>
        <View>
          <View style={styles.box}>
            <View style={styles.row}>
              <Image
                source={{
                  // uri: `https://app.erpportaal.nl/public/media/project_images/${item.item.project_image}`,
                  uri: item?.item?.project_image,
                }}
                style={{ height: 70, width: 70, borderRadius: 8 }}
                defaultSource={Images.userblanck}
              />

              {/* {item.status && ( */}
              <View style={styles.statusbg}>
                <View
                  style={[
                    styles.statusbox,
                    {
                      backgroundColor: item?.item?.project_status_data_api.color,
                    },
                  ]}
                >
                  <Text style={styles.statusname}>
                    {" "}
                    {item?.item?.project_status_data_api.status_name
                      ? item?.item?.project_status_data_api.status_name
                      : "--"}
                  </Text>
                </View>
              </View>
              {/* )} */}
            </View>
            <View style={styles.line}></View>
            <View style={styles.row}>
              <Text style={styles.label}>{t("Datum")}</Text>
              <Text style={[styles.value, { width: "55%" }]}>
                {item?.item?.deadline || "--"}
              </Text>
            </View>
            <View style={styles.line}></View>
            <View style={styles.row}>
              <Text style={styles.label}>{t("Working Address")}</Text>
              <Text style={[styles.value, { width: "55%" }]}>
                {item?.item?.gmaps_working_address || "--"}
              </Text>
            </View>
            <View style={styles.line}></View>
            {/* <View style={styles.row}>
              <Text style={styles.label}>Budget</Text>
              <Text style={styles.value}>
                {item.item.budject_currency_data?.symbol || "--"}
                {item?.item.budject || "--"}
              </Text>
            </View>
            <View style={styles.line}></View>
            <View style={styles.row}>
              <Text style={styles.label}>Hour Rate</Text>
              <Text style={styles.value}>
                {item?.item.hour_rate_currency_data.symbol}
                {item?.item?.hour_rate || "--"}
              </Text>
            </View>
            <View style={styles.line}></View>
            <View style={styles.row}>
              <Text style={styles.label}>Travel Cost</Text>
              <Text style={styles.value}>
                {item?.item.travel_cost_currency_data?.symbol}
                {item.item?.travel_cost || "--"}
              </Text>
            </View>
            <View style={styles.line}></View> */}
            <View style={styles.row}>
              <Text style={styles.label}>{t("Labels")}</Text>
              {Array.isArray(item.item?.project_labels_data_api) &&
                item?.item?.project_labels_data_api.length > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    //  width: "35%",
                  }}
                >
                  {item?.item?.project_labels_data_api.map((labelItem, index) => (
                    <View
                      style={{
                        backgroundColor: labelItem?.color_code || Colors.primary,
                        flexDirection: "row",
                        padding: 5,
                        marginLeft: 3,
                        borderRadius: 5,

                      }}
                    >
                      <Text
                        key={index}
                        style={[styles.value, { marginRight: 5, color: Colors.black }]}
                      >
                        {labelItem?.labels || "--"}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.value, { width: "55%" }]}>--</Text>
              )}
            </View>
          </View>
          {/* console.warn(item); */}

          <Text style={styles.title}>{t("Klant")}</Text>
          <View style={styles.box}>
            {item?.item?.relaties_owners.map((item, index) => (
              <>
                <View key={index} style={styles.boxcontainer}>
                  <Image
                    defaultSource={Images.userblanck}
                    source={{ uri: item?.profile_img || Images.userbla }}
                    style={styles.image}
                  />
                  <View style={styles.textstyle}>
                    <Text style={styles.description}>{item.display_name}</Text>
                    <Text style={[styles.description, { marginTop: 5 }]}>
                      {item?.telefoon || "-"}
                    </Text>
                  </View>
                </View>
              </>
            ))}
          </View>
          <Text style={styles.title}>{t("Contact")}</Text>
          <View style={styles.box}>
            {item?.item?.connected_relaties.map((item, index) => (
              <>
                <View key={index} style={styles.boxcontainer}>
                  <Image
                    defaultSource={Images.userblanck}
                    source={{ uri: item.profile_img }}
                    style={styles.image}
                  />
                  <View style={styles.textstyle}>
                    <Text style={styles.description}>{item.display_name}</Text>
                    <Text style={[styles.description, { marginTop: 5 }]}>
                      {item.telefoon || "-"}
                    </Text>
                  </View>
                </View>
              </>
            ))}
          </View>
          <Text style={styles.title}>{t("Uitvoerder")}</Text>
          <View style={styles.box}>
            {item?.item?.relaties_members.map((item, index) => (
              <>
                <View key={index} style={styles.boxcontainer}>
                  <Image
                    defaultSource={Images.userblanck}
                    source={{ uri: item?.profile_img }}
                    style={styles.image}
                  />
                  <View style={styles.textstyle}>
                    <Text style={styles.description}>{item?.display_name}</Text>
                    <Text style={[styles.description, { marginTop: 5 }]}>
                      {item?.telefoon || "-"}
                    </Text>
                  </View>
                </View>
              </>
            ))}
          </View>

          <Text style={styles.title}>{t("Project Activity")}</Text>
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: 10,
              marginVertical: 10,
              padding: 10,
            }}
          >
            {item?.item?.project_activity.map((item, index) => (
              <>
                <View
                  key={index}
                  style={{
                    borderWidth: 1,
                    marginVertical: 5,
                    padding: 10,
                    borderRadius: 10,
                    borderColor: Colors.Boxgray,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      width: "100%",
                      flex: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {item?.activity_data && <View style={styles.activity}>
                      <Text style={styles.activityheader}>
                        {item?.activity_data?.activity_category_data?.activities_category_name}
                      </Text>
                    </View>}
                    <View style={styles.activity}>
                      <Text style={styles.activityheader}>
                        {item?.activity_data?.activity_name}
                      </Text>
                    </View>
                  </View>

                  {/* <View style={{ flexDirection: "row" }}>
                    <View style={[styles.activity1 , {backgroundColor: item?.working_schedule === "daily" ? '#004700': Colors.white}]}>
                      <Text style={[styles.activityheader1 , {color:item?.working_schedule == "daily"  ? Colors.white :''}]}>
                        {item?.working_schedule}
                      </Text>
                    </View> */}
                  <View style={{
                    flexDirection: "row",
                    width: "100%",
                    flex: 1,
                    flexWrap: "wrap",
                  }}>
                    <View
                      style={[
                        styles.activity1,
                        {
                          backgroundColor:
                            item?.working_schedule === "daily" || item?.working_schedule === "monthly" || item?.working_schedule === "half_year"
                              ? "#004700" // Green
                              : item?.working_schedule === "weekly"
                                ? "#660066" // Purple
                                : item?.working_schedule === "quarterly" ||
                                  item?.working_schedule === "yearly"
                                  ? "#003a66" // Dark Blue
                                  : Colors.white, // Default color
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activityheader1,
                          {
                            color:
                              item?.working_schedule === "daily" ||
                                item?.working_schedule === "weekly" ||
                                item?.working_schedule === "quarterly" ||
                                item?.working_schedule === "yearly" || item?.working_schedule === "monthly" || item?.working_schedule === "half_year"
                                ? Colors.white
                                : Colors.black, // Default text color
                          },
                        ]}
                      >
                        {item?.working_schedule}
                      </Text>
                    </View>
                    {/* </View> */}

                    {/* <View style={styles.activity1}>
                      <Text style={styles.activityheader1}>
                        {item?.working_schedule_days === "2"
                          ? `${item?.working_schedule_days}X`
                          : item?.working_schedule_days}
                      </Text>
                    </View> */}

                    {/* <View style={styles.container}> */}
                    {item?.working_schedule_days
                      ?.split(",")
                      .map((day, index) => (
                        <View key={index} style={[styles.activity1]}>
                          <Text style={[styles.activityheader1]}>
                            {day == 2 ? `${day}X` : t(day)}
                          </Text>
                        </View>
                      ))}
                    {/* </View> */}
                  </View>
                </View>
              </>
            ))}
          </View>

          <Text style={styles.title}>{t("Tasks")}</Text>
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: 10,
              marginVertical: 10,
              padding: 10,
            }}
          >
            {Array.isArray(item?.item?.task_data) &&
              item.item.task_data.map((item, index) => (
                <>
                  <View
                    key={index}
                    style={{
                      borderWidth: 1,
                      borderColor: Colors.Boxgray,
                      borderRadius: 10,
                      padding: 10,
                      marginVertical: 5,
                      width: "100%",
                    }}
                  >
                    <View style={[styles.row, { justifyContent: "" }]}>
                      <Text style={styles.label1}>{t("Title")} :{"  "}</Text>
                      <Text
                        style={[
                          styles.value,
                          { fontSize: 14, textAlign: "", width: "90%" },
                        ]}
                      >
                        {item.title || "-"}
                      </Text>
                    </View>
                    <View style={[styles.row, { justifyContent: "" }]}>
                      <Text style={styles.label1}>{t("Relatie")} :{"  "}</Text>
                      <Text
                        style={[
                          styles.value,
                          { fontSize: 14, textAlign: "", width: "90%" },
                        ]}
                      >
                        {item?.relatie_data?.display_name || "-"}
                      </Text>
                    </View>

                    <View style={[styles.row, { justifyContent: "" }]}>
                      <Text style={styles.label1}>{t("Priority")} :{"  "}</Text>
                      <Text
                        style={[
                          styles.value,
                          { fontSize: 14, textAlign: "", width: "90%" },
                        ]}
                      >
                        {item.priority || "-"}
                      </Text>
                    </View>

                    <View style={[styles.row, { justifyContent: "" }]}>
                      <Text style={styles.label1}>{t("Deadline")} :{"  "}</Text>
                      <Text
                        style={[
                          styles.value,
                          { fontSize: 14, textAlign: "", width: "90%" },
                        ]}
                      >
                        {item?.deadline || "-"}
                      </Text>
                    </View>

                    {/* <View style={[styles.row, { justifyContent: "" }]}>
                      <Text style={styles.label1}>Quantity :{"  "}</Text>
                      <Text
                        style={[
                          styles.value,
                          { fontSize: 14, textAlign: "", width: "90%" },
                        ]}
                      >
                        {item?.quantity}{'  '}
                        {item?.quantity_type}
                      </Text>
                    </View>
                    <View style={[styles.row, { justifyContent: "" }]}>
                      <Text style={styles.label1}>Total price :{"  "}</Text>
                      <Text
                        style={[
                          styles.value,
                          { fontSize: 14, textAlign: "", width: "90%" },
                        ]}
                      >
                        {item.total_price_currency} {item.total_price || "-"}
                      </Text>
                    </View> */}
                    <View style={styles.statusbg}>

                      <View
                        style={[
                          styles.statusbox,
                          {
                            backgroundColor: item?.task_status_data?.color,
                          },
                        ]}
                      >
                        <Text style={styles.statusname}>
                          {" "}
                          {item?.task_status_data?.status_name
                            ? item?.task_status_data?.status_name
                            : "--"}
                        </Text>
                      </View>
                    </View>

                  </View>
                </>
              ))}
          </View>
          <Text style={styles.title}>{t("Ticket")}</Text>
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: 10,
              marginVertical: 10,
              padding: 10,
            }}
          >
            {Array.isArray(item?.item?.ticket_data) && item.item.ticket_data.length > 0 &&
              item.item.ticket_data.map((item) => (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("TicketDetails", {
                        item: {
                          ...item,
                          color_code: color, // new key add
                        },
                      })
                    }
                    style={styles.containerChild}
                  >
                    <View style={styles.nameview}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text style={[styles.name, { fontSize: 18, flex: 1, color: Colors.black }]}>
                          {item?.project_name || "-"}
                        </Text>
                        {/* Status */}
                        <View
                          style={{
                            flexDirection: "row",
                            marginTop: 10,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={[styles.name, { fontSize: 15, paddingRight: 5, color: Colors.black }]}
                          >
                            {item?.id || "-"}
                          </Text>
                          <View
                            style={[
                              styles.aprooveView,
                              {
                                backgroundColor: item?.ticketstatus?.color
                                  ? item?.ticketstatus?.color
                                  : Colors.primary,

                                borderRadius: 5, paddingHorizontal: 10
                              },
                            ]}
                          >
                            <Text style={styles.aprrove}>
                              {item?.ticketstatus?.status_name}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.name, { color: Colors.textgray }]}>
                        {item?.ticket_title || "-"}
                      </Text>
                      <Text style={[styles.name, { color: Colors.textgray }]}>
                        {item?.action_relatie_data?.display_name || "-"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    // <SafeAreaView style={{ flex: 1, backgroundColor: color }}>
    <>
      <StatusBar backgroundColor={color} barStyle={"light-content"} />
      {/* <Header
        lefticon={Images.back}bv 
        lefticonclick={() => navigation.goBack()}
        title={item.project_name}
      /> */}
      <BlueHeader title={projectdata?.project_name} bgcolor={color} />
      {loading && <Loader color={color} />}
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
        <FlatList
          bounces={false}
          data={DATAA}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
      {/* <Footer /> */}
      {/* </SafeAreaView> */}
    </>
  );
};

export default ProjectDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    marginVertical: 5,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(13),
    color: Colors.textgray,
  },
  label1: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    color: Colors.textgray,
  },
  value: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
    textAlign: "right",
    flexWrap: "wrap",
    // width: "55%",
  },
  line: {
    height: 1,
    backgroundColor: Colors.litegray,
    marginVertical: 6,
  },
  title: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(16),
    color: Colors.black,
    // flex: 6,
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
  description: {
    textAlign: "left",
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
  },
  image: {
    width: 45,
    height: 45,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.litegray,
  },
  boxcontainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  textstyle: {
    left: 10,
    width: "80%",
    borderBottomColor: Colors.litegray,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  activity: {
    backgroundColor: Colors.litegray,
    padding: 8,
    marginRight: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  activity1: {
    backgroundColor: Colors.white,
    padding: 5,
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 10,
  },
  activityheader: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: Colors.primary,
  },
  activityheader1: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: Colors.black,
  },
  name: { color: Colors.black, fontFamily: FONTS.LexendMedium, fontSize: 15 },

});
