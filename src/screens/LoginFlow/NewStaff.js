import {
    Alert,
    Image,
    // SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    TextInput,
    FlatList,
    PermissionsAndroid,
    Linking,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FONTS } from "../../constants/fontFamily";
import { Images } from "../../constants/images";
import { Colors } from "../../constants/color";
import Input from "../../components/input";
import { RFValue } from "react-native-responsive-fontsize";
import ButtonComponent from "../../components/buttonComponent";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import axios from "axios";
import apiConstants from "../../api/apiConstants";
import { getData, storeData } from "../../utils/storeData";
import Loader from "../../components/loading";
import SelectDropdown from "react-native-select-dropdown";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import Modal from "react-native-modal";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { CommonActions } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import ApiService from "../../utils/Apiservice";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import DatePicker from "react-native-date-picker";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { GoogleAPi } from "../../components/GoogleAPI";
import { ApiFormatDate } from "../../components/ApiFormatDate";
import { err } from "react-native-svg";
import { useErrorHandle } from "../../components/ErrorHandle";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GooglePlacesInput from "../../components/GooglePlacesInput";

// const GOOGLE_API_KEY = "AIzaSyBVCjdibPBQN8s0Iy06ITwgMvrRZZRLcog";

const NewStaff = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const { logo } = route.params;
    const { userId } = route.params;
    const { type } = route.params;
    const { typeId } = route.params;
    const { verify_token } = route.params;
    const { dataaaa } = route.params;
    const { category_id } = route.params;
    const { is_logout } = route.params;
    const { login_company } = route.params;
    const editMode = dataaaa ? true : false;
    const { ErrorHandle } = useErrorHandle()
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [address, setAddress] = useState("");
    const [addressError, setAddressError] = useState("");
    const [fname, setFname] = useState("");
    const [fnameError, setFnameError] = useState("");
    const [mname, setMname] = useState("");
    const [mnameError, setMnameError] = useState("");
    const [lname, seLname] = useState("");
    const [lnameError, setLnameError] = useState("");
    const [saluteError, setSaluteError] = useState("");
    const [departmentError, setdepartmentError] = useState("");
    const [one, setOne] = useState("");
    const [three, setThree] = useState("");
    const [four, setFour] = useState("");
    const [loading, setLoding] = useState(false);
    const [fcomplate, setFcomplate] = useState(false);
    const [scomplate, setScomplate] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
    const [image, setImage] = useState(null);
    const [focus, setFocus] = useState(false);
    const [data, setData] = useState("");
    const [NewImage, setNewImage] = useState(null);
    const googlePlacesRef = useRef(null);
    const [selectimage, setselectimage] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const { t } = useTranslation();
    const [selectedItemdepartmnt, setSelectedItemdepartmnt] = useState({});
    const [selectedItem, setSelectedItem] = useState({});
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedDecade, setSelectedDecade] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [finalDate, setFinalDate] = useState(null); // To hold the final selected date
    const [birthaddress, setBirthAddress] = useState("");
    const [addresserror, setaddressError] = useState("");
    const [dateerror, setDateError] = useState("");
    const [date, setDate] = useState(null);
    const [open, setOpen] = useState(false);
    const [Tempuser, seTempUser] = useState(null);
    const { setToast, RegisterBack, setRegisterBack, GOOGLE_API_KEY, setGOOGLE_API_KEY } = useContext(RegisterBackContext)
const {top} = useSafeAreaInsets();

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const key = await GoogleAPi();
                if (isMounted) setGOOGLE_API_KEY(key);

                let sourceData = dataaaa;

                if (!sourceData?.relaties) {
                    const stored = await getData("USERDATA");
                    sourceData = stored?.data || null;
                    seTempUser(stored);
                }

                const r = sourceData?.relaties;
                const user = sourceData?.user;

                if (!r) return;

                setSelectedItem({ title: r?.aanhef ?? "" });
                setFname(r?.voornaam ?? "");
                setMname(r?.voorvoegsel ?? "");
                seLname(r?.achternaam ?? "");

                setBirthAddress(r?.birth_place ?? "");
                setDate(r?.birth_date ?? "");

                if (category_id === 1) {
                    setOne(r?.bedrijfsnaam && r?.bedrijfsnaam !== "null" ? r.bedrijfsnaam : "");
                }

                if (category_id === 3) {
                    setThree(r?.woning_name ?? "");
                }

                if (category_id === 4) {
                    setFour(r?.voertuig_project ?? "");
                }

                const email = user?.email;
                setEmail(email && !email.includes("@dummy.com") ? email : "");

                setAddress(r?.google_maps ?? "");


                if (r?.file_path) {
                    const img = [{ uri: user?.profile_image }];
                    setImage(img);
                    setNewImage(img);
                }

            } catch (e) {
                console.log("Init error:", e);
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, [dataaaa, category_id]);


    const handleSelectItem = (selectedItem, index) => {
        setSelectedItem(selectedItem);
        setSaluteError("");
    };

    const FristNext = () => {
        if (!selectedItem || selectedItem?.title == "") {
            console.log("--saluteError-----");
            setSaluteError(t("Selecteer alstublieft"));
        } else if (fname == "") {
            setFnameError(t("Voer uw voornaam in"));
        } else if (lname == "") {
            setLnameError(t("Voer achternaam in"));
        } else if (!date) {
            setDateError(t("Selecteer geboortedatum"));
        } else if (birthaddress == "") {
            setaddressError(t("Voer geboorte adres in"));
        } else {
            setLoding(true);
            setTimeout(() => {
                setFcomplate(true);
                setLoding(false);
            }, 1000);
        }
    };

    const SecondNext = () => {
        // logAddressText();
console.log("hey");

        const regex = /^[\w+.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
        if (email == "") {
            setEmailError(t("Voer uw e-mailadres in"));
            setLoding(false);
        } else if (!regex.test(email)) {
            setEmailError(t("Voer een geldig emailadres in"));
            setLoding(false);
        } else {
            const handleAddressConfirm = () => {
            

                if (!address) {
                    setAddressError(t("Voer het adres in"));
                    setLoding(false);
                    return;
                }

                setAddress(address);
                setAddressError("");
                setLoding(true);
                setScomplate(true);
                setLoding(false);
            };
            handleAddressConfirm();
        }
    };

    const logAddressText = () => {
        if (googlePlacesRef.current) {
            const addressText = googlePlacesRef.current?.getAddressText();
            if (addressText) {
                console.log(addressText, "address");
                setAddress(addressText);
            } else {
                setAddressError(t("Voer het adres in"));
            }
        }
    };

    const handleTextChange = (text) => {
        if (googlePlacesRef.current) {
            const addressText = googlePlacesRef.current?.getAddressText();
            console.log(addressText, "address text from getAddressText method");
            if (addressText) {
                setAddress(addressText);
            }
        }
    };

    const OpenGallary = () => {
        const options = {
            title: "image Picker",
            mediaType: "image",
            storageOptions: {
                path: "images",
            },
            quality: 0.5,
        };
        launchImageLibrary(options, (Response) => {
            if (!Response.didCancel) {
                setselectimage(Response.assets);
                setImage(Response.assets);
                setNewImage(Response.assets)
                setdepartmentError("");
                setModalOptionsVisible(false);
            }
        });
    };



    const requestCameraPermissionIOS = async () => {
        try {
            const result = await request(PERMISSIONS.IOS.CAMERA);
            return result;
        } catch (error) {
            console.warn("Error requesting iOS camera permission: ", error);
            return RESULTS.DENIED;
        }
    };

    const OpenCamera = async () => {
        try {
            if (Platform.OS === "android") {
                // Android-specific permission request
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Camera Permission",
                        message: "App needs access to your camera to take photos.",
                        buttonPositive: "OK", // Custom OK button text
                    }
                );

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log("Camera permission granted");
                    executeCamera(); // Function to launch the camera
                } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                    // Open app settings if "Never Ask Again" is selected
                    Alert.alert(
                        "Permission Required",
                        "Camera access is permanently denied. Please enable it from the app settings.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Open Settings", onPress: () => Linking.openSettings() },
                        ]
                    );
                } else {
                    // If permission is denied
                    Linking.openSettings(); // Directly open app settings
                }
            } else if (Platform.OS === "ios") {
                // iOS-specific permission request
                const permissionStatus = await requestCameraPermissionIOS();

                if (permissionStatus === RESULTS.GRANTED) {
                    console.log("Camera permission granted on iOS");
                    executeCamera(); // Function to launch the camera
                } else {
                    Alert.alert(
                        "Permission Denied",
                        "Camera access is required to use this feature. Please enable it from the app settings.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Open Settings", onPress: () => Linking.openSettings() },
                        ]
                    );
                }
            }
        } catch (error) {
            console.warn("Permission request error: ", error);
        }
    };

    const executeCamera = () => {
        const options = {
            mediaType: "photo",
            maxWidth: 800,
            maxHeight: 800,
            quality: 1,
            includeBase64: false,
        };

        launchCamera(options, (response) => {
            if (response.didCancel) {
                console.log("User cancelled image picker");
            } else if (response.errorCode) {
                console.log("ImagePicker Error: ", response.errorMessage);
                Alert.alert("Error", response.errorMessage);
            } else {
                const source = { uri: response.uri };
                setImage(response.assets);
                setNewImage(response?.assets)
                setdepartmentError("");
                console.log("Response URI: ", response.assets[0].uri);
                setModalOptionsVisible(false);
            }
        });
    };

    const onRegister = async () => {
        if (!image) {
            setdepartmentError("Selecteer profile");
            console.log("profile");
        } else {
            setLoding(true);
            try {
                const data = await ApiService(apiConstants.createUserWithRelaties, {
                    customData: {
                        token: verify_token,
                        user_id: userId,
                        relaties_type: type,
                        relaties_type_id: typeId,
                        aanhef: selectedItem.title,
                        voornaam: fname,
                        voorvoegsel: mname,
                        achternaam: lname,
                        email: email,
                        address: address,
                        department: null,
                        category_id: category_id,
                        profile_image: image
                            ? {
                                uri: image[0].uri,
                                name: "image",
                                type: image[0].type,
                            }
                            : "",
                        bedrijfsnaam: one ? one : null,
                        woning_name: three ? three : null,
                        voertuig_project: four ? focus : null,
                        birth_place: birthaddress,
                        birth_date: date,
                    },
                });
                console.log("userdataswdwds", data);
                if (data.status) {
                    storeData("USERDATA", data);
                    storeData("LOGIN", true);
                    storeData("AUTH", true);
                    setTimeout(() => {
                        setLoding(false);
                        setModalVisible(true);
                    }, 1000);
                } else {
                    console.log("false");
                    setTimeout(() => {
                        setLoding(false);
                    }, 1000);
                    console.log("----------cvfvf--", data);
                    Alert.alert("Oops!", data.message, [
                        { text: "OK", onPress: () => console.log("OK Pressed") },
                    ]);
                }
            } catch (err) {
                console.log("Error fetching create:", err);
            }
        }
    };

    const onEdit = async () => {
        // Alert.alert("")
        if (!NewImage || image[0]?.uri == "https://www.milton.edu/wp-content/uploads/2019/11/avatar-placeholder.jpg") {
            setdepartmentError("Selecteer profile");
            console.log("profile");
            return
        } else {
            setLoding(true);

            const company = await getData("COMPANYLOGIN");
            const userData = await getData("USERDATA");
            const user = userData?.data;


            try {
                let formData = new FormData();

                formData.append("token", user?.user?.verify_token);
                formData.append("company_login", company);
                formData.append("username", `${fname}${lname}`);
                formData.append("user_id", user?.user?.id);
                formData.append("aanhef", selectedItem.title);
                formData.append("voornaam", fname);
                formData.append("voorvoegsel", mname);
                formData.append("achternaam", lname);
                formData.append("email", email);
                formData.append("address", address);
                formData.append("google_maps", address);
                formData.append("department", "");
                formData.append("category_id", category_id);
                formData.append("whatsapp_number", user?.user?.whatsapp_number);
                formData.append("country_code", user?.user?.country_code);

                // 📸 Image upload
                if (NewImage && NewImage.length > 0) {
                    formData.append("profile_image", {
                        uri: NewImage[0].uri,
                        name: "profile.jpg",
                        type: NewImage[0].type || "image/jpeg",
                    });
                }

                formData.append("birth_place", birthaddress);
                formData.append("birth_date", date);

                // 🔥 API CALL
                console.log("formData", formData);
                const response = await axios.post(apiConstants.updateProfile, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                console.log("updateProfiledata", response.data);

                const data = response.data;

                if (data?.status) {
                    await storeData("USERDATA", data);
                    await storeData("LOGIN", true);
                    await storeData("AUTH", true);

                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [
                                {
                                    name: "BottamScreens1",
                                    params: { refresh: Date.now() },
                                },
                            ],
                        })
                    );

                } else {
                    setTimeout(() => setLoding(false), 1000);
                    Alert.alert("Oops!", data?.message);
                }
            } catch (error) {
                setLoding(false);
                console.log("API Error:", error);
                // Alert.alert("Oops!", ErrorHandle(error)?.message || "Something went wrong!");
                if (axios?.isAxiosError(error)) {
                    console.log("📛 API Error Details:", {
                        status: error?.response?.status,
                        data: error?.response?.data,
                        message: error?.message,
                    });
                    setToast({
                        visible: true,
                        text: error?.response?.data.message || t("Something Wrong"),
                        type: 'error',
                        top: 45,
                    })
                }
            }
            finally {
                setLoding(false);

            }

        }
    };

    const Department_List = async () => {
        try {
            const company = await getData("COMPANYLOGIN");
            const data = await ApiService(apiConstants.departmentList, {
                customData: {
                    company_login: company,
                },
            });
            if (data.status) {
                setData(data.data);
                // console.log(data.data, "dhvndfoibvhnd;i=======");
            } else {
                console.log("False connections");
            }
        } catch (err) {
            console.log("Error fetching connections department:", err);
        }
    };

    useEffect(() => {
        Department_List();
        // getDataFun()
    }, []);

    const safeDate = (inputDate) => {
        const d = new Date(inputDate);
        return isNaN(d.getTime()) ? new Date("1990-01-01") : d;
    };
    useEffect(() => {
        if (searchTerm === "") {
            setFilteredData(data);
        } else {
            const filtered = data.filter((item) =>
                item.status.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, data]);


    const formatDateToDDMMYYYY = (date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleDateChange = (selectedDate) => {
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const year = selectedDate.getFullYear();

        const formattedDate = `${day}-${month}-${year}`;  // dd-mm-yyyy

        console.log("Formatted Date:", formattedDate);

        setDate(formattedDate);
        setOpen(false);
        setDateError("");
    };
    const handleBack = async () => {
        if (scomplate) {
            // Step 3 → Step 2
            setScomplate(false);
            return;
        }

        if (fcomplate) {
            // Step 2 → Step 1
            setFcomplate(false);
            return;
        }

        // Step 1 → Exit / Logout
        await AsyncStorage.clear();
        navigation.reset({
            index: 0,
            routes: [{ name: "CompanyLogin" }],
        });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar backgroundColor={Colors.white} barStyle={"dark-content"} />
            {loading && <Loader />}

            <TouchableOpacity
                onPress={handleBack}
                style={{ position: "absolute", top: top, left: 20, zIndex: 20, backgroundColor: Colors.litegray, padding: 5, borderRadius: 10, justifyContent: "center", alignItems: "center" }}>
                <Image
                    source={Images.back}
                    style={[
                        {
                            height: 24,
                            width: 24
                        },

                    ]} />
            </TouchableOpacity>
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                enableOnAndroid
                extraScrollHeight={70}
                keyboardShouldPersistTaps="handled"
                style={styles.subContainer}
            >
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
                    <Text style={styles.wellcome}>{t("Welkom bij ERP Portaal")}</Text>
                    <Text style={styles.dis}>
                        {t("Smart Solutions for Modern Businesses")}
                    </Text>

                    <Modal
                        animationIn={"fadeIn"}
                        transparent={true}
                        visible={modalOptionsVisible}
                        onRequestClose={() => {
                            setModalOptionsVisible(false);
                        }}
                        onSwipeComplete={() => {
                            setModalOptionsVisible(false);
                        }}
                        onBackdropPress={() => {
                            setModalOptionsVisible(false);
                        }}
                        onBackButtonPress={() => {
                            setModalOptionsVisible(false);
                        }}
                        swipeDirection="down"
                        style={styles.modal}
                    >
                        <View style={styles.modalcontainer}>
                            <View style={styles.modalheader}>
                                <Text style={styles.headertext}>{t("Kies afbeelding")}</Text>
                                <TouchableOpacity onPress={() => setModalOptionsVisible(false)}>
                                    <Image style={styles.galleryicon} source={Images.close} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.option}
                                onPress={() => {
                                    setModalOptionsVisible(false);
                                    OpenCamera();
                                }}
                            >
                                <View style={styles.cameraimagebg}>
                                    <Image
                                        style={styles.galleryicon}
                                        source={Images.camera}
                                    ></Image>
                                    <Text style={styles.gallerytext}>{t("Camera")}</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.option}
                                onPress={() => {
                                    setModalOptionsVisible(true);
                                    OpenGallary();
                                }}
                            >
                                <View style={styles.galleryimagebg}>
                                    <Image style={styles.galleryicon} source={Images.gallery} />

                                    <Text style={styles.gallerytext}>{t("Galerij")}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Modal>
                    {scomplate != true ? (
                        <>
                            {fcomplate != true ? (
                                <>
                                    {category_id == 1 ? (
                                        <Input
                                            value={one}
                                            onChangeText={(txt) => {
                                                setOne(txt);
                                            }}
                                            title={t("bedrijfsnaam")}
                                            iconSource={Images.company}
                                        />
                                    ) : category_id == 3 ? (
                                        <Input
                                            value={three}
                                            onChangeText={(txt) => {
                                                setThree(txt);
                                            }}
                                            title={t("woning_name")}
                                            iconSource={Images.company}
                                        />
                                    ) : category_id == 4 ? (
                                        <Input
                                            value={four}
                                            onChangeText={(txt) => {
                                                setFour(txt);
                                            }}
                                            title={t("voertuig_project")}
                                            iconSource={Images.company}
                                        />
                                    ) : (
                                        ""
                                    )}

                                    <Text style={[styles.title, { alignSelf: "flex-start" }]}>
                                        {t("Aanhef")}*
                                    </Text>
                                    <SelectDropdown
                                        data={[
                                            { title: t("fam") },
                                            { title: t("dhr") },
                                            { title: t("mevr") },
                                        ]}
                                        onSelect={handleSelectItem}
                                        renderButton={(item, isOpened) => {
                                            return (
                                                <View style={[styles.dropdownButtonStyle]}>
                                                    <Text style={[styles.dropdownButtonTxtStyle]}>
                                                        {selectedItem.title
                                                            ? selectedItem.title
                                                            : t("Selecteer Aanhef")}
                                                    </Text>
                                                    <Image
                                                        source={Images.down}
                                                        style={{
                                                            height: 20,
                                                            width: 20,
                                                            tintColor: Colors.black,
                                                        }}
                                                    />
                                                </View>
                                            );
                                        }}
                                        renderItem={(item, index, isSelected) => {
                                            return (
                                                <View
                                                    style={[
                                                        styles.dropdownItemStyle,
                                                        isSelected && { backgroundColor: Colors.white },
                                                    ]}
                                                >
                                                    <Text style={styles.dropdownItemTxtStyle}>
                                                        {item.title}
                                                    </Text>
                                                </View>
                                            );
                                        }}
                                        showsVerticalScrollIndicator={false}
                                        dropdownStyle={styles.dropdownMenuStyle}
                                    />
                                    <Text style={styles.error}>{saluteError}</Text>
                                    <Input
                                        value={fname}
                                        onChangeText={(txt) => {
                                            setFname(txt), setFnameError("");
                                        }}
                                        title={
                                            <Text>
                                                {t("Voornaam")}
                                                <Text> *</Text>
                                            </Text>
                                        }
                                        error={fnameError}
                                        iconSource={Images.name}
                                    />
                                    <Input
                                        value={mname}
                                        onChangeText={(txt) => {
                                            setMname(txt), setMnameError("");
                                        }}
                                        title={t("Voorvoegsel")}
                                        iconSource={Images.name}
                                    />
                                    <Input
                                        value={lname}
                                        onChangeText={(txt) => {
                                            seLname(txt), setLnameError("");
                                        }}
                                        title={
                                            <Text>
                                                {t("Achternaam")}
                                                <Text> *</Text>
                                            </Text>
                                        }
                                        error={lnameError}
                                        iconSource={Images.name}
                                    />

                                      <View style={[styles.address,{zIndex:50}]}>
                                    <Text style={[styles.selectedDateText,{marginVertical:5}]}>{t("geboorteplaats")} *</Text>
                                        <GooglePlacesInput
                                            InputStyle={{ backgroundColor: Colors.white }}
                                            apiKey={GOOGLE_API_KEY}
                                            value={birthaddress}
                                            onChangeText={setBirthAddress}
                                            Icon={Images.location}
                                            onSelect={(item) => {
                                                setBirthAddress(item.description);
                                                setaddressError("");
                                            }}
                                            placeholder={t("geboorteplaats")}
                                        />

                                        <Text style={styles.error}>{addresserror}</Text>
                                    </View>

                                    <View
                                        style={{ flex: 1 }}
                                    >

                                        <Text style={styles.selectedDateText}>{t("geboortedatum")} *</Text>

                                        <TouchableOpacity
                                            style={[styles.dateInput, { justifyContent: "" }]}
                                            onPress={() => setOpen(true)}
                                        >
                                            <Image
                                                source={Images.date}
                                                style={{
                                                    tintColor: Colors.textgray,
                                                    height: 24,
                                                    width: 24,
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    color: date ? Colors.black : Colors.gray,
                                                    paddingLeft: 10,
                                                    fontFamily: FONTS.LexendRegular,
                                                }}
                                            >
                                                {date || t("Voer uw geboortedatum in")}
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.error}>{dateerror}</Text>
                                        <DatePicker
                                            modal
                                            mode="date"
                                            date={safeDate(date)}
                                            open={open}
                                            onConfirm={handleDateChange}
                                            onCancel={() => {
                                                setOpen(false);
                                            }}
                                            title={t("Voer geboortedatum in")}
                                            confirmText="Select"
                                            dividerColor={Colors.primary}
                                            buttonColor={Colors.primary}
                                        />

                                    </View>

                                  

                                    {/* <Input
                                        value={birthaddress}
                                        onChangeText={(txt) => {
                                            setBirthAddress(txt), setaddressError("");
                                        }}
                                        title={
                                            <Text>
                                                {t("geboorteplaats")}
                                                <Text> *</Text>
                                            </Text>
                                        }
                                        error={addresserror}
                                        iconSource={Images.location}
                                    /> */}



                                    <ButtonComponent
                                        onPress={() => {
                                            setOpen(false), FristNext();
                                        }}
                                        // onPress={FristNext}
                                        marginTop={RFValue(10)}
                                        marginBottom={RFValue(10)}
                                        title={t("Volgende")}
                                    />
                                </>
                            ) : (
                                <>
                                    <Input
                                        value={email}
                                        onChangeText={(txt) => {
                                            setEmail(txt), setEmailError("");
                                        }}
                                        title={t("E-mail")}
                                        error={emailError}
                                        iconSource={Images.mail}
                                    />

                                    <Text
                                        style={[
                                            styles.title,
                                            { textTransform: 'capitalize' },
                                            { marginTop: 10, alignSelf: "", marginVertical: "", },
                                        ]}
                                    >
                                        {t("Your Adres")}
                                    </Text>
                                    <View style={[styles.address,{zIndex:50}]}>
                                        <GooglePlacesInput
                                            InputStyle={{ backgroundColor: Colors.white }}
                                            apiKey={GOOGLE_API_KEY}
                                            value={address}
                                            onChangeText={setAddress}
                                            Icon={Images.location}
                                            onSelect={(item) => {
                                                setAddress(item.description);
                                                setAddressError("");

                                            }}
                                            placeholder={t("Address Location")}
                                        />

                                        <Text style={styles.error}>{addresserror}</Text>
                                    </View>

                                    <ButtonComponent
                                        onPress={SecondNext}
                                        marginTop={RFValue(35)}
                                        marginBottom={RFValue(10)}
                                        title={t("Volgende")}
                                    />
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={() => setModalOptionsVisible(true)}
                                style={{ alignSelf: "center", marginVertical: 15 }}
                            >
                                <Image
                                    source={
                                        NewImage
                                            ? { uri: NewImage[0]?.uri }
                                            : image
                                                ? image[0]?.uri ===
                                                    "https://www.milton.edu/wp-content/uploads/2019/11/avatar-placeholder.jpg"
                                                    ? Images.addImage
                                                    : { uri: image[0]?.uri }
                                                : Images.addImage
                                    }
                                    style={{ height: 100, width: 100, borderRadius: 7 }}
                                />

                            </TouchableOpacity>
                            <Text style={styles.error}>{departmentError}</Text>

                            <ButtonComponent
                                onPress={() => {
                                    onEdit();
                                }}
                                marginTop={RFValue(50)}
                                marginBottom={RFValue(10)}
                                title={t("Save")}
                            />
                        </>
                    )}
                </View>

                <Modal
                    onBackdropPress={() => {
                        setModalVisible(false);
                    }}
                    onBackButtonPress={() => {
                        setModalVisible(false);
                    }}
                    style={styles.mview}
                    visible={modalVisible}
                >
                    <>
                        <View style={styles.mcontainer}>
                            <View style={styles.profilemodalheader} />
                            <Image source={Images.user} style={styles.userimage} />
                            <Text
                                style={[
                                    styles.wellcome,
                                    {
                                        alignSelf: "center",
                                        marginBottom: 30,
                                        marginTop: 80,
                                        textAlign: "center",
                                        width: "80%",
                                    },
                                ]}
                            >
                                {t("Do you want to complete the profile?")}
                            </Text>
                            <View style={{ alignItems: "center" }}>
                                <ButtonComponent
                                    onPress={() => {
                                        setLoding(true), setModalVisible(false);
                                        setTimeout(() => {
                                            navigation.dispatch(
                                                CommonActions.reset({
                                                    index: 1,
                                                    routes: [
                                                        {
                                                            name: "Profile",
                                                        },
                                                    ],
                                                })
                                            );
                                            setLoding(false);
                                            setRegisterBack(true)
                                        }, 1000);
                                    }}
                                    marginTop={RFValue(10)}
                                    marginBottom={RFValue(10)}
                                    title={t("Go to Profile Page")}
                                    width={"82%"}
                                />
                                <TouchableOpacity
                                    onPress={() => {
                                        setModalVisible(false),
                                            setLoding(true),
                                            setTimeout(() => {
                                                navigation.dispatch(
                                                    CommonActions.reset({
                                                        index: 0,
                                                        // routes: [{ name: "BottamScreens" }],
                                                        routes: [{ name: "BottamScreens1" }],
                                                    })
                                                );
                                                setLoding(false);
                                            }, 1000);
                                    }}
                                    style={styles.remindmenexttext}
                                >
                                    <Text style={[styles.title, { marginTop: 0 }]}>
                                        {t("Remind Me Next Time")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                </Modal>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default NewStaff;

const styles = StyleSheet.create({
    dateInput: {
        // width: widthPercentageToDP(90),
        height: heightPercentageToDP(7),
        backgroundColor: Colors.white,
        borderRadius: 10,
        borderColor: Colors.litegray,
        borderWidth: 1,
        paddingHorizontal: 15,
        alignItems: "center",
        marginTop: 5,
        flexDirection: "row",
        // marginHorizontal: 20,
        marginBottom: 10,
        justifyContent: "space-between",
        // marginHorizontal: 20,
    },
    dateText: {
        fontSize: 14,
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
    },
    modalContainer: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
    },
    // title: {
    //   fontSize: 20,
    //   marginBottom: 10,
    //   textAlign: "center",
    // },
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
    },
    decadeButton: {
        padding: 10,
        backgroundColor: "#f0f0f0",
        margin: 5,
        borderRadius: 5,
    },
    yearButton: {
        padding: 10,
        backgroundColor: "#f0f0f0",
        margin: 5,
        borderRadius: 5,
    },
    monthButton: {
        padding: 10,
        backgroundColor: "#f0f0f0",
        margin: 5,
        borderRadius: 5,
    },
    selected: {
        backgroundColor: Colors.primary,
    },
    selectedDateText: {
        fontSize: RFValue(14),
        fontFamily: FONTS.LexendMedium,
        color: Colors.black,
        marginTop: RFValue(5),
        // marginHorizontal: 20,
    },
    button: {
        padding: 10,
        backgroundColor: Colors.primary,
        margin: 5,
        borderRadius: 5,
        alignItems: "center",
    },
    navigation: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    }, ///
    result: {
        fontSize: 18,
        textAlign: "center",
    },
    safe: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    wellcome: {
        fontSize: RFValue(17),
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.black,
        marginTop: 40,
    },
    dis: {
        fontSize: RFValue(14),
        fontFamily: FONTS.LexendRegular,
        color: Colors.textgray,
        marginTop: 8,
        marginBottom: 15,
    },
    logo: {
        alignSelf: "center",
        marginTop: RFValue(40),
    },
    container: {
        paddingHorizontal: 24,
    },
    subContainer: {
        flex: 1,
    },
    dropdownButtonStyle: {
        height: RFValue(45),
        borderWidth: 1,
        borderColor: Colors.litegray,
        width: "100%",
        borderRadius: 7,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
        marginTop: RFValue(5),
    },
    dropdownButtonTxtStyle: {
        flex: 1,
        fontSize: 14,
        fontFamily: FONTS.LexendRegular,
        color: Colors.black,
    },
    dropdownMenuStyle: {
        backgroundColor: Colors.white,
        borderRadius: 8,
        fontFamily: FONTS.LexendRegular,
        color: Colors.black,
    },
    dropdownItemStyle: {
        width: "100%",
        flexDirection: "row",
        paddingHorizontal: 12,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 8,
    },
    dropdownItemTxtStyle: {
        flex: 1,
        fontSize: 14,
        fontFamily: FONTS.LexendRegular,
        color: Colors.black,
    },
    title: {
        fontSize: RFValue(16),
        fontFamily: FONTS.LexendRegular,
        color: Colors.black,
        alignSelf: "center",
        marginVertical: RFValue(15),
    },
    error: {
        color: Colors.red,
        fontSize: RFValue(10),
        fontFamily: FONTS.LexendRegular,
        marginTop: RFValue(1),
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
        borderRadius: 26,
        backgroundColor: "#F9FDFF",
        width: "100%",
        overflow: "hidden",
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
    error: {
        color: Colors.red,
        fontSize: RFValue(10),
        fontFamily: FONTS.LexendRegular,
        marginTop: RFValue(1),
    },

    option: {
        padding: 10,
        color: Colors.black,
    },
    searchInput: {
        height: RFValue(40),
        borderColor: Colors.litegray,
        borderWidth: 1,
        borderRadius: 5,
        margin: RFValue(10),
        paddingHorizontal: RFValue(10),
        fontSize: RFValue(14),
        fontFamily: FONTS.LexendRegular,
    },
    galleryimagebg: {
        width: 342,
        height: 50,
        borderWidth: 1,
        borderColor: Colors.litegray,
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
    },
    galleryicon: {
        height: 24,
        width: 24,
    },
    gallerytext: {
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
        paddingLeft: 5,
    },
    cameraimagebg: {
        width: 342,
        height: 50,
        borderWidth: 1,
        borderColor: Colors.litegray,
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
    },
    modal: {
        justifyContent: "flex-end",
        margin: 0,
        backgroundColor: Colors.transparant,
    },
    modalcontainer: {
        flex: 1,
        position: "absolute",
        bottom: 0,
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
        backgroundColor: Colors.white,
        width: "100%",
        paddingTop: 20,
        paddingBottom: 35,
    },
    modalheader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 24,
    },
    headertext: {
        borderBottomWidth: 1,
        borderColor: Colors.black,
        color: Colors.black,
        fontSize: 17,
        paddingBottom: 15,
    },
    profilemodalheader: {
        height: 380,
        width: 380,
        backgroundColor: "#E0F0FF",
        borderRadius: 200,
        position: "absolute",
        top: -210,
        alignSelf: "center",
    },
    userimage: {
        height: 100,
        width: 100,
        alignSelf: "center",
        marginTop: 30,
    },
    remindmenexttext: {
        height: RFValue(41),
        width: "82%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        marginTop: RFValue(10),
        marginBottom: RFValue(30),
        borderWidth: 1,
        borderColor: Colors.litegray,
    },
});
