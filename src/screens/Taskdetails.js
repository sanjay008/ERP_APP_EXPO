import {
  View,
  Text,
  // SafeAreaView,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  Dimensions,
  Touchable,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import { Images } from "../constants/images";
import { getData } from "../utils/storeData";
import { Colors } from "../constants/color";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import Notes from "../components/Notes";
import apiConstants from "../api/apiConstants";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
import RenderHTML from "react-native-render-html";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { Button } from "react-native-paper";
import ButtonComponent from "../components/buttonComponent";
import Modal from "react-native-modal";

const Taskdetails = ({ route }) => {
  const { t } = useTranslation();
  const [logo, setLogo] = useState(null);
  const [taskdetails, setTaskdetails] = useState([]);
  console.log("taskdetails", taskdetails);
  const [commentmodalVisible, setCommentModalVisible] = useState(false);
  const [comment, setComment] = useState("");
  const [commenterror, setCommenterror] = useState("");

  const { width } = Dimensions.get("screen");
  const { id } = route.params;
  const { color } = route.params;
  const screenWidth = Dimensions.get("window").width;
  const companylogo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setLogo(companylogo);
  };

  const removeHtmlTags = (htmlString) => {
    return htmlString.replace(/<[^>]*>/g, "");
  };

  const Tasklist = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.tasklistdetails, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          task_id: id,
        },
      });
      if (data.status) {
        console.log("data.data", data.data);

        setTaskdetails(data.data);
      } else {
        console.log("Failed to fetch connections.");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    companylogo();
    Tasklist();
  }, []);

  const DATA = [
    {
      id: 7,
      title: t("Id"),
      dis: taskdetails.id,
    },
    {
      id: 1,
      title: t("Termijn"),
      dis: taskdetails.deadline == null ? "-" : taskdetails.deadline,
    },
    {
      id: 2,
      title: t("Priorities"),
      dis: taskdetails.priority == null ? "-" : taskdetails.priority,
    },
    {
      id: 3,
      title: t("Aantal"),
      dis:
        taskdetails.quantity == null || taskdetails.quantity_type == null
          ? "-"
          : `${taskdetails.quantity} ${taskdetails.quantity_type}`,
    },
    {
      id: 4,
      title: t("Address"),
      dis:
        taskdetails?.relatie_data?.adres == null
          ? "-"
          : taskdetails?.relatie_data?.adres,
    },
    {
      id: 5,
      title: t("deadline"),
      dis: taskdetails?.deadline == null ? "-" : taskdetails?.deadline,
    },
    {
      id: 6,
      title: t("Service Time"),
      dis:
        taskdetails?.service_time_tasktype == null
          ? "-"
          : taskdetails?.service_time_tasktype,
    },

    // {
    //   id: 4,
    //   title: t("Price"),
    //   dis:
    //     taskdetails?.currency_data?.symbol == null ||
    //     taskdetails.hrs_price == null
    //       ? "-"
    //       : `${taskdetails?.currency_data?.symbol} ${taskdetails.hrs_price}`,
    // },
    // {
    //   id: 5,
    //   title: "Belasting",
    //   dis: taskdetails.tax == null ? "-" : `${taskdetails.tax} %`,
    // },
    // {
    //   id: 6,
    //   title: t("Totaalprijs (excl. BTW)"),
    //   dis:
    //     taskdetails?.currency_data?.symbol == null ||
    //     taskdetails.total_price == null
    //       ? "-"
    //       : `${taskdetails?.currency_data?.symbol} ${taskdetails.total_price}`,
    // },
    // {
    //   id: 7,
    //   title: t("Belasting"),
    //   dis:
    //     taskdetails?.currency_data?.symbol == null ||
    //     taskdetails.tax_price == null
    //       ? "-"
    //       : `${taskdetails?.currency_data?.symbol} ${taskdetails.tax_price}`,
    // },
  ];

  const renderItem = ({ item }) => {
    return (
      <>
        <View style={styles.row}>
          <Text style={styles.label}>{item.title} </Text>
          <Text style={styles.value}>{item.dis}</Text>
        </View>
      </>
    );
  };

  const tagsStyles = {
    body: {
      color: Colors.black,
      fontFamily: FONTS.LexendRegular,
    },
  };
  const Addcommentapi = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.tasklistcomment, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          task_id: id,
          comment: comment,
        },
      });
      if (data) {
        console.log("=-=-",data);
        
        setCommentModalVisible(false);
        setComment("");
      }
    } catch (err) {
      console.log("Error fetching connections:98", err);
    }
  };

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: color }]}>
    <>
      {/* <Header
        // justifyContent={"flex-start"}
        source={{ uri: logo }}
        // style={{ width: width * 0.5, height: RFValue(30), right: 70 }}
        rightIcon={Images.dots}
        // rightIconClick={() => setModalOptionsVisible(true)}
        back
      /> */}
      <BlueHeader title={t("Details")} bgcolor={color} withoutsearchbar 
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 20, // Adds bottom padding to the content
          }}
        >
          <View>
            <View style={{ flex: 1, alignItems: "flex-end", marginRight: 20 }}>
              {/* <View style={styles.statusbox2}>
                <Text style={styles.editText} >Edit</Text>
              </View> */}
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 5,
              }}
            >
              <Text style={styles.title}>{taskdetails.title}</Text>
              {taskdetails?.task_status_data && (
                <View
                  style={{ flex: 1, alignItems: "flex-end", marginRight: 20 }}
                >
                  <View
                    style={[
                      styles.statusbox,
                      {
                        backgroundColor:
                          taskdetails.task_status_data.color || Colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.statuname}>
                      {taskdetails.task_status_data.status_name}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.box}>
              <Text style={styles.boxtitle}>{t("Details")}</Text>
              <View style={styles.line}></View>
              <FlatList
                data={DATA}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={styles.line}></View>}
              />
            </View>
            {taskdetails.file_path && (
              <View style={styles.box}>
                <Image
                  source={{ uri: taskdetails.file_path }}
                  style={{ height: 200, width: "100%", resizeMode: "contain" }}
                />
              </View>
            )}
          </View>
          {taskdetails.short_description && (
            <>
              <Text style={styles.title}>{t("Omschrijving")}</Text>
              <View style={styles.box}>
                {/* <RenderHTML
        contentWidth={screenWidth}
        source={{ html: taskdetails.short_description }}
        tagsStyles={tagsStyles}
      /> */}
                {/* <Text
                  style={{
                    color: Colors.black,
                    fontFamily: FONTS.LexendRegular,
                    width: "100%",
                  }}
                >
                {removeHtmlTags(taskdetails.short_description)}
                </Text> */}
                <RenderHTML
                  contentWidth={screenWidth}
                  source={{ html: taskdetails.short_description }}
                  defaultTextProps={{
                    style: {
                      color: Colors.black,
                      fontFamily: FONTS.LexendRegular,
                    },
                  }}
                />
              </View>
            </>
          )}

          {taskdetails?.notes?.map((note) => (
            <Notes
              key={note.id}
              title={t("Notes")}
              name={note?.user?.username}
              time={note.created_at}
              dis={removeHtmlTags(note.comment)}
            />
          ))}
          <View style={styles.box1}>
            <Image
              source={{
                uri: taskdetails?.relatie_data?.profile_image.file_path,
              }}
              style={{
                height: 50,
                width: 50,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: Colors.primary,
              }}
            />
            <Text style={[styles.value, { fontSize: 17, paddingLeft: 10 }]}>
              {t(taskdetails?.relatie_data?.display_name)}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <ButtonComponent
              onPress={() => setCommentModalVisible(true)}
              marginTop={RFValue(15)}
              width={"90%"}
              marginBottom={20}
              title={t("Opmerking")}
              // bax
            />
          </View>
          <View>
            <Modal
              onBackdropPress={() => {
                setCommentModalVisible(false);
              }}
              onBackButtonPress={() => {
                setCommentModalVisible(false);
              }}
              style={styles.cmodel}
              visible={commentmodalVisible}
            >
              <View style={styles.commentview}>
                <Text style={styles.addc}>{t("Voeg een notitie toe")}</Text>
                <TextInput
                  multiline={true}
                  placeholder="Notitie..."
                  placeholderTextColor={Colors.textgray}
                  style={styles.cinput}
                  value={comment}
                  onChangeText={(txt) => {
                    setComment(txt), setCommenterror("");
                  }}
                />
                <Text style={styles.commenterror}>{commenterror}</Text>
                <View style={styles.commentbuttons}>
                  <TouchableOpacity
                    onPress={() => setCommentModalVisible(false)}
                    style={[
                      styles.buttonStyle,
                      { backgroundColor: Colors.litegray },
                    ]}
                  >
                    <Text style={[styles.txt, { color: Colors.black }]}>
                      {t("Sluiten")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Addcommentapi();
                    }}
                    style={[
                      styles.buttonStyle,
                      { backgroundColor: Colors.primary },
                    ]}
                  >
                    <Text style={styles.txt}>{t("Notitie")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
        {/* <Footer /> */}
      </View>
    </>
    // {/* </SafeAreaView> */}
  );
};

export default Taskdetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: RFValue(16),
    fontFamily: FONTS.LexendMedium,
    marginHorizontal: 15,
    marginVertical: 10,
    color: Colors.black,
  },
  box: {
    borderWidth: 1,
    borderColor: Colors.litegray,
    marginHorizontal: 15,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: Colors.white,
    marginTop: 10,
  },
  box1: {
    borderWidth: 1,
    borderColor: Colors.litegray,
    marginHorizontal: 15,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: Colors.white,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  boxtitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(15),
    color: Colors.black,
  },
  label: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.textgray,
    lineHeight: 20,
  },
  value: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  line: {
    height: 1,
    backgroundColor: Colors.litegray,
    marginVertical: 8,
  },
  statusbox: {
    // height: 40,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
  },
  statuname: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.white,
    textAlign: "center",
  },
  statusbox2: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    width: "20%",
    backgroundColor: Colors.primary,
    marginVertical: 5,
  },
  editText: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.white,
    textAlign: "center", // Centers text horizontally
  },
  commentview: {
    flex: 1,
    position: "absolute",
    borderRadius: 10,
    backgroundColor: Colors.white,
    width: "100%",
  },
  cmodel: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
    backgroundColor: Colors.transparant,
  },
  sview: {
    flex: 1,
    position: "absolute",
    borderRadius: 10,
    backgroundColor: Colors.white,
    width: "100%",
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.LexendBold,
    textAlign: "center",
    color: Colors.black,
  },
  buttonStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    backgroundColor: Colors.litegray,
    margin: 20,
    borderRadius: 7,
  },
  txt: { fontSize: 15, fontFamily: FONTS.LexendMedium, color: Colors.white },
  cinput: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.litegray,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  addc: {
    fontSize: 15,
    fontFamily: FONTS.LexendBold,
    marginTop: 15,
    paddingBottom: 10,
    textAlign: "left",
    color: Colors.black,
    paddingLeft: 20,
  },
  commentbuttons: {
    flex: 1,
    flexDirection: "row",
  },
});
