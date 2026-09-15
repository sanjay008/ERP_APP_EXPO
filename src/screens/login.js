
import {
    Alert,
    BackHandler,
    Dimensions,
    Image,
    Linking,
    // SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { FONTS } from "../constants/fontFamily";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";
import Input from "../components/input";
import CheckBox from "react-native-check-box";
import { RFValue } from "react-native-responsive-fontsize";
import ButtonComponent from "../components/buttonComponent";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import apiConstants from "../api/apiConstants";
import { getData, storeData } from "../utils/storeData";
import Loader from "../components/loading";
import DeviceInfo from "react-native-device-info";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import CountryPicker from "rn-country-picker";
import { heightPercentageToDP } from "react-native-responsive-screen";
import ApiService from "../utils/Apiservice";
import { use } from "i18next";
import { SafeAreaView } from "react-native-safe-area-context";

const CompanyLogin = ({ navigation }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [commpny, setcommpny] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [CompnyError, setCompnyError] = useState("");
    const [isChecked, setIsChecked] = useState(false);
    const [show, setShow] = useState(true);
    const [loading, setLoding] = useState(false);
    const [logo, setLogo] = useState(null);
    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    const [appVersion, setAppVersion] = useState("");
    const [companylogo, setcompanylogo] = useState("");
    const [countryCode, setCountryCode] = useState("31");
    const [numbererror, setNumbererror] = useState("");
    const [step, setStep] = useState(1); // 1 = company, 2 = login
    const [useEmail, setUseEmail] = useState(false); // false = whatsapp, true = email
    const { width } = Dimensions.get("screen");


    const [number, setNumber] = useState("");
    const selectedValue = (value) => {
        setCountryCode(value?.callingCode);
        // console.log(value?.callingCode, "jsudhcousdhfcnos=-=-=-=");
    };

    const handleTextChange = (txt) => {
        setNumber(txt);
        setNumbererror("");
    };

    const handleBackPress = useCallback(() => {
        Alert.alert("Hold on!", t("Are you sure you want to exit?"), [
            {
                text: "Cancel",
                onPress: () => null,
                style: "cancel",
            },
            { text: "YES", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
    }, []);

    useFocusEffect(
        useCallback(() => {
            BackHandler.addEventListener("hardwareBackPress", handleBackPress);
            return () => {
                BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
            };
        }, [handleBackPress])
    );
    useFocusEffect(
        useCallback(() => {

            setStep(1);
        }, [])
    );

    useEffect(() => {
        retrieveAppVersion();
    }, []);

    const retrieveAppVersion = async () => {
        try {
            const version = DeviceInfo.getVersion();
            console.log("vaersion name ", version);
            setAppVersion(version);
        } catch (error) {
            console.error("Error retrieving app version:", error);
        }
    };

    const openURL = () => {
        Linking.openURL("https://www.erpportaal.nl/").catch((err) =>
            console.error("An error occurred", err)
        );
    };

    const onRegisterCompany = async () => {
        setLoding(true);

        if (commpny === "") {
            setCompnyError(t("Voer bedrijfsnaam in"));
            setLoding(false);
            return;
        } else {
            try {
                const data = await ApiService(apiConstants.companyLogin, {
                    customData: {
                        company_login: commpny,
                    },
                });
                console.log(data);

                if (data.status) {
                    setLoding(false);
                    const logoUrl = data.data.default_company.company_logo;
                    const GOOGLEMAPAPIKEY =
                        data.data.default_company.erp_google_maps_api_key;
                    storeData("COMPANYLOGIN", commpny);
                    storeData("GOOGLEMAPAPIKEY", GOOGLEMAPAPIKEY);
                    storeData("COMPANYLOGO", logoUrl);
                    setcompanylogo(logoUrl);
                    setLogo(logoUrl);

                    //   setTimeout(() => {
                    setLoding(false);
                    setStep(2);
                    //   }, 1000);
                } else {
                    setLoding(false);
                    setCompnyError(t("Voer een geldige bedrijfsnaam in"));
                }
            } catch (err) {
                // setCompnyError(t("Voer een geldige bedrijfsnaam in"));
                console.log("Error fetching connections:", err);
                setTimeout(() => {
                    setLoding(false);
                }, 1000);
            }
        }
    };
    const onLogin = async () => {
        setLoding(true);
        if (useEmail) {
            if (email == "") {
                setEmailError(t("Voer Email in"));
                setLoding(false);
                return;
            }
        } else {
            if (number == "") {
                setNumbererror(t("Voer nummer in"));
                setLoding(false);
                return;
            }
        }
        try {
            const company = await getData("COMPANYLOGIN");
            const data = await ApiService(apiConstants.emailmobilelogin, {
                customData: {
                    email: email,
                    company_login: company,
                    whatsapp_number: number,
                    country_code: countryCode,
                },
            });
            console.log('data', data);

            if (data.status) {
                storeData("USERDATA", data);

                if (data.data.user.enable_2fa == 1) {
                    setTimeout(() => {
                        setLoding(false);
                    }, 1000);
                    navigation.navigate("NewOtp", {
                        login: "true",
                        logo: logo,
                        verify_token: data.data.user.verify_token,
                        userId: data.data.user.id,
                    });
                } else if (data.data.user.enable_2fa == 0) {
                    setTimeout(() => {
                        setLoding(false);
                    }, 1000);
                    navigation.navigate("NewPassword", {
                        logo: logo,
                        verify_token: data.data.user.verify_token,
                        login_company: data.data.user.login_company,
                        email: data.data.user.email,
                        number: data.data.user.whatsapp_number,
                    });
                } else {
                    setTimeout(() => {
                        setLoding(false);
                    }, 1000);
                    storeData("AUTH", true);
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            // routes: [{ name: "BottamScreens" }],
                            routes: [{ name: "BottamScreens1" }],
                        })
                    );
                    // navigation.replace("BottamScreens1");
                    // navigation.replace("BottamScreens");
                }
            } else {



                setTimeout(() => {
                    setLoding(false);
                }, 1000);

                if (data.status_code === 400) {
                    if (!useEmail) {
                        onRegisterNumber();
                    } else {
                        Alert.alert(
                            "Oops!",
                            `${data.message}\nPlease enter a phone number`,
                            [{ text: "OK", onPress: () => setUseEmail(false) }]
                        );
                    }
                }

            }
        } catch (err) {
            console.log("Error fetching connections:", err);
            Alert.alert("Error", err.message || "Something went wrong");
            setTimeout(() => {
                setLoding(false);
            }, 1000);
        }
    };



    const onRegisterNumber = async () => {
        setLoding(true);
        if (number == "") {
            setNumbererror(t("Voer nummer in"));
            setLoding(false);
            return;
        } else {
            try {
                const company = await getData("COMPANYLOGIN");
                const data = await ApiService(apiConstants.register, {
                    customData: {
                        company_login: company,
                        whatsapp_number: number,
                        country_code: countryCode,
                    },
                });
                console.log(data, 'dataregister');

                if (data.status) {
                    storeData("USERDATA", data);
                    // setTimeout(() => {
                    setLoding(false);

                    navigation.navigate("Otp", {
                        register: "true",
                        logo: logo,
                        userId: data.data.id,
                        verify_token: data.data.verify_token,
                    });
                    setNumber("");
                    // }, 1000);
                } else {
                    setTimeout(() => {
                        setLoding(false);
                    }, 1000);
                    Alert.alert("Oops!", data.message, [
                        { text: "OK", onPress: () => console.log("OK Pressed") },
                    ]);

                }
            } catch (err) {
                console.log("Error fetching connections:", err);
                setTimeout(() => {
                    setLoding(false);
                }, 1000);
            }
        }
    };

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
                <Image source={companylogo ? { uri: companylogo } : Images.roundlogo}
                    style={[
                        styles.logo,
                        companylogo && {
                            width: companylogo ? width * 0.7 : 260,
                            height: companylogo ? RFValue(50) : 25,
                        },
                    ]} />

                <View style={styles.container}>
                    <Text style={styles.wellcome}>{t("Welkom bij ERP Portaal")}</Text>
                    <Text style={styles.dis}>
                        {t("Smart Solutions for Modern Businesses")}
                    </Text>
                </View>
                <View
                    style={{ justifyContent: "center", flex: 1, paddingHorizontal: 20, marginTop: 20 }}
                >
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
                                {!useEmail ? (
                                    <>
                                        <Text style={styles.title}>{t("WhatsApp nummer")}</Text>
                                        <View style={styles.country}>
                                            <CountryPicker
                                                countryFlagStyle={{
                                                    height: 20,
                                                    width: 28,
                                                    marginRight: 2,
                                                }}
                                                disable={false}
                                                animationType={"slide"}
                                                language="en"
                                                pickerContainerStyle={[styles.pickerStyle]} //
                                                pickerTitleStyle={styles.pickerTitleStyle}
                                                dropDownIcon={Images.down} //
                                                selectedCountryTextStyle={
                                                    styles.selectedCountryTextStyle
                                                }
                                                dropDownIconStyle={{ tintColor: Colors.black }}
                                                countryNameTextStyle={styles.countryNameTextStyle}
                                                searchBarPlaceHolder={t("Selecteer land")} //
                                                hideCountryFlag={false}
                                                hideCountryCode={false}
                                                searchBarContainerStyle={styles.searchBarStyle} //
                                                searchInputStyle={{ color: Colors.black }}
                                                countryCode={countryCode} //
                                                selectedValue={selectedValue} //
                                            />
                                            <TextInput
                                                value={number}
                                                onChangeText={handleTextChange}
                                                placeholder={t("WhatsApp nummer")}
                                                keyboardType="number-pad"
                                                style={styles.input}
                                            />
                                        </View>
                                        <Text style={styles.error}>{numbererror}</Text>

                                        {/* Switch to Email */}
                                        <Text
                                            style={{
                                                color: Colors.primary,
                                                fontFamily: FONTS.LexendSemiBold,
                                                marginTop: RFValue(10),
                                                alignSelf: "center",
                                            }}
                                            onPress={() => setUseEmail(true)}
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

                                        {/* Switch back to WhatsApp */}
                                        <Text
                                            style={{
                                                color: Colors.primary,
                                                fontFamily: FONTS.LexendSemiBold,
                                                marginTop: RFValue(10),
                                                alignSelf: "center",
                                            }}
                                            onPress={() => setUseEmail(false)}
                                        >
                                            {t("Login Met WhatsApp Nummer")}
                                        </Text>
                                    </>
                                )}
                            </>
                        )}

                        <ButtonComponent
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
                <Text
                    onPress={openURL}
                    style={[styles.dis, { marginTop: 5, color: Colors.primary }]}
                >
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
    keep: {
        fontSize: RFValue(12),
        fontFamily: FONTS.LexendRegular,
        color: Colors.black,
        marginLeft: 10,
    },
    checkView: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: RFValue(20),
    },
    fpassword: {
        fontSize: RFValue(15),
        fontFamily: FONTS.LexendMedium,
        color: Colors.black,
        alignSelf: "center",
        marginTop: RFValue(12),
    },
    subContainer: {
        flex: 1,
    },

    country: {
        height: RFValue(45),
        alignItems: "center",
        flexDirection: "row",
        marginTop: RFValue(5),
        backgroundColor: Colors.white,
        borderRadius: 10,
        borderColor: Colors.litegray,
        borderWidth: 1,
    },
    pickerTitleStyle: {
        justifyContent: "center",
        flexDirection: "row",
        alignSelf: "center",
        fontWeight: "bold",
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
    },
    pickerStyle: {
        // marginLeft: 20,
        height: heightPercentageToDP(6),
        // borderColor: "#303030",
        borderColor: Colors.white,
        alignItems: "center",
        backgroundColor: Colors.white,
        borderRadius: 10,
        fontSize: 16,
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
    },
    selectedCountryTextStyle: {
        paddingLeft: 5,
        textAlign: "right",
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
        fontSize: RFValue(12),
    },

    countryNameTextStyle: {
        paddingLeft: 10,
        textAlign: "right",
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
    },

    searchBarStyle: {
        fontFamily: FONTS.LexendRegular,
        color: Colors.black,
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
    input: {
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
        width: "69%",
        height: heightPercentageToDP(7),
        // backgroundColor:'red',
        right: 20,
    },
    loginwithemail: {
        color: Colors.primary,
        fontFamily: FONTS.LexendSemiBold,
        marginTop: RFValue(10),
        alignSelf: "center",
    },
    loginwithphone: {
        color: Colors.primary,
        fontFamily: FONTS.LexendSemiBold,
        marginTop: RFValue(10),
        alignSelf: "center",
    },
});
