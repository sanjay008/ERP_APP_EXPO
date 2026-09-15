import {
  Alert,
  Dimensions,
  Image,
  PermissionsAndroid,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Colors } from "../constants/color";
import { Images } from "../constants/images";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import OTPTextView from "react-native-otp-textinput";
import ButtonComponent from "../components/buttonComponent";
import Geolocation from "@react-native-community/geolocation";
import { getData, storeData } from "../utils/storeData";
import axios from "axios";
import apiConstants from "../api/apiConstants";
import Loader from "../components/loading";
import Input from "../components/input";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
const Otp = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const { register } = route?.params;
  const { login } = route?.params;
  const { userId } = route?.params;
  const { logo } = route?.params;
  const { verify_token } = route?.params;
  const [otp, setotp] = useState("");
  const [otpError, setotpError] = useState("");
  const [timerActive, setTimerActive] = useState(true);
  const [show, setShow] = useState(false);
  const [timer, setTimer] = useState(60);
  const [currentLongitude, setCurrentLongitude] = useState("");
  const [currentLatitude, setCurrentLatitude] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [loading, setLoding] = useState(false);
  const [resendtext, setResendtext] = useState("");

  const handleResendOtp = () => {
    setTimer(60);
    setTimerActive(true);
    setShow(true);
    ResendOtp();
    setTimeout(() => {
      setShow(false);
    }, 2500);
  };

  useEffect(() => {
    let intervalId;
    if (timerActive) {
      intervalId = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer === 0) {
            setTimerActive(false);
            clearInterval(intervalId);
          }
          return prevTimer === 0 ? 0 : prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [timerActive]);

  const onVerify = async () => {
    const auth = await getData("USERDATA");
    console.log("auth", auth);
    if (otp == "" || otp.length < 6) {
      setotpError("Voer OTP in");
    } else {
      try {
        const company = await getData("COMPANYLOGIN");
        const data = await ApiService(apiConstants.Verifyotp, {
          customData: {
            company_login: company,
            user_id: userId,
            otp: otp,
            token: verify_token,
            otp_type:
              register == "true"
                ? "user_register_requests"
                : "mobile_login"
                  ? login == "true"
                    ? "mobile_login"
                    : "user_register_requests"
                  : "",
          },
        });
        if (data.status) {
          storeData("LOGIN", true);
          setTimeout(() => {
            setLoding(false);
          }, 1000);
          if (register == "true") {
            navigation.navigate("Staff", {
              logo: logo,
              userId: userId,
              type: "medewerker",
              typeId: 3,
              verify_token: verify_token,
              category_id: 2,
            });
          } else {
            storeData("AUTH", true);
            storeData("USERDATA", data);
            console.log("otp data.....", data);
            navigation.navigate("BottamScreens1", {
              refresh: Date.now(),
            });
            // navigation.navigate("BottamScreens");
          }
        } else {
          console.log("false");
          setTimeout(() => {
            setLoding(false);
          }, 1000);
          Alert.alert("Oops!", data.message);
        }
      } catch (err) {
        console.log("Error fetching connections:", err);
        setTimeout(() => {
          setLoding(false);
        }, 1000);
      }
    }
  };

  const ResendOtp = async () => {
    try {
      const company = await getData("COMPANYLOGIN");
      const data = await ApiService(apiConstants.resend_otp, {
        customData: {
          company_login: company,
          user_id: userId,
          otp_type:
            register == "true" ? "user_register_requests" : "mobile_login",
        },
      });
      if (data.status) {
        setResendtext(data.message);
        console.log("res.data.....otp", data);
        setTimeout(() => {
          setLoding(false);
        }, 1000);
      } else {
        console.log("false");
        setTimeout(() => {
          setLoding(false);
        }, 1000);
        Alert.alert(data.message);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
      setTimeout(() => {
        setLoding(false);
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.white} barStyle={"dark-content"} />
      {loading && <Loader />}
      <Image
        resizeMode="contain"
        source={logo ? { uri: logo } : Images.logo}
        style={[
          styles.logo,
          {
            width: logo ? width * 0.7 : 260,
            height: logo ? RFValue(50) : 25,
          },
        ]}
      />
      <View style={styles.container}>
        <Text style={styles.wellcome}>{t("verifiëren")}</Text>
        <Text style={styles.dis}>{t("Voer OTP in")}</Text>
        <Input
          value={otp}
          placeholder="*"
          placeholderTextColor={Colors.litegray}
          textInputStyle={styles.input}
          tintColor={Colors.primary}
          onChangeText={(txt) => {
            setotp(txt), setotpError("");
          }}
          keyboardType="numeric"
          maxLength={6}
        />
        <Text style={styles.otperrortext}>{otpError}</Text>
        <ButtonComponent
          onPress={onVerify}
          marginTop={RFValue(30)}
          title={t("verifiëren")}
        />
        {timerActive ? (
          <Text style={styles.resend}>
            {timer < 10 ? `00:0${timer}` : `00:${timer}`}
          </Text>
        ) : (
          <Text
            onPress={handleResendOtp}
            style={[styles.resend, { color: Colors.black }]}
          >
            {t("Opnieuw versturen")}
          </Text>
        )}
        {show ? (
          <Text
            style={[
              styles.resend,
              {
                color: Colors.black,
                fontFamily: FONTS.LexendRegular,
                color: Colors.textgray,
              },
            ]}
          >
            {resendtext}
          </Text>
        ) : (
          ""
        )}
      </View>
    </SafeAreaView>
  );
};

export default Otp;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  wellcome: {
    fontSize: 17,
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.black,
    marginTop: 40,
  },
  dis: {
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: Colors.textgray,
    marginTop: 8,
  },
  logo: {
    alignSelf: "center",
    marginTop: RFValue(40),
  },
  container: {
    paddingHorizontal: 24,
  },
  resend: {
    fontSize: 15,
    fontFamily: FONTS.LexendMedium,
    color: Colors.textgray,
    alignSelf: "center",
    marginTop: RFValue(20),
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 5,
    fontSize: 15,
    borderBottomWidth: 1,
    fontFamily: FONTS.LexendRegular,
    height: 40,
    width: 40,
  },
  iview: { marginTop: RFValue(34), width: "100%" },
  otperrortext: {
    color: Colors.red,
    fontSize: RFValue(10),
    fontFamily: FONTS.LexendRegular,
    marginTop: RFValue(1),
  },
});
