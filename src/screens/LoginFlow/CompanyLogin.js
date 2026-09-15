// import {
//     Alert,
//     BackHandler,
//     Dimensions,
//     Image,
//     Linking,
//     // SafeAreaView,
//     StatusBar,
//     StyleSheet,
//     Text,
//     TextInput,
//     View,
// } from "react-native";
// import React, { useCallback, useContext, useEffect, useState } from "react";
// import { FONTS } from "../../constants/fontFamily";
// import { Images } from "../../constants/images";
// import { Colors } from "../../constants/color";
// import Input from "../../components/input";
// import CheckBox from "react-native-check-box";
// import { RFValue } from "react-native-responsive-fontsize";
// import ButtonComponent from "../../components/buttonComponent";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// import apiConstants from "../../api/apiConstants";
// import { getData, storeData } from "../../utils/storeData";
// import Loader from "../../components/loading";
// import DeviceInfo from "react-native-device-info";
// import { useTranslation } from "react-i18next";
// import { useFocusEffect, useIsFocused } from "@react-navigation/native";
// import CountryPicker from "rn-country-picker";
// import { heightPercentageToDP } from "react-native-responsive-screen";
// import ApiService from "../../utils/Apiservice";
// import { t, use } from "i18next";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useErrorHandle } from "../../components/ErrorHandle";
// import MyCountryPiker from "../../components/CountryPicker";
// import axios from "axios";
// import { RegisterBackContext } from "../../constants/GoBackContext";

// const CompanyLogin = ({ navigation }) => {

//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [commpny, setcommpny] = useState("");
//     const [passwordError, setPasswordError] = useState("");
//     const [emailError, setEmailError] = useState("");
//     const [CompnyError, setCompnyError] = useState("");
//     const [isChecked, setIsChecked] = useState(false);
//     const [show, setShow] = useState(true);
//     const [loading, setLoding] = useState(false);
//     const [logo, setLogo] = useState(null);
//     const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
//     const [appVersion, setAppVersion] = useState("");
//     const [companylogo, setcompanylogo] = useState("");
//     const [countryCode, setCountryCode] = useState("31");
//     const [numbererror, setNumbererror] = useState("");
//     const [step, setStep] = useState(1);
//     const [useEmail, setUseEmail] = useState(false);
//     const { width } = Dimensions.get("screen");
//     const Focused = useIsFocused();
//     const [DefaultBTNDissabled, setDefaultBTNDissabled] = useState(false);
//     const { setToast } = useContext(RegisterBackContext);
//     const [CompanyData, setCompanyData] = useState(null);

//     const { ErrorHandle } = useErrorHandle()
//     const [number, setNumber] = useState("");
//     const selectedValue = (value) => {
//         setCountryCode(value?.callingCode);

//     };

//     const handleTextChange = (txt) => {
//         setNumber(txt);
//         setNumbererror("");
//     };

//     const handleBackPress = useCallback(() => {
//         if (step === 1) {
//             Alert.alert("Hold on!", t("Are you sure you want to exit?"), [
//                 { text: "Cancel", style: "cancel" },
//                 { text: "YES", onPress: () => BackHandler.exitApp() },
//             ]);
//             return true;
//         } else {
//             setStep(prev => prev - 1);
//             return true;
//         }
//     }, [step, t]);

//     useFocusEffect(
//         useCallback(() => {
//             const subscription = BackHandler.addEventListener(
//                 "hardwareBackPress",
//                 handleBackPress
//             );

//             return () => subscription.remove();
//         }, [handleBackPress])
//     );

//     useEffect(() => {
//         if (step == 2) {
//             setStep(1);
//             setEmail("");
//             setNumber("");
//             setEmailError("");
//             setNumbererror("");
//             setcommpny("");
//             setCompnyError("");
//             setcompanylogo("");
//         }
//     }, [Focused]);

//     useEffect(() => {
//         retrieveAppVersion();
//     }, []);

//     const retrieveAppVersion = async () => {
//         // try {
//         //     let code = await getData("country_code");

//         //     const cleanedCode = code ? code.replace("+", "") : "";

//         //     if (code) {
//         //         setCountryCode(cleanedCode);
//         //     }

//         //     const version = DeviceInfo.getVersion();
//         //     setAppVersion(version);

//         // } catch (error) {
//         //     console.error("Error retrieving app version:", error);
//         // }
//     };


//     const openURL = () => {
//         Linking.openURL("https://www.erpportaal.nl/").catch((err) =>
//             console.error("An error occurred", err)
//         );
//     };

//     const onRegisterCompany = async () => {
//         setLoding(true);

//         if (commpny.trim() === "") {
//             setCompnyError(t("Voer bedrijfsnaam in"));
//             setLoding(false);
//             return;
//         } else {
//             try {
//                 const data = await ApiService(apiConstants.companyLogin, {
//                     customData: {
//                         company_login: commpny.trim(),
//                     },
//                 });

//                 if (data?.status) {
//                     setCompanyData(data?.data);
//                     const logoUrl = data.data.default_company.company_logo;
//                     const GOOGLEMAPAPIKEY =
//                         data.data.default_company.erp_google_maps_api_key;
//                     await storeData("COMPANYLOGIN", commpny.trim());
//                     let code = await getData("country_code");
//                     const cleanedCode = code ? code.replace("+", "") : "";
//                     await storeData("GOOGLEMAPAPIKEY", GOOGLEMAPAPIKEY);
//                     await storeData("COMPANYLOGO", logoUrl);
//                     console.log("companydata", data);
//                     setCountryCode(data?.data?.default_company?.country_codes || "31")
//                     setcompanylogo(logoUrl);
//                     setLogo(logoUrl);
//                     setStep(2);
//                 } else {
//                     setCompnyError(t("Voer een geldige bedrijfsnaam in"));
//                 }
//             } catch (err) {
//                 setToast({
//                     visible: true,
//                     text: ErrorHandle(err)?.message || t("Something Wrong"),
//                     type: 'error',
//                     top: 45,
//                 });
//                 console.log(err);

//             } finally {
//                 setLoding(false);
//             }
//         }
//     };
//     const onLogin = async () => {
//         if (useEmail && !email?.trim()) {
//             setEmailError(t("Voer Email in"));
//             setNumber("");
//             setLoding(false);
//             return;
//         }

//         if (!useEmail && !number?.trim()) {
//             setNumbererror(t("Voer nummer in"));
//             setEmail("")
//             setLoding(false);
//             return;
//         }

//         setLoding(true);
//         try {
//             const company = await getData("COMPANYLOGIN");
//             const data = await ApiService(apiConstants.login_new, {
//                 customData: {
//                     email: useEmail ? email.trim() : "",
//                     company_login: company,
//                     whatsapp_number: useEmail ? "" : number.trim(),
//                     country_code: countryCode,
//                 },
//             });

//             if (data?.status) {
//                 if (data.data.user.enable_2fa == 1) {
//                     navigation.navigate("NewOtp", {
//                         login: "true",
//                         logo: logo,
//                         verify_token: data.data.user.verify_token,
//                         userId: data.data.user.id,
//                         other_data: data?.data?.type,
//                         useEmail
//                     });
//                 } else if (data.data.user.enable_2fa == 0) {
//                     navigation.navigate("NewPassword", {
//                         logo: logo,
//                         verify_token: data.data.user.verify_token,
//                         login_company: data.data.user.login_company,
//                         email: data.data.user.email,
//                         number: data.data.user.whatsapp_number,
//                         other_data: data?.data?.type
//                     });
//                 } else {
//                     storeData("AUTH", true);
//                     navigation.dispatch(
//                         CommonActions.reset({
//                             index: 0,
//                             routes: [{ name: "BottamScreens1" }],
//                         })
//                     );
//                 }
//             } else {
//                 setToast({
//                     visible: true,
//                     text: data?.message || t("Something Wrong"),
//                     type: 'error',
//                     top: 45,
//                 });
//             }
//         } catch (error) {
//             if (axios?.isAxiosError(error)) {
//                 setToast({
//                     visible: true,
//                     text: error?.response?.data.message || t("Something Wrong"),
//                     type: 'error',
//                     top: 45,
//                 });
//             }
//         } finally {
//             setLoding(false);
//         }
//     };


//     const isValidEmail = (email) => {
//         const value = email?.trim().toLowerCase();
//         const regex =
//             /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
//         return regex.test(value);
//     };
//     const normalizeCountryCode = (code) => {
//         if (!code) return "";
//         return "+" + code.replace(/[^\d]/g, "");
//     };

//     useEffect(() => {
//         if (step !== 2) return;

//         const cc = normalizeCountryCode(countryCode);

//         if (!useEmail) {

//             if (cc === "+31" && number.length === 0) {
//                 setNumber("06");
//                 return;
//             }


//             if (cc !== "+31" && number === "06") {
//                 setNumber("");
//             }

//         }
//         else {

//             const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//             const isValid = emailRegex.test(email.trim());

//             setDefaultBTNDissabled(!isValid);
//             setEmailError(isValid ? "" : "");
//         }
//     }, [step, countryCode, email, useEmail]);

//     useEffect(() => {
//         if (!useEmail) {
//             let valid = isPhoneValidForButton(countryCode, number)
//             setDefaultBTNDissabled(valid)
//         } else {
//             let valid = isValidEmail(email)
//             setDefaultBTNDissabled(valid)

//         }
//     }, [number, countryCode, useEmail, email])

//     const isPhoneValidForButton = (countryCode, phone) => {
//         const digits = phone?.replace(/[^0-9]/g, "");

//         switch (countryCode) {
//             case "31":
//             case "+31":
//                 return digits.length >= 9 && digits.length <= 10;

//             case "91":
//             case "+91":
//                 return digits.length == 10;

//             case "597":
//             case "+597":
//                 return digits.length == 7;

//             default:
//                 // other countries → no validation
//                 return true;
//         }
//     };
//     return (
//         <SafeAreaView style={styles.safe}>
//             <StatusBar backgroundColor={Colors.white} barStyle={"dark-content"} />
//             {loading && <Loader />}
//             <KeyboardAwareScrollView
//                 bounces={false}
//                 enableOnAndroid
//                 extraScrollHeight={70}
//                 keyboardShouldPersistTaps="handled"
//                 style={styles.subContainer}
//             >
//                 <Image source={companylogo ? { uri: companylogo } : Images.roundlogo}
//                     resizeMode="contain"
//                     style={[

//                         styles.logo,
//                         companylogo && {
//                             width: companylogo ? width * 0.7 : 260,
//                             height: companylogo ? RFValue(60) : 25,
//                         },

//                     ]} />

//                 <View style={styles.container}>
//                     <Text style={styles.wellcome}>{t("Welkom bij ERP Portaal")}</Text>
//                     <Text style={styles.dis}>
//                         {t("Smart Solutions for Modern Businesses")}
//                     </Text>
//                 </View>
//                 <View
//                     style={{ justifyContent: "center", flex: 1, paddingHorizontal: 20, marginTop: 20 }}
//                 >
//                     <>
//                         {step === 1 && (
//                             <Input
//                                 value={commpny}
//                                 onChangeText={(txt) => {
//                                     setcommpny(txt);
//                                     setCompnyError("");
//                                 }}
//                                 title={t("Bedrijfsnaam")}
//                                 error={CompnyError}
//                                 iconSource={Images.company}
//                                 autoCapitalize="none"
//                             />
//                         )}
//                         {step === 2 && (
//                             <>
//                                 {!useEmail ? (
//                                     <>
//                                         <Text style={styles.title}>{t("WhatsApp nummer")}</Text>

//                                         <MyCountryPiker
//                                          defaultCountry={countryCode}
//                                             favorites={["IN", "NL", "SR"]}
//                                             key={countryCode}
//                                             onSelect={(country) => {
//                                                 setCountryCode(country?.countrycode)
//                                                 setNumber("")
//                                             }}
//                                             showFlag={true}
//                                             setValue={setNumber}
//                                             value={number}
//                                             showCallingCode={true}
//                                             showPhoneInput={true}
//                                             FontFamily={FONTS.LexendMedium}
//                                             ContainerStyle={{ backgroundColor: Colors.white }}
//                                         />
//                                         <Text style={styles.error}>{numbererror}</Text>

//                                         {/* Switch to Email */}
//                                         <Text
//                                             style={{
//                                                 color: Colors.primary,
//                                                 fontFamily: FONTS.LexendSemiBold,
//                                                 marginTop: RFValue(10),
//                                                 alignSelf: "center",
//                                             }}
//                                             onPress={() => setUseEmail(true)}
//                                         >
//                                             {t("Login Met E-mail Adres")}
//                                         </Text>
//                                     </>
//                                 ) : (
//                                     <>
//                                         <Input
//                                             value={email}
//                                             onChangeText={(txt) => {
//                                                 setEmail(txt);
//                                                 setEmailError("");
//                                             }}
//                                             title={"E-mail"}
//                                             iconSource={Images.mail}
//                                             error={emailError}
//                                         />

//                                         {/* Switch back to WhatsApp */}
//                                         <Text
//                                             style={{
//                                                 color: Colors.primary,
//                                                 fontFamily: FONTS.LexendSemiBold,
//                                                 marginTop: RFValue(10),
//                                                 alignSelf: "center",
//                                             }}
//                                             onPress={() => setUseEmail(false)}
//                                         >
//                                             {t("Login Met WhatsApp Nummer")}
//                                         </Text>
//                                     </>
//                                 )}
//                             </>
//                         )}

//                         <ButtonComponent
//                             disabled={!DefaultBTNDissabled && step == 2}
//                             backgroundColor={!DefaultBTNDissabled && step == 2 ? Colors.Boxgray : Colors.primary}
//                             marginTop={20}
//                             onPress={() => {

//                                 if (step === 1) {
//                                     onRegisterCompany();
//                                 } else {
//                                     onLogin();
//                                     console.log("login");

//                                 }
//                             }}
//                             title={step === 1 ? t("Inloggen") : t("Inloggen")}
//                         />
//                     </>
//                 </View>
//             </KeyboardAwareScrollView>
//             <View
//                 style={{
//                     position: "absolute",
//                     bottom: 70,

//                     width: "90%",
//                     alignSelf: "center",
//                 }}
//             >
//                 <Text style={styles.dis}>
//                     {t("Release V")}
//                     {appVersion}
//                 </Text>
//                 <Text
//                     onPress={openURL}
//                     style={[styles.dis, { marginTop: 5, color: Colors.primary }]}
//                 >
//                     www.erpportaal.nl
//                 </Text>
//             </View>
//         </SafeAreaView>
//     );
// };

// export default CompanyLogin;

// const styles = StyleSheet.create({
//     safe: {
//         flex: 1,
//         backgroundColor: Colors.white,
//         paddingTop: 25
//     },
//     wellcome: {
//         fontSize: RFValue(17),
//         fontFamily: FONTS.LexendSemiBold,
//         color: Colors.black,
//         marginTop: 10,
//         alignSelf: "center",
//     },
//     dis: {
//         fontSize: RFValue(14),
//         fontFamily: FONTS.LexendRegular,
//         color: Colors.textgray,
//         marginTop: 8,
//         alignSelf: "center",
//     },
//     logo: {
//         height: 100,
//         width: 100,
//         alignSelf: "center",
//         marginTop: RFValue(10),
//     },
//     container: {
//         paddingHorizontal: 24,
//     },
//     keep: {
//         fontSize: RFValue(12),
//         fontFamily: FONTS.LexendRegular,
//         color: Colors.black,
//         marginLeft: 10,
//     },
//     checkView: {
//         flexDirection: "row",
//         alignItems: "center",
//         marginTop: RFValue(20),
//     },
//     fpassword: {
//         fontSize: RFValue(15),
//         fontFamily: FONTS.LexendMedium,
//         color: Colors.black,
//         alignSelf: "center",
//         marginTop: RFValue(12),
//     },
//     subContainer: {
//         flex: 1,
//     },

//     country: {
//         height: RFValue(45),
//         alignItems: "center",
//         flexDirection: "row",
//         marginTop: RFValue(5),
//         backgroundColor: Colors.white,
//         borderRadius: 10,
//         borderColor: Colors.litegray,
//         borderWidth: 1,
//     },
//     pickerTitleStyle: {
//         justifyContent: "center",
//         flexDirection: "row",
//         alignSelf: "center",
//         fontWeight: "bold",
//         color: Colors.black,
//         fontFamily: FONTS.LexendRegular,
//     },
//     pickerStyle: {
//         // marginLeft: 20,
//         height: heightPercentageToDP(6),
//         // borderColor: "#303030",
//         borderColor: Colors.white,
//         alignItems: "center",
//         backgroundColor: Colors.white,
//         borderRadius: 10,
//         fontSize: 16,
//         color: Colors.black,
//         fontFamily: FONTS.LexendRegular,
//     },
//     selectedCountryTextStyle: {
//         paddingLeft: 5,
//         textAlign: "right",
//         color: Colors.black,
//         fontFamily: FONTS.LexendRegular,
//         fontSize: RFValue(12),
//     },

//     countryNameTextStyle: {
//         paddingLeft: 10,
//         textAlign: "right",
//         color: Colors.black,
//         fontFamily: FONTS.LexendRegular,
//     },

//     searchBarStyle: {
//         fontFamily: FONTS.LexendRegular,
//         color: Colors.black,
//     },
//     title: {
//         fontSize: RFValue(13),
//         fontFamily: FONTS.LexendMedium,
//         color: Colors.black,
//         marginTop: RFValue(5),
//     },
//     error: {
//         color: Colors.red,
//         fontSize: RFValue(10),
//         fontFamily: FONTS.LexendRegular,
//         marginTop: RFValue(1),
//     },
//     input: {
//         color: Colors.black,
//         fontFamily: FONTS.LexendRegular,
//         width: "69%",
//         height: heightPercentageToDP(7),
//         // backgroundColor:'red',
//         right: 20,
//     },
//     loginwithemail: {
//         color: Colors.primary,
//         fontFamily: FONTS.LexendSemiBold,
//         marginTop: RFValue(10),
//         alignSelf: "center",
//     },
//     loginwithphone: {
//         color: Colors.primary,
//         fontFamily: FONTS.LexendSemiBold,
//         marginTop: RFValue(10),
//         alignSelf: "center",
//     },
// });
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  Dimensions,
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { RFValue } from "react-native-responsive-fontsize";
import axios from "axios";
import DeviceInfo from "react-native-device-info";
import { useFocusEffect, useIsFocused, CommonActions } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { FONTS } from "../../constants/fontFamily";
import { Images } from "../../constants/images";
import { Colors } from "../../constants/color";
import Input from "../../components/input";
import ButtonComponent from "../../components/buttonComponent";
import Loader from "../../components/loading";
import apiConstants from "../../api/apiConstants";
import { getData, storeData } from "../../utils/storeData";
import ApiService from "../../utils/Apiservice";
import { useErrorHandle } from "../../components/ErrorHandle";
import MyCountryPiker from "../../components/CountryPicker";
import { RegisterBackContext } from "../../constants/GoBackContext";

const CompanyLogin = ({ navigation }) => {
  const { t } = useTranslation();
  const { ErrorHandle } = useErrorHandle();
  const { setToast } = useContext(RegisterBackContext);

  const Focused = useIsFocused();
  const { width } = Dimensions.get("screen");

  const [email, setEmail] = useState("");
  const [commpny, setcommpny] = useState("");
  const [emailError, setEmailError] = useState("");
  const [CompnyError, setCompnyError] = useState("");
  const [loading, setLoding] = useState(false);

  const [logo, setLogo] = useState(null);
  const [companylogo, setcompanylogo] = useState("");
  const [countryCode, setCountryCode] = useState("31");
  const [numbererror, setNumbererror] = useState("");
  const [number, setNumber] = useState("");

  const [step, setStep] = useState(1);
  const [useEmail, setUseEmail] = useState(false);
  const [DefaultBTNDissabled, setDefaultBTNDissabled] = useState(false);

  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    const version = DeviceInfo.getVersion();
    setAppVersion(version);
  }, []);

  const openURL = () => {
    Linking.openURL("https://www.erpportaal.nl/").catch(() => {});
  };

  const normalizeCountryCode = (code) => {
    if (!code) return "";
    return "+" + String(code).replace(/[^\d]/g, "");
  };

  const isValidEmail = (value) => {
    const v = value?.trim().toLowerCase();
    const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return re.test(v);
  };

  const isPhoneValidForButton = (cc, phone) => {
    const digits = phone?.replace(/[^0-9]/g, "");

    switch (cc) {
      case "31":
      case "+31":
        return digits.length >= 9 && digits.length <= 10;
      case "91":
      case "+91":
        return digits.length === 10;
      case "597":
      case "+597":
        return digits.length === 7;
      default:
        return true;
    }
  };

  const clearStep2State = () => {
    setEmail("");
    setNumber("");
    setEmailError("");
    setNumbererror("");
    setUseEmail(false);
  };

  const resetAll = () => {
    setEmail("");
    setNumber("");
    setEmailError("");
    setNumbererror("");
    setcommpny("");
    setCompnyError("");
    setcompanylogo("");
    setLogo(null);
    setCountryCode("31");
    setUseEmail(false);
    setStep(1);
  };

  const handleBackPress = useCallback(() => {
    if (step === 1) {
      Alert.alert("Hold on!", t("Are you sure you want to exit?"), [
        { text: "Cancel", style: "cancel" },
        { text: "YES", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    }
    setStep(1);
    clearStep2State();
    return true;
  }, [step, t]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
      return () => subscription.remove();
    }, [handleBackPress])
  );

  useEffect(() => {
    if (step === 2) return;
    setcompanylogo("");
    setLogo(null);
  }, [step]);

  useEffect(() => {
    if (!Focused) return;
    if (step === 2) {
      setStep(1);
      resetAll();
    }
  }, [Focused]);

  useEffect(() => {
    if (step !== 2) return;

    const cc = normalizeCountryCode(countryCode);

    if (!useEmail) {
      if (cc === "+31" && number.length === 0) {
        setNumber("06");
        return;
      }
      if (cc !== "+31" && number === "06") {
        setNumber("");
      }
    }
  }, [step, countryCode, useEmail]);

  useEffect(() => {
    if (step !== 2) return;

    if (!useEmail) {
      setDefaultBTNDissabled(isPhoneValidForButton(countryCode, number));
    } else {
      setDefaultBTNDissabled(isValidEmail(email));
    }
  }, [step, number, countryCode, useEmail, email]);

  const onRegisterCompany = async () => {
    setLoding(true);

    if (commpny.trim() === "") {
      setCompnyError(t("Voer bedrijfsnaam in"));
      setLoding(false);
      return;
    }

    try {
      const data = await ApiService(apiConstants.companyLogin, {
        customData: {
          company_login: commpny?.trim(),
        },
      });

      if (data?.status) {
        const logoUrl = data?.data?.default_company?.company_logo;
        const GOOGLEMAPAPIKEY = data?.data?.default_company?.erp_google_maps_api_key;

        await storeData("COMPANYLOGIN", commpny.trim());
        await storeData("GOOGLEMAPAPIKEY", GOOGLEMAPAPIKEY);
        await storeData("COMPANYLOGO", logoUrl);

        setCountryCode(data?.data?.default_company?.country_codes || "31");
        setcompanylogo(logoUrl || "");
        setLogo(logoUrl || null);
        setStep(2);
      } else {
        setCompnyError(t("Voer een geldige bedrijfsnaam in"));
      }
    } catch (err) {
      setToast({
        visible: true,
        text: ErrorHandle(err)?.message || t("Something Wrong"),
        type: "error",
        top: 45,
      });
    } finally {
      setLoding(false);
    }
  };

  const onLogin = async () => {
    if (useEmail && !email?.trim()) {
      setEmailError(t("Voer Email in"));
      setNumber("");
      setLoding(false);
      return;
    }

    if (!useEmail && !number?.trim()) {
      setNumbererror(t("Voer nummer in"));
      setEmail("");
      setLoding(false);
      return;
    }

    setLoding(true);

    try {
      const company = await getData("COMPANYLOGIN");

      const data = await ApiService(apiConstants.login_new, {
        customData: {
          email: useEmail ? email.trim() : "",
          company_login: company,
          whatsapp_number: useEmail ? "" : number?.trim(),
          country_code: countryCode,
        },
      });

      if (data?.status) {
        if (data?.data?.user?.enable_2fa == 1) {
          navigation.navigate("NewOtp", {
            login: "true",
            logo: logo,
            verify_token: data?.data?.user?.verify_token,
            userId: data?.data?.user?.id,
            other_data: data?.data?.type,
            useEmail,
          });
        } else if (data?.data?.user?.enable_2fa == 0) {
          navigation.navigate("NewPassword", {
            logo: logo,
            verify_token: data?.data?.user?.verify_token,
            login_company: data?.data?.user?.login_company,
            email: data?.data?.user?.email,
            number: data?.data?.user?.whatsapp_number,
            other_data: data?.data?.type,
          });
        } else {
          storeData("AUTH", true);
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "BottamScreens1" }],
            })
          );
        }
      } else {
        setToast({
          visible: true,
          text: data?.message || t("Something Wrong"),
          type: "error",
          top: 45,
        });
      }
    } catch (error) {
      if (axios?.isAxiosError(error)) {
        setToast({
          visible: true,
          text: error?.response?.data?.message || t("Something Wrong"),
          type: "error",
          top: 45,
        });
      } else {
        setToast({
          visible: true,
          text: t("Something Wrong"),
          type: "error",
          top: 45,
        });
      }
    } finally {
      setLoding(false);
    }
  };

  const showCompanyLogo = step === 2;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.white} barStyle={"dark-content"} />
      {loading && <Loader />}

      <KeyboardAwareScrollView
        bounces={false}
        enableOnAndroid
        extraScrollHeight={70}
        keyboardShouldPersistTaps="handled"
        style={styles.subContainer}
      >
        {showCompanyLogo ? (
          <Image
            source={companylogo ? { uri: companylogo } : Images.roundlogo}
            resizeMode="contain"
            style={[
              styles.logo,
              companylogo && {
                width: width * 0.7,
                height: RFValue(60),
              },
            ]}
          />
        ) : (
          <Image source={Images.roundlogo} resizeMode="contain" style={styles.logo} />
        )}

        <View style={styles.container}>
          <Text style={styles.wellcome}>{t("Welkom bij ERP Portaal")}</Text>
          <Text style={styles.dis}>{t("Smart Solutions for Modern Businesses")}</Text>
        </View>

        <View style={{ justifyContent: "center", flex: 1, paddingHorizontal: 20, marginTop: 20 }}>
          <>
            {step === 1 && (
              <Input
                value={commpny}
                onChangeText={(txt) => {
                  setcommpny(txt);
                  setCompnyError("");
                }}
                title={t("Bedrijfsnaam")}
                error={CompnyError}
                iconSource={Images.company}
                autoCapitalize="none"
              />
            )}

            {step === 2 && (
              <>
                <View style={styles.topActions}>
                  <Text style={styles.backText} onPress={handleBackPress}>
                    {t("Back")}
                  </Text>
                </View>

                {!useEmail ? (
                  <>
                    <Text style={styles.title}>{t("WhatsApp nummer")}</Text>

                    <MyCountryPiker
                      defaultCountry={countryCode}
                      favorites={["IN", "NL", "SR"]}
                      key={countryCode}
                      onSelect={(country) => {
                        setCountryCode(country?.countrycode);
                        setNumber("");
                      }}
                      showFlag={true}
                      setValue={setNumber}
                      value={number}
                      showCallingCode={true}
                      showPhoneInput={true}
                      FontFamily={FONTS.LexendMedium}
                      ContainerStyle={{ backgroundColor: Colors.white }}
                    />

                    <Text style={styles.error}>{numbererror}</Text>

                    <Text
                      style={styles.switchText}
                      onPress={() => {
                        setUseEmail(true);
                        setEmailError("");
                        setNumbererror("");
                      }}
                    >
                      {t("Login Met E-mail Adres")}
                    </Text>
                  </>
                ) : (
                  <>
                    <Input
                      value={email}
                      onChangeText={(txt) => {
                        setEmail(txt);
                        setEmailError("");
                      }}
                      title={"E-mail"}
                      iconSource={Images.mail}
                      error={emailError}
                    />

                    <Text
                      style={styles.switchText}
                      onPress={() => {
                        setUseEmail(false);
                        setEmailError("");
                        setNumbererror("");
                      }}
                    >
                      {t("Login Met WhatsApp Nummer")}
                    </Text>
                  </>
                )}
              </>
            )}

            <ButtonComponent
              disabled={!DefaultBTNDissabled && step == 2}
              backgroundColor={!DefaultBTNDissabled && step == 2 ? Colors.Boxgray : Colors.primary}
              marginTop={20}
              onPress={() => {
                if (step === 1) {
                  onRegisterCompany();
                } else {
                  onLogin();
                }
              }}
              title={step === 1 ? t("Inloggen") : t("Inloggen")}
            />
          </>
        </View>
      </KeyboardAwareScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 70,
          width: "90%",
          alignSelf: "center",
        }}
      >
        <Text style={styles.dis}>
          {t("Release V")}
          {appVersion}
        </Text>
        <Text onPress={openURL} style={[styles.dis, { marginTop: 5, color: Colors.primary }]}>
          www.erpportaal.nl
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default CompanyLogin;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 25,
  },
  wellcome: {
    fontSize: RFValue(17),
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.black,
    marginTop: 10,
    alignSelf: "center",
  },
  dis: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.textgray,
    marginTop: 8,
    alignSelf: "center",
  },
  logo: {
    height: 100,
    width: 100,
    alignSelf: "center",
    marginTop: RFValue(10),
  },
  container: {
    paddingHorizontal: 24,
  },
  subContainer: {
    flex: 1,
  },
  title: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    marginTop: RFValue(5),
  },
  error: {
    color: Colors.red,
    fontSize: RFValue(10),
    fontFamily: FONTS.LexendRegular,
    marginTop: RFValue(1),
  },
  switchText: {
    color: Colors.primary,
    fontFamily: FONTS.LexendSemiBold,
    marginTop: RFValue(10),
    alignSelf: "center",
  },
  topActions: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: RFValue(8),
  },
  backText: {
    color: Colors.primary,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: RFValue(12),
  },
});
