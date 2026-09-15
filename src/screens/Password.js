import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import Input from "../components/input";
import ButtonComponent from "../components/buttonComponent";
import axios from "axios";
import apiConstants from "../api/apiConstants";
import Loader from "../components/loading";
import { Images } from "../constants/images";
import { getData, storeData } from "../utils/storeData";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";

const Password = ({ route, navigation }) => {
  const { logo } = route?.params;
  const { login_company } = route.params;
  const { email } = route.params;
  const { userId } = route?.params;
  const { width } = Dimensions.get("screen");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(true);
  const { t } = useTranslation();
  const passwordRegex = /^(?=.*[a-zA-Z]).*$/;

  const onVerify = () => {
    if (!password) {
      setPasswordError(t("Please enter your password"));
    } else if (!passwordRegex.test(password)) {
      setPasswordError(t("Password must include at least letter "));
    } else {
      setPasswordError("");
      onLogin();
    }
  };

  const onLogin = async () => {
    setLoading(true);
    try {
      const data = await ApiService(apiConstants.Login, {
        customData: {
          password: password,
          company_login: login_company,
          email: email,
        },
      });
      console.log(data);

      if (data.status) {
        setLoading(false);
        console.log("password successful");
        storeData("USERDATA", data);
        storeData("AUTH", true);
        navigation.navigate("BottamScreens1");
        // navigation.navigate("BottamScreens");
      } else {
        setLoading(false);
        Alert.alert("Oops!", data.message, [
          { text: "OK", onPress: () => console.log("OK Pressed") },
        ]);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.white} barStyle={"dark-content"} />
      {loading && <Loader color={Colors.pink} />}
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
        <Text style={styles.welcome}>{t("Password Verification")}</Text>
        <Text style={styles.description}>{t("Enter your password")}</Text>

        <Input
          value={password}
          onChangeText={(txt) => {
            setPassword(txt), setPasswordError("");
          }}
          iconSource={Images.lock}
          secureTextEntry={show ? true : false}
          rightIcon={show ? Images.eyeoff : Images.eye}
          onPress={() => setShow(!show)}
          color={Colors.black}
          error={passwordError}
        />

        <ButtonComponent
          onPress={onVerify}
          marginTop={RFValue(30)}
          title={t("Verify")}
        />
      </View>
    </SafeAreaView>
  );
};

export default Password;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  welcome: {
    fontSize: 17,
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.black,
    marginTop: 40,
  },
  description: {
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: Colors.textgray,
    marginTop: 8,
  },
  container: {
    paddingHorizontal: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 5,
    fontSize: 15,
    borderBottomWidth: 1,
    fontFamily: FONTS.LexendRegular,
    height: 40,
    width: "100%",
  },
  errorText: {
    color: Colors.red,
    fontSize: RFValue(10),
    fontFamily: FONTS.LexendRegular,
    marginTop: RFValue(1),
  },
  logo: {
    alignSelf: "center",
    marginTop: RFValue(40),
  },
});
