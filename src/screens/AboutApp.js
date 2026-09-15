import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Colors } from "../constants/color";
// import { Image } from 'react-native-svg'
import { Images } from "../constants/images";
// import { Image } from 'react-native-svg'
import { RFValue } from "react-native-responsive-fontsize";
import { WebView } from "react-native-webview";
import { getData } from "../utils/storeData";
import DeviceInfo from "react-native-device-info";
import { heightPercentageToDP } from "react-native-responsive-screen";

const AboutApp = ({ navigation }) => {
  const { width } = Dimensions.get("screen");
  const [name, setName] = useState("");
  const Namecompnt = async () => {
    const company = await getData("COMPANYLOGIN");
    console.log("company", company);
    setName(company);
  };
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    retrieveAppVersion();
  }, []);
  const retrieveAppVersion = async () => {
    try {
      const version = DeviceInfo.getVersion();
      setAppVersion(version);
    } catch (error) {
      console.error("Error retrieving app version:", error);
    }
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.imagebg}
      >
        <Image source={Images.back} style={styles.backimage} />
      </TouchableOpacity>
      <WebView
        source={{
          uri: `https://app.erpportaal.nl/about_app_info/${appVersion}`,
        }}
        style={styles.webview}
      />
      {/* <Image style={[styles.logo, { width: width * 0.5 }]} source={Images.logo} />
      <Text style={{color:Colors.black}}>Version: Beta Release V 1.xxxx</Text>
      <Text style={{color:Colors.black}}>Release date:</Text>
      <Text style={{color:Colors.black}}>Website: www.epportaal.nl</Text> */}
    </View>
  );
};

export default AboutApp;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    flex: 1,
    // marginTop:20
  },
  logo: {
    height: RFValue(29),

    resizeMode: "contain",
    alignSelf: "center",
    marginTop: 150,
  },
  imagebg: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 35,
    width: 35,
    justifyContent: "center",
    alignItems: "center",
    marginTop: heightPercentageToDP(4),
    marginHorizontal: 24,
  },
  backimage: {
    height: 24,
    width: 24,
  },
  webview: {
    marginTop: 20,
  },
});
