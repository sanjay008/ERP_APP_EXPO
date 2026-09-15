import {
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  // SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import React, { useEffect, useRef, useState } from "react";
import Header from "../components/header";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import Approved from "../components/approved";
import { Images } from "../constants/images";
import ButtonComponent from "../components/buttonComponent";
import { RFValue, RFPercentage } from "react-native-responsive-fontsize";
import DropdownComponent from "../components/dropdown";
import Modal from "react-native-modal";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import Loader from "../components/loading";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";

const Details = ({ route, navigation }) => {
  const latitude = 37.7749;
  const longitude = -122.4194;
  const { id } = route.params;
  const { color } = route.params;
  const { t } = useTranslation();
  const signatureRef = useRef(null);
  const ref = useRef();
  const [signature, setSignature] = useState("");
  const [idi, setId] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detalsData, setdetalsData] = useState({});
  const [tododata, setTodoData] = useState({});
  const [executordata, setexecutordata] = useState([]);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [nameerror, setNameerror] = useState("");
  const [commenterror, setCommenterror] = useState("");
  const [commentmodalVisible, setCommentModalVisible] = useState(false);
  const [loading, setLoding] = useState(true);
  const [logo, setLogo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [show, setShow] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [customerrelationshipid, setcustomerrelationshipid] = useState("");
  const [reset, setRest] = useState(false);
  const [currentStuts, setCurrentStuts] = useState("");

  const removeHtmlTags = (htmlString) => {
    return htmlString.replace(/<[^>]*>/g, "");
  };

  const openGoogleMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);

    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
    });

    Linking.canOpenURL(googleMapsUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(googleMapsUrl);
        } else {
          const fallbackUrl = Platform.select({
            ios: `http://maps.apple.com/?q=${encodedAddress}`,
            android: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
          });

          Linking.openURL(fallbackUrl).catch((err) =>
            Alert.alert("Error", "Unable to open map application")
          );
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };

  const Detailsworkorder = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.Detailsworkorderuitvoer, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          id: id,
        },
      });
      if (data) {
        if (data.data.tasks && Array.isArray(data.data.tasks)) {
          setTodoData(data.data.tasks);
        }
        if (
          data.data.executor_relaties &&
          Array.isArray(data.data.executor_relaties)
        ) {
          setexecutordata(data.data.executor_relaties);
        }
        setdetalsData(data.data);
        // console.log(data.data.workorder_status,'ushgvoids=======');
        setcustomerrelationshipid(data?.data.customer_relationship_id);
        setCurrentStuts(data?.data?.workorder_status?.id);
        setName(data.data.sign_name || "");
        setLoding(false);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const signtureStatusUpdateApi = async (selectId) => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.workorderuitvoerupdatestusts, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          signature: signature,
          sign_name: name,
          status_id: selectId ? selectId : currentStuts,
          id: id,
        },
      });
      if (data) {
        resetSign();
        setRest(false);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const Addcommentapi = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.workorderuitvoeraddcomment, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          customer_relationship_id: customerrelationshipid,
          id: id,
          comment: comment,
        },
      });
      if (data) {
        setCommentModalVisible(false);
        setComment("");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const RenderItem = ({ item, index }) => {
    return (
      <View style={styles.detailsmainview}>
        <Text style={[styles.sub, { color: Colors.textgray }]}>
          {item.name}
        </Text>
        <View style={styles.detailssubject}>
          {index == 1 ? (
            <TouchableOpacity
              onPress={() =>
                index == 1
                  ? detalsData.gmaps_working_address
                    ? openGoogleMaps(item.subject)
                    : ""
                  : ""
              }
              style={styles.locationbg}
            >
              <Text style={[styles.sub, { marginRight: 5 }]}>
                {item.subject}
              </Text>
              {detalsData.gmaps_working_address ? (
                <>
                  {index == 1 && (
                    <Image
                      source={Images.location}
                      style={styles.locationimage}
                    />
                  )}
                </>
              ) : (
                ""
              )}
            </TouchableOpacity>
          ) : (
            <Text style={[styles.sub, { marginRight: 5 }]}>{item.subject}</Text>
          )}
        </View>
        {item.Approved}
      </View>
    );
  };

  const RenderItemTodoList = ({ item, index }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Taskdetails", { id: item.id, color: color })
        }
      >
        <View style={styles.tdview}>
          <Text
            style={[
              styles.sub1,
              { width: widthPercentageToDP(52), paddingBottom: 5 },
            ]}
          >
            {item.id} - {item.title}
          </Text>
          <Approved
            stuts={item?.priority}
            backgroundColor={item?.priority_background_color}
            color={item?.priority_color}
          />
        </View>
        <View style={styles.shortdescription}>
          {item?.short_description && (
            <>
              <Text
                numberOfLines={2}
                style={[styles.sub1, { color: Colors.textgray }]}
              >
                {removeHtmlTags(item?.short_description)}
              </Text>
            </>
          )}
        </View>
        <View style={styles.quntitybg}>
          <Image source={Images.time} style={styles.timebg} />
          <Text style={[styles.sub1, { paddingLeft: 10 }]}>
            {item.quantity} {item.quantity_type}
          </Text>
          <Text
            style={[
              styles.sub1,
              {
                paddingLeft: 10,
                color: Colors.textgray,
                position: "absolute",
                right: 0,
              },
            ]}
          >
            {item.deadline}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const RenderItemCommets = ({ item, index }) => {
    return (
      <View
        style={{
          flexDirection: "row",
          backgroundColor: Colors.white,
          padding: 10,
          borderRadius: 10,
        }}
      >
        <View>
          <Image
            source={{ uri: item?.user?.profile_image }}
            defaultSource={Images.userblanck}
            style={styles.commentimage}
          />
        </View>
        <View style={{ paddingLeft: 10 }}>
          <View>
            <Text style={styles.sub1}>{item.username}</Text>
          </View>
          <Text style={[styles.sub1, { color: Colors.textgray, fontSize: 13 }]}>
            {item.created_at}
          </Text>
          <Text style={[styles.sub1, { textAlign: "left" }]}>
            {removeHtmlTags(item.comment)}
          </Text>
        </View>
      </View>
    );
  };

  const handleOK = (signature) => {
    console.log(signature);
    removeBase64Prefix(signature);
  };

  const handleEmpty = () => {
    console.log("Empty");
  };

  const handleClear = () => {
    console.log("clear success!");
  };

  const handleEnd = () => {
    ref.current.readSignature();
  };

  const handleData = (data) => {
    console.log(data);
  };

  const saveSign = (abcd) => {
    signatureRef.current?.saveImage();
    console.log(signatureRef.current, "signatureRef");
    {
      abcd ? "" : approoveee();
    }
    console.log(signature, "djcnsdfj");
  };

  const approoveee = () => {
    if (name != "") {
      setModalVisible(false);
      saveSign("abcd");
      signtureStatusUpdateApi(64);
      setNameerror("");
      onRefresh();
    } else {
      setNameerror("Enter Naam");
    }
  };

  const resetSign = () => {
    setRest(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    Detailsworkorder();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const Companylogo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setLogo(companylogo);
  };

  useEffect(() => {
    Detailsworkorder();
    Companylogo();
  }, [comment]);

  const removeBase64Prefix = (dataUrl) => {
    const imageeofsignature = dataUrl.replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      ""
    );
    setSignature(imageeofsignature);
  };

  const webStyle = `.m-signature-pad--footer
    .save {
        display: none;
    }
    .clear {
          margin:auto;
          background-color: red;
          padding:0px 20px;
    }
    .m-signature-pad {
      position: absolute;
      font-size: 10px;
      width: 700px;
      height: 85%;
      top: 50%;
      left: 50%;
      margin-left: -350px;
      margin-top: -200px;
      border: 1px solid #e8e8e8;
      background-color: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.27), 0 0 40px rgba(0, 0, 0, 0.08) inset;
    }
    .button {
      background-color: red;
      color: #4E83E7;

`;

  return (
    // <SafeAreaView style={[styles.safe, { backgroundColor: color }]}>
    <>
      <StatusBar backgroundColor={color} barStyle={"light-content"} />
      {/* <Header
        back
        source={{ uri: logo }}
        rightIcon={Images.refresh}
        rightIconClick={onRefresh}
      /> */}
      <BlueHeader
        title={t("Details")}
        Righticon={Images.refresh}
        onPressRight={onRefresh}
        bgcolor={color}
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
        {show && <Loader />}
        {loading ? (
          <Loader />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary, "#F048C6"]}
                tintColor={Colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            style={{ marginHorizontal: 24 }}
          >
            <View style={styles.headercomponent}>
              <Text style={styles.title}>{t("Werkorder")}</Text>
              <Text style={styles.orderid}>{detalsData.order_id}</Text>
            </View>

            <View style={styles.fview}>
              <FlatList
                data={[
                  {
                    id: 1,
                    name: t("Klant"),
                    subject: detalsData?.relaties_customer?.display_name,
                  },
                  {
                    id: 2,
                    name: t("Werk Adres"),
                    subject: detalsData.gmaps_working_address
                      ? detalsData.gmaps_working_address
                      : "--",
                  },
                  {
                    id: 3,
                    name: t("Uitvoerdatum"),
                    subject: detalsData.execution_date,
                  },
                  {
                    id: 4,
                    name: t("Uitvoerder"),
                    subject: executordata?.map((executor) =>
                      executor?.display_name !== null ||
                      executor?.display_name !== "" ||
                      executor?.display_name !== undefined
                        ? executor.display_name
                        : "-"
                    ),
                  },
                  {
                    id: 5,
                    name: t("Status"),
                    subject: detalsData?.workorder_status?.status_name,
                    // Approved: (
                    //   <DropdownComponent
                    //     initialSelectedItem={detalsData.workorder_status}
                    //     signatureModal={setModalVisible}
                    //     workorderuitvoerId={id}
                    //     setCurrentStuts={setCurrentStuts}
                    //     signtureStatusUpdateApi={signtureStatusUpdateApi}
                    //   />
                    // ),
                  },
                ]}
                renderItem={RenderItem}
                ItemSeparatorComponent={() => {
                  return <View style={styles.line} />;
                }}
              />
            </View>
            {tododata && tododata.length > 0 ? (
              <>
                <Text style={styles.title}>{t("ToDo")}</Text>
                <View style={styles.fview}>
                  <FlatList
                    data={tododata}
                    renderItem={RenderItemTodoList}
                    ItemSeparatorComponent={() => {
                      return <View style={styles.line} />;
                    }}
                  />
                </View>
              </>
            ) : null}

            {detalsData?.workorder_status?.id != 64 ? (
              <View style={[styles.tdview, { marginBottom: 15 }]}>
                <ButtonComponent
                  onPress={() => setCommentModalVisible(true)}
                  marginTop={RFValue(15)}
                  width={RFPercentage(19)}
                  title={t("Opmerking")}
                />
                <ButtonComponent
                  onPress={() => setModalVisible(true)}
                  marginTop={RFValue(15)}
                  width={RFPercentage(19)}
                  title={t("Goedkeuren")}
                  backgroundColor={Colors.pink}
                />
              </View>
            ) : (
              ""
            )}

            {detalsData.signature_image != null ? (
              <View>
                <Text style={styles.title}>
                  {t("Handtekening klant voor akkoord")}
                </Text>
                <Image
                  style={styles.signatureimage}
                  source={{ uri: detalsData.signature_image }}
                />
                <Text style={[styles.title, { paddingBottom: 10 }]}>
                  {detalsData.sign_name} :{""}{" "}
                </Text>
              </View>
            ) : null}

            {detalsData &&
            detalsData?.comments &&
            detalsData?.comments.length > 0 ? (
              <>
                <Text style={[styles.title, { marginTop: 1 }]}>
                  {t("Opmerkingen")}
                  {" :"}
                </Text>
                <View style={styles.commentviewset}>
                  <FlatList
                    data={detalsData.comments}
                    renderItem={RenderItemCommets}
                    contentContainerStyle={{ marginBottom: 50, marginTop: 10 }}
                    ItemSeparatorComponent={() => {
                      return <View style={styles.line} />;
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
              </>
            ) : null}
            <View>
              <Modal style={styles.smodel} visible={modalVisible}>
                <View
                  style={[
                    styles.sview,
                    {
                      height:
                        detalsData.signature_image == ""
                          ? "65%"
                          : reset == true
                          ? "70%"
                          : "62%",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.addc,
                      {
                        borderColor: Colors.litegray,
                        fontSize: 15,
                        paddingBottom: 5,
                      },
                    ]}
                  >
                    {t("Handtekening voor akkoord")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Detailsworkorder();
                      console.log("modalclose"), setModalVisible(false);
                      setNameerror("");
                      setRest(false);
                    }}
                    style={{ position: "absolute", right: 18, top: 12 }}
                  >
                    <Image
                      source={Images.close}
                      style={{ height: 24, width: 24 }}
                    />
                  </TouchableOpacity>

                  {detalsData.signature_image == "" || reset == true ? (
                    <SignatureScreen
                      ref={ref}
                      onEnd={handleEnd}
                      onOK={handleOK}
                      onEmpty={handleEmpty}
                      onClear={handleClear}
                      onGetData={handleData}
                      webStyle={webStyle}
                      autoClear={false}
                      descriptionText={""}
                    />
                  ) : (
                    <View>
                      <Image
                        style={styles.signaturechange}
                        source={{
                          uri: detalsData.signature_image,
                        }}
                      />
                    </View>
                  )}
                  {detalsData?.workorder_status?.id != 64 ? (
                    <View
                      style={{
                        flexDirection: "row",
                      }}
                    >
                      {reset != true && (
                        <TouchableOpacity
                          style={[
                            styles.buttonStyle,
                            { backgroundColor: Colors.litegray },
                          ]}
                          onPress={resetSign}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontFamily: FONTS.LexendMedium,
                              color: Colors.black,
                            }}
                          >
                            {t("Opnieuw")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    ""
                  )}
                  <View style={styles.sbottamview}>
                    <Text style={styles.name}>{t("Naam")} :</Text>
                    <View style={{ width: "85%" }}>
                      <TextInput
                        placeholder={name}
                        value={name}
                        onChangeText={(txt) => {
                          setName(txt), setNameerror("");
                        }}
                        style={styles.input}
                      />
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: FONTS.LexendRegular,
                      color: Colors.red,
                      paddingBottom: 10,
                      marginHorizontal: 20,
                    }}
                  >
                    {nameerror}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      approoveee();
                    }}
                    style={styles.approve}
                  >
                    <Text style={styles.approvetext}>{t("Approve")}</Text>
                  </TouchableOpacity>
                </View>
              </Modal>
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
        )}
      </View>
      {/* <Footer /> */}
      {/* </SafeAreaView> */}
    </>
  );
};

export default Details;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  title: {
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    fontSize: 17,
    marginTop: 15,
  },
  fview: {
    borderRadius: 10,
    borderColor: Colors.litegray,
    borderWidth: 1,
    padding: 15,
    marginTop: 10,
    backgroundColor: Colors.white,
  },
  sub: {
    color: Colors.primaryblue,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
  },
  sub1: {
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
  },
  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 10 },
  tdview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  smodel: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
    backgroundColor: Colors.transparant,
    paddingVertical: 20,
  },
  sbottamview: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 15,
    backgroundColor: "transparent",
  },
  input: {
    backgroundColor: Colors.primarylite,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    height: heightPercentageToDP(5),
  },
  signature: {
    borderColor: Colors.black,
    borderWidth: 1,
    marginTop: 10,
  },
  buttonStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    backgroundColor: Colors.white,
    margin: 10,
    borderRadius: 7,
  },
  headercomponent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderid: {
    color: Colors.primary,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    marginTop: 15,
  },
  signatureimage: {
    height: 150,
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    resizeMode: "stretch",
    backgroundColor: Colors.white,
  },
  commentviewset: {
    marginTop: 10,
  },
  signaturechange: {
    height: 150,
    width: "90%",
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    resizeMode: "stretch",
    alignSelf: "center",
  },
  commenterror: {
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    paddingBottom: 10,
    marginHorizontal: 20,
  },
  approve: {
    backgroundColor: Colors.primary,
    width: 200,
    height: heightPercentageToDP(5),
    borderRadius: 7,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  approvetext: {
    fontSize: 15,
    fontFamily: FONTS.LexendMedium,
    color: Colors.white,
  },
  commentbuttons: {
    flex: 1,
    flexDirection: "row",
  },
  detailsmainview: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailssubject: {
    width: widthPercentageToDP(45),
    alignItems: "flex-end",
  },
  locationimage: {
    height: 20,
    width: 20,
  },
  locationbg: {
    flexDirection: "row",
  },
  shortdescription: {
    flexDirection: "row",
    marginTop: 5,
  },
  quntitybg: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  timebg: {
    height: 30,
    width: 30,
  },
  commentimage: {
    height: 50,
    width: 50,
    borderRadius: 7,
  },
});
