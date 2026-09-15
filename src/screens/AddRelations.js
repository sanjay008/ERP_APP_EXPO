import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import Input from "../components/input";
import { Colors } from "../constants/color";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import BlueHeader from "../components/BlueHeader";
import Loader from "../components/loading";
import apiConstants from "../api/apiConstants";
import ApiService from "../utils/Apiservice";
import { useTranslation } from "react-i18next";
import CountryPicker from "rn-country-picker";
import { Images } from "../constants/images";
import { getData } from "../utils/storeData";
import { RegisterBackContext } from "../constants/GoBackContext";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import GooglePlacesInput from "../components/GooglePlacesInput";

const AddRelations = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { item } = route?.params || {};
    const { RegisterBack, setRegisterBack, GOOGLE_API_KEY, setGOOGLE_API_KEY } = useContext(RegisterBackContext)
    useEffect(() => {
        const getKey = async () => {
            const GOOGLEMAPAPIKEY = await getData("GOOGLEMAPAPIKEY");
            setGOOGLE_API_KEY(GOOGLEMAPAPIKEY)
        }
        if (!GOOGLE_API_KEY) {
            getKey()

        }
    }, [])

    const [loading, setLoading] = useState(false);

    // 🧾 Form fields
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState("");
    const [countryCode, setCountryCode] = useState("31");
    const [phone, setPhone] = useState("");
    const [companyName, setCompanyName] = useState("");

    // ⚠️ Error states
    const [addressError, setAddressError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [companyError, setCompanyError] = useState("");

    const selectedValue = (value) => {
        setCountryCode(value?.callingCode);
        // console.log(value?.callingCode, "jsudhcousdhfcnos=-=-=-=");
    };

    // 🧮 Only numeric phone input
    const handlePhoneChange = (text) => {
        const numeric = text.replace(/[^0-9]/g, "");
        setPhone(numeric);
    };

    const validate = () => {
        let valid = true;

        if (!address.trim()) {
            setAddressError("Please enter address");
            valid = false;
        } else setAddressError("");

        if (!email.trim()) {
            setEmailError("Please enter email");
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError("Please enter a valid email");
            valid = false;
        } else setEmailError("");

        if (!phone.trim()) {
            setPhoneError("Please enter phone number");
            valid = false;
        } else if (phone.length < 6) {
            setPhoneError("Phone number too short");
            valid = false;
        } else setPhoneError("");

        if (!companyName.trim()) {
            setCompanyError("Please enter company name");
            valid = false;
        } else setCompanyError("");

        return valid;
    };

    const createCompany = async () => {
        if (!validate()) return;
        const getdata = await getData("USERDATA");

        try {
            setLoading(true);

            const data = {
                relaties_id: getdata.data.relaties.id,
                role: getdata.data.user.role,
                user_id: getdata.data.user.id,
                google_maps: address,
                email: email,
                country_code: countryCode,
                // country_code: countryCode.startsWith("+") ? countryCode : `+${countryCode}`,
                phone_number: phone,
                company_name: companyName,
                firstname: companyName,
                lastname: companyName,
                address: address,
                register_policy: true,
                // salutation: "mr",

            };

            console.log("📦 Sending Data:", data);

            const response = await ApiService(apiConstants.create_Relaties_company, {
                includeToken: true,
                customData: data,
            });

            console.log("✅ API Response:", response);

            if (response.success) {
                Alert.alert("Success", "Company created successfully!");
                navigation.goBack();
            } else {
                Alert.alert("Failed", "Something went wrong!");
            }
        } catch (err) {
            console.log("❌ Error:", err);
            Alert.alert("Error", "Network or API error!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <StatusBar
                backgroundColor={item?.color_code}
                barStyle={"light-content"}
            />
            <BlueHeader bgcolor={item?.color_code} title={"Add Company"} />

            {loading && <Loader />}

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.background}
                keyboardShouldPersistTaps="handled" // ✅ આ ઉમેરો

            >
                {/* 🏠 Address */}

                <Text style={styles.label}>{t("Address")}</Text>
                {/* <View style={styles.address}> */}
                    {/* <Image
                        source={Images.location}
                        style={styles.locationinput}
                        tintColor={Colors.gray}
                    /> */}
                    {/* <GooglePlacesAutocomplete
                        placeholder={address ? address : t("Voer geboorteplaats in")}
                        minLength={2}
                        keyboardShouldPersistTaps="always"
                        listViewDisplayed={false}
                        fetchDetails={true}
                        onPress={(data, details = null) => {
                            console.log(data, details, "data");
                            setAddress(data.description); // set selected address
                            setAddressError("");
                        }}
                        query={{
                            key: GOOGLE_API_KEY,
                            language: "en",
                        }}
                        onChangeText={(txt) => setAddress(txt)}

                        styles={{
                            textInputContainer: [
                                styles.textInputContainer,
                                {
                                    borderColor:
                                        Colors.litegray,
                                    backgroundColor:
                                        Colors.litegray1,
                                },
                            ],
                            textInput: styles.textInput,
                            description: styles.predefinedPlacesDescription,
                            predefinedPlacesDescription:
                                styles.predefinedPlacesDescription,
                        }}
                        nearbyPlacesAPI="GooglePlacesSearch"
                        debounce={200}
                        textInputProps={{
                            placeholderTextColor: Colors.textgray,
                            value: address,
                            onChangeText: (txt) => setAddress(txt),
                        }}
                    /> */}
                    <GooglePlacesInput
                        InputStyle={{ backgroundColor: Colors.litegray1 }}
                        apiKey={GOOGLE_API_KEY}
                        value={address}
                        onChangeText={setAddress}
                        Icon={Images.location}
                        onSelect={(item) => {
                            setAddress(item.description);
                            setAddressError("");

                        }}
                        placeholder={t("Voer geboorteplaats in")}
                    />
                {/* </View> */}
                {addressError ? <Text style={styles.error}>{addressError}</Text> : null}

                {/* ✉️ Email */}
                <Input
                    title="Email"
                    placeholder="Enter email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    backgroundColor={Colors.litegray1}
                    error={emailError}
                />

                {/* 📞 Phone */}
                <Text style={styles.label}>{t("Phone Number")}</Text>
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
                        pickerContainerStyle={[styles.pickerStyle]}
                        pickerTitleStyle={styles.pickerTitleStyle}
                        dropDownIcon={Images.down}
                        selectedCountryTextStyle={styles.selectedCountryTextStyle}
                        dropDownIconStyle={{ tintColor: Colors.black }}
                        countryNameTextStyle={styles.countryNameTextStyle}
                        searchBarPlaceHolder={t("Select Country")}
                        hideCountryFlag={false}
                        hideCountryCode={false}
                        searchBarContainerStyle={styles.searchBarStyle}
                        searchInputStyle={{ color: Colors.black }}
                        countryCode={countryCode}
                        selectedValue={selectedValue}

                    />
                    <TextInput
                        value={phone}
                        onChangeText={handlePhoneChange}
                        placeholderTextColor={Colors.textgray}
                        keyboardType="number-pad"
                        style={styles.input}
                    />
                </View>
                {phoneError ? <Text style={styles.error}>{phoneError}</Text> : null}

                {/* 🏢 Company Name */}
                <Input
                    title="Company Name"
                    placeholder="Enter company name"
                    value={companyName}
                    onChangeText={setCompanyName}
                    backgroundColor={Colors.litegray1}
                    error={companyError}
                />

                {/* ✅ Submit Button */}
                <TouchableOpacity style={styles.buttonbg} onPress={createCompany}>
                    <Text style={styles.buttontext}>{t("Add Relatie")}</Text>
                </TouchableOpacity>
            </ScrollView>
        </>
    );
};

export default AddRelations;

const styles = StyleSheet.create({
    background: {
        backgroundColor: Colors.white,
        marginTop: heightPercentageToDP(-1),
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: RFValue(13),
        fontFamily: FONTS.LexendMedium,
        color: Colors.black,
        marginTop: 10,
    },
    country: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.litegray1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginTop: 5,
        height: RFValue(45),
        backgroundColor: Colors.litegray1,
    },
    input: {
        flex: 1,
        fontSize: RFValue(13),
        fontFamily: FONTS.LexendRegular,
        color: Colors.black,
        paddingHorizontal: 10,
    },
    error: {
        color: Colors.red,
        fontSize: RFValue(10),
        fontFamily: FONTS.LexendRegular,
        marginTop: 3,
        marginLeft: 5,
    },
    buttonbg: {
        backgroundColor: Colors.primary,
        padding: 15,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        marginVertical: heightPercentageToDP(2),
        width: "100%",
    },
    buttontext: {
        color: Colors.white,
        fontSize: RFValue(16),
        fontFamily: FONTS.LexendSemiBold,
    },
    pickerStyle: {
        height: heightPercentageToDP(6),
        borderColor: Colors.litegray1,
        alignItems: "center",
        backgroundColor: Colors.litegray1,
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
    address: {
        flex: 1,
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
        zIndex: 9999,
    },
    textInput: {
        fontSize: 15,
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
        paddingLeft: 35,
        backgroundColor: "transparent",
    },
    predefinedPlacesDescription: {
        color: "#1faadb",
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
    },
    address: {
        flex: 1,
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
    },
    locationinput: {
        height: 22,
        width: 22,
        borderRadius: 7,
        position: "absolute",
        left: 10,
        top: 22,
        zIndex: 30,
    },
    textInputContainer: {
        height: RFValue(45),
        borderWidth: 1,
        borderColor: Colors.litegray,
        borderRadius: 10,
        alignItems: "center",
        paddingHorizontal: 10,
        marginTop: RFValue(5),
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
        marginBottom: 5,
    },
});
