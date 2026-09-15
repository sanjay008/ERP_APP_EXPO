import React, { useContext, useState } from "react";
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
import { Colors } from "../../constants/color";
import { FONTS } from "../../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import Input from "../../components/input";
import ButtonComponent from "../../components/buttonComponent";
import axios from "axios";
import apiConstants from "../../api/apiConstants";
import Loader from "../../components/loading";
import { Images } from "../../constants/images";
import { getData, storeData } from "../../utils/storeData";
import { useTranslation } from "react-i18next";
import ApiService from "../../utils/Apiservice";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { requestPermission } from "../../notification/requestPermission";

const NewPassword = ({ route, navigation }) => {
    const { logo } = route?.params;
    const { login_company } = route.params;
    const { email } = route.params;
    const { verify_token } = route.params;
    const { userId } = route?.params;
    const { width } = Dimensions.get("screen");
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(true);
    const { t } = useTranslation();
    const { setToast } = useContext(RegisterBackContext);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const onVerify = () => {
        if (!password.trim()) {
            setPasswordError(t("Please enter your password"));
            return;
        }
      
     
        setPasswordError("");
        setConfirmPasswordError("");
        onLogin();
    };


    const onLogin = async () => {
        setLoading(true);
        try {
            const company = await getData("COMPANYLOGIN");
            const trimmedPassword = password.trim();
             let token = await requestPermission();

            const data = await ApiService(apiConstants.Login, {
                customData: {
                    password: trimmedPassword,
                    company_login: company,
                    email: email,
                    fcm_token: token,
                },
            });
            if (data.status) {
                setLoading(false);
                storeData("USERDATA", data);


                if (data?.data?.relaties.google_maps == null || data?.data?.relaties.file_path == null || data?.data?.relaties.email_adres == null) {
                    navigation.navigate("NewStaff", {
                        logo: logo,
                        userId: userId,
                        type: "medewerker",
                        typeId: 3,
                        verify_token: verify_token,
                        category_id: 2,
                        dataaaa: data.data,
                        login_company: login_company
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
                setLoading(false);
                setToast({
                    visible: true,
                    text: data?.data?.message ||  data?.message || t("Something Wrong"),
                    type: "error",
                    top: 45,
                })
                setPasswordError(data?.data?.message || data?.message || t("Something Wrong"));
            }
        } catch (error) {
            setLoading(false);
            if (axios?.isAxiosError(error)) {
                setToast({
                    visible: true,
                    text: error?.response?.data.message || t("Something Wrong"),
                    type: "error",
                    top: 45,
                })
                setPasswordError(error?.response?.data.message || t("Something Wrong"));
            } else {
                setToast({
                    visible: true,
                    text: t("Something Wrong"),
                    type: "error",
                    top: 45,
                })
            }
        }
        finally {
            setLoading(false);
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
                    maxLength={50}
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

export default NewPassword;

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
