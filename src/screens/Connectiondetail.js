import {
  FlatList,
  Image,
  // SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  StatusBar,
  Alert,
  Button,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import Header from "../components/header";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { getData } from "../utils/storeData";
import { Images } from "../constants/images";
import { RFValue } from "react-native-responsive-fontsize";
import apiConstants from "../api/apiConstants";
import { useFocusEffect } from "@react-navigation/native";
import { heightPercentageToDP, widthPercentageToDP } from "react-native-responsive-screen";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";

const Connectiondetails = ({ navigation, route }) => {
  const { id } = route?.params;
  const { color } = route.params;
  const { t } = useTranslation();
  const [logo, setLogo] = useState(null);
  const [data, setData] = useState("");

  const handleOpenLink = async (appUrl, webUrl) => {
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpen ? appUrl : webUrl);
    } catch {
      Alert.alert("Error", `Cannot open the link.`);
    }
  };

  const handleLinkPress = (link) => {
    if (link === "facebook")
      handleOpenLink(
        "https://www.facebook.com",
        "https://www.facebook.com/login"
      );
    else if (link === "linkedin")
      handleOpenLink(
        "https://www.linkedin.com",
        "https://www.linkedin.com/login"
      );
    else if (link === "website")
      handleOpenLink(
        "https://app.erpportaal.nl/profile",
        "https://app.erpportaal.nl/login"
      );
  };

  const companylogo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setLogo(companylogo);
  };
  useEffect(() => {
    companylogo();
  }, []);

  const DATA = [
    {
      id: 1,
      title: data
        ? data?.bedrijf_particulier == 1
          ? t("Bedrijfsnaam")
          : data?.bedrijf_particulier == 2
            ? t("Volledige naam")
            : data?.bedrijf_particulier == 3
              ? t("Name")
              : data?.bedrijf_particulier == 4
                ? t("Voertuignaam")
                : ""
        : "",
      dis: data
        ? data?.bedrijf_particulier == 1
          ? data?.bedrijfsnaam
          : data?.bedrijf_particulier == 2
            ? data?.display_name
            : data?.bedrijf_particulier == 3
              ? data?.display_name
              : data?.bedrijf_particulier == 4
                ? data?.voertuig_project
                : ""
        : "",
      img: Images.name,
    },
    ...(data.bedrijf_particulier == 1 ||
      data.bedrijf_particulier == 2 ||
      data.bedrijf_particulier == 3 ||
      data.bedrijf_particulier == 4
      ? [
        {
          id: 2,
          title: t("Type"),
          dis: data ? data?.soort_relatie : "",
          img: Images.name,
        },
        {
          id: 3,
          title: t("Status"),
          status_name: data ? data?.leadstatus?.status_name : "",
          color_code: data ? data?.leadstatus?.color_code : "",
          img: Images.status,
        },
        {
          id: 4,
          title: t("Label"),
          img: Images.phone,
          box: data.labels,
        },
      ]
      : []),
    ...(data.bedrijf_particulier == 2
      ? [
        {
          id: 5,
          title: t("WhatsApp-nummer"),
          dis: data.whatsapp_number,
          img: Images.wp,
        },
      ]
      : []),
    ...(data.bedrijf_particulier == 1 || data.bedrijf_particulier == 2
      ? [
        {
          id: 6,
          title: t("Telefoon nummer"),
          dis: data ? data?.contact_telefoon : "",
          img: Images.number,
        },
        {
          id: 7,
          title: t("E-mailadres"),
          dis: data ? data?.email_adres : "",
          img: Images.mail,
        },
        ...(data.bedrijf_particulier == 2
          ? [
            {
              id: 8,
              title: t("Prive E-mailadres"),
              dis: data ? data?.email_adres_private : "",
              img: Images.mail,
            },
          ]
          : []),
        {
          id: 10,
          title: t("Facebook"),
          //   dis: data ? data?.facebook_url : "",
          link: "facebook",
          dis: "https://www.facebook.com",
          img: Images.facebook,
        },
        {
          id: 11,
          title: t("LinkedIn"),
          link: "linkedin",
          dis: "https://www.linkedin.com",
          // dis: data ? data?.voertuig_kentekencheck : "",
          img: Images.linkdin,
        },
      ]
      : []),

    ...(data.bedrijf_particulier == 1 ||
      data.bedrijf_particulier == 2 ||
      data.bedrijf_particulier == 3
      ? [
        {
          id: 9,
          title: t("Adress"),
          // title: t("Gaten adres"),
          dis: data ? data?.google_maps : "",
          img: Images.location,
        },
      ]
      : []),
    ...(data.bedrijf_particulier == 1
      ? [
        {
          id: 13,
          title: t("Website"),
          // link: "https://app.erpportaal.nl/login",
          // dis: "https://app.erpportaal.nl/login",
          link: "website",
          dis: "https://app.erpportaal.nl",
          img: Images.website,
        },
      ]
      : []),
    ...(data.bedrijf_particulier == 3
      ? [
        {
          id: 15,
          title: t("Objectnr"),
          dis: data
            ? data?.object_nr === "null"
              ? ""
              : data?.object_nr
            : "",
          img: Images.Modal,
        },
        {
          id: 13,
          title: t("Project naam"),
          dis: data ? data?.project_naam : "",
          img: Images.projectname,
        },
      ]
      : []),
    ...(data.bedrijf_particulier == 4
      ? [
        {
          id: 15,
          title: t("Kenteken plaat"),
          dis: data ? data?.voertuig_kenteken : "",
          img: Images.licence,
        },
        {
          id: 14,
          title: t("Merk"),
          dis: data ? data?.voertuig_merk : "",
          img: Images.brand,
        },
        {
          id: 15,
          title: t("Model"),
          dis: data ? data?.voertuig_model : "",
          img: Images.Modal,
        },
      ]
      : []),
  ];

  const details = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.relatiesdata, {
        includeToken: true,
        customData: {
          id: id,
          relaties_id: getdata?.data?.relaties.id,
          role: getdata?.data.user?.role,
          user_id: getdata?.data?.user.id,
        },
      });
      if (data?.status) {
        setData(data?.data?.relaties);
      } else {
        console.log("Failed Connection details.");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    details();
  }, []);



  const RenderItem = ({ item, index }) => {
    return (
      <View style={styles.main}>
        {item.header && (
          <>
            <Text style={[styles.title, { marginTop: 20 }]}>{item.header}</Text>
          </>
        )}
        <View style={{ flexDirection: "row", marginTop: 20 }}>
          <View style={styles.icon}>
            <Image source={item.img} style={styles.img} />
          </View>

          <View
            style={[
              styles.text,
              {
                justifyContent:
                  item.dis == "" && item.box == "" ? "center" : "space-between",
              },
            ]}
          >
            <Text style={styles.text1}>{item.title}</Text>
            {item.link ? (
              <TouchableOpacity onPress={() => handleLinkPress(item.link)}>
                <Text style={{ color: Colors.primary }}>{item.dis}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.text2}>{item.dis}</Text>
            )}
            {item.box ? (
              <View style={{ bottom: 8 }}>
                <FlatList
                  data={item.box}
                  renderItem={label}
                  showsVerticalScrollIndicator={false}
                  numColumns={3}
                  contentContainerStyle={{ width: "90%" }}
                />
              </View>
            ) : (
              ""
            )}
            {item.status_name ? (
              <View
                style={[
                  styles.statusbox,
                  {
                    backgroundColor: item.color_code || Colors.primary,
                  },
                ]}
              >
                <Text style={styles.statusname}>{item.status_name}</Text>
              </View>
            ) : (
              ""
            )}
          </View>
        </View>
      </View>
    );
  };

  const label = ({ item }) => {
    return (
      <View
        style={[
          styles.labelstatusbox,
          {
            backgroundColor: item.color_code || Colors.primary,
          },
        ]}
      >
        <Text style={styles.statusname}>{item.status}</Text>
      </View>
    );
  };

  const HeaderComponents = () => {
    return (
      <View style={styles.headercomponent}>
        <Image
          defaultSource={Images.userblanck}
          source={
            data && data?.file_path
              ? { uri: data?.file_path }
              : Images.userblanck
          }
          style={styles.headerimage}
        />
      </View>
    );
  };

  return (
    // <SafeAreaView style={{ flex: 1, backgroundColor: color }}>
    <>
      <StatusBar barStyle={"light-content"} backgroundColor={color} />
      {/* <Header
        source={{ uri: logo }}
        tintColor={Colors.primary}
        lefticon={Images.back}
        lefticonclick={() => navigation.goBack()}
      /> */}
      <BlueHeader title={t("Details")} bgcolor={color} />
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
          contentContainerStyle={styles.flatlistcontainer}
          data={DATA}
          renderItem={RenderItem}
          ListHeaderComponent={HeaderComponents}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <Footer />
    </>
    // </SafeAreaView>
  );
};

export default Connectiondetails;

const styles = StyleSheet.create({
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
  name: {
    fontSize: RFValue(15),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    marginTop: 15,
    alignSelf: "center",
  },
  email: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendMedium,
    color: Colors.textgray,
    marginTop: 10,
    alignSelf: "center",
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginTop: RFValue(5),
  },
  logoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: RFValue(25),
    height: 50,
    paddingBottom: 4,
  },
  input: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  main: {
    flex: 1,
  },
  icon: {
    backgroundColor: Colors.iconbg,
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
  },
  img: {
    height: 22,
    width: 22,
    tintColor: Colors.primary,
  },
  text: {
    paddingLeft: 20,
    // backgroundColor:'red'
  },
  text1: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  text2: {
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    marginRight: 50,
  },
  statusbox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
    bottom: 10,
    paddingVertical: 5,
  },
  statusname: {
    color: Colors.white,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  labelstatusbox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 5,
    paddingVertical: 5,
  },
  headercomponent: {
    paddingHorizontal: 24,
    marginTop: 24,
    borderRadius: 7,
    alignItems: "center",
    paddingBottom: 40,
  },
  headerimage: {
    height: 100,
    width: 90,
    alignSelf: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.litegray,
  },
  flatlistcontainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});
