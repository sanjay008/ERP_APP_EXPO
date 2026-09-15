import {
    Alert,
    Dimensions,
    Image,
    Linking,
    PermissionsAndroid,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Colors } from "../../constants/color";
import { Images } from "../../constants/images";
import { FONTS } from "../../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import OTPTextView from "react-native-otp-textinput";
import ButtonComponent from "../../components/buttonComponent";
import Geolocation from "@react-native-community/geolocation";
import { getData, storeData } from "../../utils/storeData";
import axios from "axios";
import apiConstants from "../../api/apiConstants";
import Loader from "../../components/loading";
import Input from "../../components/input";
import { useTranslation } from "react-i18next";
import ApiService from "../../utils/Apiservice";
import { requestPermission } from "../../notification/requestPermission";

const NewOtp = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { width } = Dimensions.get("screen");
    const { register } = route?.params;
    const { login } = route?.params;
    const { userId } = route?.params;
    const { logo } = route?.params;
    const { useEmail } = route?.params;
    const { other_data } = route?.params;
    const { verify_token } = route?.params;
    const [OTP, setotp] = useState("");
    const [otpError, setotpError] = useState("");
    const [timerActive, setTimerActive] = useState(true);
    const [show, setShow] = useState(false);
    const [timer, setTimer] = useState(60);
    const [currentLongitude, setCurrentLongitude] = useState("");
    const [currentLatitude, setCurrentLatitude] = useState("");
    const [locationStatus, setLocationStatus] = useState("");
    const [loading, setLoding] = useState(false);
    const [resendtext, setResendtext] = useState("");
    const [LoginTypeNew, setLoginTypeNew] = useState(other_data || null)

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
        if (OTP == "" || OTP?.length < 6) {
            setotpError("Voer OTP in");
        } else {
            setLoding(true);
             let token = await requestPermission();
            try {
                const company = await getData("COMPANYLOGIN");
                console.log("RE",{
                        company_login: company,
                        user_id: userId,
                        otp: OTP,
                        token: verify_token,
                        fcm_token: token,
                        otp_type:
                            LoginTypeNew ||
                            (register == "true"
                                ? "user_register_requests"
                                : login === "true"
                                    ? "mobile_login"
                                    : ""),
                    });
                
                const data = await ApiService(apiConstants.Verifyotp_new_otp, {
                    customData: {
                        company_login: company,
                        user_id: userId,
                        otp: OTP,
                        token: verify_token,
                        fcm_token: token,
                        otp_type:
                            LoginTypeNew ||
                            (register == "true"
                                ? "user_register_requests"
                                : login === "true"
                                    ? "mobile_login"
                                    : ""),
                    },
                });
                console.log(data);

                if (data?.status) {
                    storeData("LOGIN", true);
                    setTimeout(() => {
                        setLoding(false);
                    }, 1000);
                    // if (register == "true") {
                    //     navigation.navigate("NewStaff", {
                    //         logo: logo,
                    //         userId: userId,
                    //         type: "medewerker",
                    //         typeId: 3,
                    //         verify_token: verify_token,
                    //         category_id: 2,
                    //     });
                    // } else {
                    storeData("AUTH", true);
                    storeData("USERDATA", data);
                    if (data?.data?.relaties?.google_maps == null || data?.data?.user?.profile_image == null || data?.data?.relaties?.email_adres == null) {
                        navigation.replace("NewStaff", {
                            logo: logo,
                            userId: userId,
                            type: "medewerker",
                            typeId: 3,
                            verify_token: verify_token,
                            category_id: 2,
                            dataaaa: data.data
                        });
                    } else {

                        storeData("AUTH", true);
                        // navigation.navigate("BottamScreens1");
                        navigation.navigate("BottamScreens1", {
                            refresh: Date.now(),
                        });
                        // navigation.navigate("BottamScreens");
                    }

                } else {
                    Alert.alert(t("Wrong"), data?.message || t("Something Wrong"))
                }

            } catch (err) {
                console.log("Error fetching connections:", err);
                setTimeout(() => {
                    setLoding(false);
                }, 1000);
                Alert.alert(t("Wrong"), err?.message || t("Something Wrong"))

            }
            finally {
                setLoding(false);
            }
        }
    };

    const openWhatsAppNumber = async () => {

        let whatsappNumber = "+31 631031703";
        try {
            const url = Platform.OS === 'android'
                ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`
                : `whatsapp://send?phone=${whatsappNumber.replace(/[^0-9]/g, "")}`;

            const supported = await Linking.canOpenURL(url);
            if (!supported) {
                Alert.alert('WhatsApp is not installed on this device.');
                return;
            }

            await Linking.openURL(url);
        } catch (error) {
            console.log('Error opening WhatsApp:', error);
        }
    };

    const ResendOtp = async () => {
        try {
            const company = await getData("COMPANYLOGIN");
            const data = await ApiService(apiConstants.resend_otp, {
                customData: {
                    company_login: company,
                    user_id: userId,
                    otp_type: LoginTypeNew || register == "true" ? "user_register_requests" : "mobile_login",
                },
            });
            if (data.status) {
                setResendtext(data.message);
                setLoginTypeNew(data?.data)
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

            {
                !useEmail &&
                <View style={{ paddingHorizontal: 10, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>


                    <Text style={[styles.wellcome, { textAlign: 'center' }]}>{t("An OTP code has been sent to your WhatsApp")}</Text>
                    <TouchableOpacity style={{ padding: 10 }} onPress={() => openWhatsAppNumber()}>
                        <Text style={{ color: Colors.primary, fontFamily: FONTS.LexendMedium }}>{t("Open WhatsApp")}</Text>
                    </TouchableOpacity>
                </View>

            }
            <View style={styles.container}>
                <Text style={styles.wellcome}>{t("verifiëren")}</Text>
                <Text style={styles.dis}>{t("Voer OTP in")}</Text>
                <Input
                    value={OTP}
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
                    marginTop={RFValue(10)}
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

export default NewOtp;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    wellcome: {
        fontSize: 17,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.black,
        marginTop: 20,
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
