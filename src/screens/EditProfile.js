import {
  Alert,
  Image,
  // SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Button,
  FlatList,
  TouchableWithoutFeedback,
  PermissionsAndroid,
  Vibration,
  Platform,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import Header from "../components/header";
import { Images } from "../constants/images";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  heightPercentageToDP,
  removeOrientationListener,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import { Colors } from "../constants/color";
import Input from "../components/input";
import CountryPicker from "rn-country-picker";
import { FONTS } from "../constants/fontFamily";
import ButtonComponent from "../components/buttonComponent";
import { RFValue } from "react-native-responsive-fontsize";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { getData, storeData } from "../utils/storeData";
import DropDown from "../components/dropdown";
import DatePicker from "react-native-date-picker";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import apiConstants from "../api/apiConstants";
import Loader from "../components/loading";
import SelectDropdown from "react-native-select-dropdown";
import Modal from "react-native-modal";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import ImagePicker from "react-native-image-crop-picker";
import { RegisterBackContext } from "../constants/GoBackContext";
import MyCountryPiker from "../components/CountryPicker";
import { openSettings, PERMISSIONS, request, RESULTS } from "react-native-permissions";
import { err } from "react-native-svg";
import GooglePlacesInput from "../components/GooglePlacesInput";
import axios from "axios";

// const GOOGLE_API_KEY = "AIzaSyBVCjdibPBQN8s0Iy06ITwgMvrRZZRLcog";

const EditProfile = ({ navigation }) => {
  const { t } = useTranslation();
  const [data, setData] = useState("");
  const [token, setToken] = useState("");
  const [userid, setuserid] = useState("");
  const [email, setEmail] = useState("");
  const [emailerror, setEmailerror] = useState("");
  const [privateemail, setPrivateEmail] = useState("");
  const [privateemailerror, setPrivateEmailerror] = useState("");
  const [password, setPassword] = useState("");
  const [passworderror, setPassworderror] = useState("");
  const [name, setName] = useState("");
  const [nameerror, setNameerror] = useState("");
  const [mname, setmName] = useState("");
  const [mnameerror, setmNameerror] = useState("");
  const [lname, setlName] = useState("");
  const [lnameerror, setlNameerror] = useState("");
  const [countryCode, setCountryCode] = useState("31");
  const [countryCodephone, setCountryCodephone] = useState("31");
  const [number, setNumber] = useState("");
  const [numbererror, setNumbererror] = useState("");
  const [phonenumber, setphoneNumber] = useState("");
  const [phonenumbererror, setphoneNumbererror] = useState("");
  const [date, setDate] = useState(""); // Initial date in "YYYY-MM-DD" format
  const [dateerror, setDateerror] = useState("");
  const [show, setShow] = useState(true);
  const [location, setLocation] = useState("");
  const [locationerror, setLocationerror] = useState("");
  const [address, setAddress] = useState("");
  const [addresserror, setAddresserror] = useState("");
  const [document, setDocument] = useState("");
  const [documenterror, setDocumenterror] = useState("");
  const [bank, setBank] = useState("");
  const [bankerror, setBankerror] = useState("");
  const [service, setService] = useState("");
  const [serviceerror, setServiceerror] = useState("");
  const [facebook, setFacebook] = useState("");
  const [facebookerror, setFacebookerror] = useState("");
  const [linkdin, setLinkdin] = useState("");
  const [linkdinerror, setLinkdinerror] = useState("");
  const [image, setImage] = useState(null);
  const [saluteError, setSaluteError] = useState("");
  const [Nationality, setNationality] = useState("");
  const [Nationalityerror, setNationalityerror] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("31");
  const [filteredCountry, setFilteredCountry] = useState(AllCountry);
  const [selectedItemdepartmnt, setSelectedItemdepartmnt] = useState({});
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [addfocus, setaddFocus] = useState(false);
  const [loding, setLoding] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
  const [natinalselectedItem, setnatinalSelectedItem] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [bankdata, setbankdata] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [modalvisible, setmodalvisible] = useState({ top: 0, left: 0 });
  const [maritalstatus, setMaritalStatus] = useState([]);
  const [maritalstatusid, setMaritalStatusid] = useState("");
  const [searchmarital, setSearchMarital] = useState("");
  const [filteredMarital, setFilteredMarital] = useState([]);
  const [clickmarital, setClickMarital] = useState(false);
  const [selectedMarital, setSelectedMarital] = useState({});
  const [filteredStatus, setFilteredStatus] = useState([]);
  const [AllCountry, setAllCountry] = useState([]);
  const scrollRef = useRef();
  const { RegisterBack, setRegisterBack, GOOGLE_API_KEY, setGOOGLE_API_KEY, setToast } = useContext(RegisterBackContext)

  const handleSelectItem = (selectedItem, index) => {
    setSelectedItem(selectedItem);
    setSaluteError("");
  };


  const Countrydata = async () => {
    try {
      const userdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.get_country_list, {
        customData: {
          token: userdata?.data?.user?.verify_token,
          relaties_id: userdata?.data?.relaties?.id,
          role: userdata?.data?.user?.role
        }
      });
      if (data.status) {
        setAllCountry(data.data);
        console.log("adhbcisuCountry====", data.data);
      } else {
        console.log("False");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    Countrydata();
    requestPermissions();
  }, []);
  const requestPermissions = async () => {
    // console.log("enter conditionnnnnn...-=-=-===--=-=-..");
    if (Platform.OS === "android") {
      try {
        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t("Location Permission"),
            message: t("App needs access to your location"),
          }
        );

        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t("Camera Permission"),
            message: t("App needs access to your camera"),
          }
        );

        // const contactsGranted = await PermissionsAndroid.request(
        //   PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        //   {
        //     title: t("Contacts Permission"),
        //     message: t("App needs access to your contacts"),
        //   }
        // );

        if (
          locationGranted === PermissionsAndroid.RESULTS.GRANTED &&
          cameraGranted === PermissionsAndroid.RESULTS.GRANTED
          //  &&
          // contactsGranted === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log(t("All permissions granted"));
        } else {
          console.log(t("One or more permissions denied"));
        }
      } catch (err) {
        console.warn(err, "catch erroooooooor121212/90909090900900");
      }
    } else if (Platform.OS === "ios") {
      // console.log("enter in ios conditionnnnnn.....");
      try {
        // const locationStatus = await request(
        //   PERMISSIONS.IOS.LOCATION_ALWAYS
        //   // PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        // );
        const cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
        // const contactsStatus = await request(PERMISSIONS.IOS.CONTACTS);
        // console.log({
        //   cameraStatus,
        //   contactsStatus,
        //   // locationStatus,
        // });
        if (
          // locationStatus === RESULTS.GRANTED &&
          cameraStatus === RESULTS.GRANTED
          // &&
          // contactsStatus === RESULTS.GRANTED
        ) {
          console.log("All permissions granted on iOS");
        } else {
          console.log("One or more permissions denied on iOS");
        }

        // Request Geolocation Authorization separately for iOS
        // Geolocation.requestAuthorization();
      } catch (err) {
        console.warn(err, "catch error 12121 -=-=-==-==-=-");
      }
    }
  };


  const handleselectdocument = (selectedItem) => {
    const capitalLetterRegex = /^[A-Z0-9]+$/;

    if (selectedItem === "" || capitalLetterRegex.test(selectedItem)) {
      setDocument(selectedItem);
      setDocumenterror("");
    } else {
      setDocumenterror(t("Only capital letters are allowed."));
    }
  };
  const handleselectIBAN = (selectedItem) => {
    const capitalLetterAndNumberRegex = /^[A-Z0-9]+$/;

    if (selectedItem === "" || capitalLetterAndNumberRegex.test(selectedItem)) {
      setBank(selectedItem);
      setBankerror("");
    } else {
      setBankerror(t("Only capital letters and numbers are allowed."));
    }
  };

  const country = [
    { title: "Nederland" },
    { title: "Suriname" },
    { title: "Polen" },
    { title: "Slowakije" },
    { title: "Roemenië" },
    { title: "Bulgarije" },
    { title: "Afghanistan" },
    { title: "Akrotiri" },
    { title: "Albanië" },
    { title: "Algerije" },
    { title: "Amerikaanse Maagdeneilanden" },
    { title: "Amerikaans-Samoa" },
    { title: "Andorra" },
    { title: "Angola" },
    { title: "Anguilla" },
    { title: "Antarctica" },
    { title: "Antigua en Barbuda" },
    { title: "Arctic Ocean" },
    { title: "Argentinië" },
    { title: "Armenië" },
    { title: "Aruba" },
    { title: "Ashmore and Cartier Islands" },
    { title: "Atlantic Ocean" },
    { title: "Australië" },
    { title: "Azerbeidzjan" },
    { title: "Bahama's" },
    { title: "Bahrein" },
    { title: "Bangladesh" },
    { title: "Barbados" },
    { title: "Belarus" },
    { title: "België" },
    { title: "Belize" },
    { title: "Benin" },
    { title: "Bermuda" },
    { title: "Bhutan" },
    { title: "Bolivië" },
    { title: "Bosnië-Herzegovina" },
    { title: "Botswana" },
    { title: "Bouvet Island" },
    { title: "Brazilië" },
    { title: "British Indian Ocean Territory" },
    { title: "Britse Maagdeneilanden" },
    { title: "Brunei" },
    { title: "Bulgarije" },
    { title: "Burkina Faso" },
    { title: "Burundi" },
    { title: "Cambodja" },
    { title: "Canada" },
    { title: "Caymaneilanden" },
    { title: "Centraal-Afrikaanse Republiek" },
    { title: "Chili" },
    { title: "China" },
    { title: "Christmas Island" },
    { title: "Clipperton Island" },
    { title: "Cocos (Keeling) Islands" },
    { title: "Colombia" },
    { title: "Comoren (Unie)" },
    { title: "Congo (Democratische Republiek)" },
    { title: "Congo (Volksrepubliek)" },
    { title: "Cook" },
    { title: "Coral Sea Islands" },
    { title: "Costa Rica" },
    { title: "Cuba" },
    { title: "Curacao" },
    { title: "Cyprus" },
    { title: "Denemarken" },
    { title: "Dhekelia" },
    { title: "Djibouti" },
    { title: "Dominica" },
    { title: "Dominicaanse Republiek" },
    { title: "Duitsland" },
    { title: "Ecuador" },
    { title: "Egypte" },
    { title: "El Salvador" },
    { title: "Equatoriaal-Guinea" },
    { title: "Eritrea" },
    { title: "Estland" },
    { title: "Ethiopië" },
    { title: "European Union" },
    { title: "Falkland" },
    { title: "Faroe Islands" },
    { title: "Fiji" },
    { title: "Filipijnen" },
    { title: "Finland" },
    { title: "Frankrijk" },
    { title: "Frans-Polynesië" },
    { title: "French Southern and Antarctic Lands" },
    { title: "Gabon" },
    { title: "Gambia" },
    { title: "Gaza Strip" },
    { title: "Georgië" },
    { title: "Ghana" },
    { title: "Gibraltar" },
    { title: "Grenada" },
    { title: "Griekenland" },
    { title: "Groenland" },
    { title: "Guam" },
    { title: "Guatemala" },
    { title: "Guernsey" },
    { title: "Guinea" },
    { title: "Guinee-Bissau" },
    { title: "Guyana" },
    { title: "Haïti" },
    { title: "Heard Island and McDonald Islands" },
    { title: "Heilige Stoel" },
    { title: "Honduras" },
    { title: "Hongarije" },
    { title: "Hongkong" },
    { title: "Ierland" },
    { title: "IJsland" },
    { title: "India" },
    { title: "Indian Ocean" },
    { title: "Indonesië" },
    { title: "Irak" },
    { title: "Iran" },
    { title: "Isle of Man" },
    { title: "Israël" },
    { title: "Italië" },
    { title: "Ivoorkust" },
    { title: "Jamaica" },
    { title: "Jan Mayen" },
    { title: "Japan" },
    { title: "Jemen" },
    { title: "Jersey" },
    { title: "Jordanië" },
    { title: "Kaapverdië" },
    { title: "Kameroen" },
    { title: "Kazachstan" },
    { title: "Kenia" },
    { title: "Kirgizstan" },
    { title: "Kiribati" },
    { title: "Koeweit" },
    { title: "Kosovo" },
    { title: "Kroatië" },
    { title: "Laos" },
    { title: "Lesotho" },
    { title: "Letland" },
    { title: "Libanon" },
    { title: "Liberia" },
    { title: "Libië" },
    { title: "Liechtenstein" },
    { title: "Litouwen" },
    { title: "Luxemburg" },
    { title: "Macao" },
    { title: "Macedonië" },
    { title: "Madagaskar" },
    { title: "Malawi" },
    { title: "Maldiven" },
    { title: "Maleisië" },
    { title: "Mali" },
    { title: "Malta" },
    { title: "Marokko" },
    { title: "Marshall Islands" },
    { title: "Mauritanië" },
    { title: "Mauritius" },
    { title: "Mexico" },
    { title: "Micronesia, Federated States of" },
    { title: "Moldavië" },
    { title: "Monaco" },
    { title: "Mongolië" },
    { title: "Montenegro" },
    { title: "Montserrat" },
    { title: "Mozambique" },
    { title: "Myanmar" },
    { title: "Namibië" },
    { title: "Nauru" },
    { title: "Navassa Island" },
    { title: "Nederland" },
    { title: "Nepal" },
    { title: "Ngwane" },
    { title: "Nicaragua" },
    { title: "Nieuw-Caledonië" },
    { title: "Nieuw-Zeeland" },
    { title: "Niger" },
    { title: "Nigeria" },
    { title: "Niue" },
    { title: "Noordelijke Marianen" },
    { title: "Noord-Korea" },
    { title: "Noorwegen" },
    { title: "Norfolk Island" },
    { title: "Oekraïne" },
    { title: "Oezbekistan" },
    { title: "Oman" },
    { title: "Oostenrijk" },
    { title: "Pacific Ocean" },
    { title: "Pakistan" },
    { title: "Palau" },
    { title: "Panama" },
    { title: "Papoea-Nieuw-Guinea" },
    { title: "Paracel Islands" },
    { title: "Paraguay" },
    { title: "Peru" },
    { title: "Pitcairn" },
    { title: "Polen" },
    { title: "Portugal" },
    { title: "Puerto Rico" },
    { title: "Qatar" },
    { title: "Roemenië" },
    { title: "Rusland" },
    { title: "Rwanda" },
    { title: "Saint Helena" },
    { title: "Saint Lucia" },
    { title: "Saint Vincent en de Grenadines" },
    { title: "Saint-Barthélemy" },
    { title: "Saint-Martin" },
    { title: "Saint-Pierre en Miquelon" },
    { title: "Salomon" },
    { title: "Samoa" },
    { title: "San Marino" },
    { title: "São Tomé en Principe" },
    { title: "Saudi-Arabië" },
    { title: "Senegal" },
    { title: "Servië" },
    { title: "Seychellen" },
    { title: "Sierra Leone" },
    { title: "Singapore" },
    { title: "Sint Maarten" },
    { title: "Sint-Kitts en Nevis" },
    { title: "Slovenië" },
    { title: "Slowakije" },
    { title: "Soedan" },
    { title: "Somalië" },
    { title: "South Georgia and the South Sandwich Islands" },
    { title: "Southern Ocean" },
    { title: "Spanje" },
    { title: "Spratly Islands" },
    { title: "Sri Lanka" },
    { title: "Suriname" },
    { title: "Svalbard" },
    { title: "Syrië" },
    { title: "Tadzjikistan" },
    { title: "Taiwan" },
    { title: "Tanzania" },
    { title: "Thailand" },
    { title: "Timor Leste" },
    { title: "Togo" },
    { title: "Tokelau" },
    { title: "Tonga" },
    { title: "Trinidad en Tobago" },
    { title: "Tsjaad" },
    { title: "Tunesië" },
    { title: "Turkije" },
    { title: "Turkmenistan" },
    { title: "Turks-en Caicoseilanden" },
    { title: "Tuvalu" },
    { title: "Uganda" },
    { title: "Uruguay" },
    { title: "Vanuatu" },
    { title: "Venezuela" },
    { title: "Verenigd Koninkrijk" },
    { title: "Verenigde Arabische Emiraten" },
    { title: "Verenigde Staten van Amerika" },
    { title: "Vietnam" },
    { title: "Wake Island" },
    { title: "Wallis en Futuna" },
    { title: "Wereld" },
    { title: "West Bank" },
    { title: "Westelijke Sahara" },
    { title: "Zambia" },
    { title: "Zimbabwe" },
    { title: "Zuid-Afrika" },
    { title: "Zuid-Korea" },
    { title: "Zuid-Soedan" },
    { title: "Zweden" },
    { title: "Zwitserland" },
  ];

  const formatDateToDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const googlePlacesRef = useRef(null);
  const AddressgooglePlacesRef = useRef(null);

  const OpenGallary = () => {
    const options = {
      mediaType: "photo",
      quality: 0.5,
      storageOptions: { path: "images" },
    };
    launchImageLibrary(options, async (response) => {
      if (!response.didCancel && !response.errorCode) {
        setModalOptionsVisible(false);
        const selectedImageUri = response.assets?.[0]?.uri;
        if (!selectedImageUri) {
          Alert.alert("Error", "Could not retrieve image URI.");
          return;
        }
        console.log("Selected Image URI: ", selectedImageUri);
        setTimeout(async () => {
          try {
            const croppedImage = await ImagePicker.openCropper({
              path: selectedImageUri,
              width: 300,
              height: 300,
              cropping: true,
              cropperCircleOverlay: true,
              cropperActiveWidgetColor: Colors.primary,
              cropperStatusBarColor: Colors.primary,
              cropperChooseColor: Colors.primary,
              cropperChooseText: "Crop",
            });
            console.log("Cropped Image: ", croppedImage);
            setImage(croppedImage);
          } catch (error) {
            console.error("Error cropping image:", error);
          }
        }, 500); // Delay to fix caching issues
      } else if (response.errorCode) {
        Alert.alert("Error", response.errorMessage);
      }
    });
  };

  const requestCameraPermission = async () => {
    const permission =
      Platform.OS === "ios"
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

    const result = await request(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    Alert.alert(
      "Camera Permission",
      "Camera permission is required to take photos",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: openSettings },
      ]
    );

    return false;
  };
  const OpenCamera = async () => {
    // await requestPermissions()
    const allowed = await requestCameraPermission();
    if (!allowed) return;
    try {
      setModalOptionsVisible(false);

      // Small delay for iOS modal close
      setTimeout(async () => {
        const options = {
          mediaType: "photo",
          quality: 1,
          maxWidth: 800,
          maxHeight: 800,
          saveToPhotos: false,
        };

        launchCamera(options, async (response) => {
          if (response.didCancel) {
            return;
          }

          if (response.errorCode) {
            Alert.alert("Camera Error", response.errorMessage || "Something went wrong");
            return;
          }

          if (!response.assets || response.assets.length === 0) {
            return;
          }

          const imageUri = response.assets[0].uri;

          try {
            const croppedImage = await ImagePicker.openCropper({
              path: imageUri,
              width: 300,
              height: 300,
              cropping: true,
              cropperCircleOverlay: true,
              freeStyleCropEnabled: true,
              cropperActiveWidgetColor: Colors.primary,
              cropperStatusBarColor: Colors.primary,
              cropperToolbarColor: Colors.primary,
              cropperToolbarTitle: "Crop Image",
              cropperChooseText: "Done",
              cropperCancelText: "Cancel",
            });

            setImage(croppedImage);
            console.log("Cropped Image:", croppedImage);
          } catch (cropError) {
            console.log("Crop cancelled or failed:", cropError);
          }
        });
      }, 300);
    } catch (error) {
      console.log("Camera open error:", error);
    }
  };




  const selectedValue = (value) => {
    // console.log("value", value);
    setCountryCode(value?.callingCode);
  };
  const selectedValuephone = (value) => {
    // console.log("value", value);
    setCountryCodephone(value?.callingCode);
  };
  const handleTextChange = (txt) => {
    setNumber(txt);
    setNumbererror("");
  };
  const handleTextChangephone = (txt) => {
    setphoneNumber(txt);
    setphoneNumbererror("");
  };

  useEffect(() => {
    // Alert.alert(String(address))
    const fetchData = async () => {

      // setLoding(true)
      try {
        const userdata = await getData("USERDATA");
        const GOOGLEMAPAPIKEY = await getData("GOOGLEMAPAPIKEY");
        setGOOGLE_API_KEY(GOOGLEMAPAPIKEY)
        setData(userdata);
        console.log("USerData Image Cheking : - ", userdata);
        console.log("image && image.path ", image && image.path);


        setuserid(userdata?.data?.user?.id);
        setToken(userdata?.data?.user?.verify_token);
        setName(userdata?.data?.relaties?.voornaam || "");
        setmName(userdata?.data?.relaties?.voorvoegsel || "");
        setlName(userdata?.data?.relaties?.achternaam || "");
        setEmail(userdata?.data?.user?.email?.includes("@dummy.com") ? "" : userdata?.data?.user?.email || "");
        setPrivateEmail(userdata?.data?.relaties?.email_adres_private || "");
        setNumber(userdata?.data?.user?.whatsapp_number || "");
        setphoneNumber(userdata?.data?.relaties?.telefoon || "");
        setDate(userdata?.data?.relaties?.birth_date || "");
        // Alert.alert(String(userdata?.data?.relaties?.birth_date))
        setLocation(userdata?.data?.relaties?.birth_place || "");
        setAddress(userdata?.data?.relaties?.google_maps || "");
        const result = userdata?.data?.user?.country_code
          ? userdata?.data?.user?.country_code.replace("+", "")
          : "31";
        setCountryCode(result);
        setBank(userdata?.data?.relaties?.iban || "");
        setSelectedMarital({
          name: userdata?.data?.relaties?.marital_status || "",
        });
        console.log(
          "marital status log ===",
          userdata?.data?.relaties?.marital_status
        );
        setMaritalStatusid(userdata?.data?.relaties?.marital_status_id || "");
        setDocument(userdata?.data?.relaties?.document_nr || "");
        setService(userdata?.data?.relaties?.bsn_nr || "");
        setFacebook(userdata?.data?.relaties?.website || "");
        setLinkdin(userdata?.data?.relaties?.voertuig_kentekencheck || "");
        setSelectedItem({ title: userdata?.data?.relaties?.aanhef || "" });
        setSelectedCountry(userdata?.user?.countrycode ||
          userdata?.data?.relaties?.country_data || "",
        ); ``
        const countryCodeRaw = userdata?.data?.user?.country_code
          ? userdata?.data?.user?.country_code.replace("+", "")
          : "31";
        setCountryCodephone(countryCodeRaw);
      } catch (error) {
        console.log(error);

      }

    };

    fetchData();
  }, []);
  const formatDateToDDMMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }); // "Jul"
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };
  const handleDateChange = (selectedDate) => {
    const formattedDate = formatDateToDDMMMYYYY(selectedDate); // "26 Jul 1992"
    console.log("===== Formatted Date:", formattedDate);
    setDate(formattedDate); // set in your state
    setOpen(false);
    setDateerror("");
  };

  const OnSave = async () => {
    if (!name?.trim()) {
      setNameerror(t("Naam is vereist"));
      scrollToTop();
      return;
    }

    if (!selectedItem?.title) {
      setSaluteError(t("aanhef is vereist"));
      scrollToTop();
      return;
    }

    if (!lname?.trim()) {
      setlNameerror(t("achternaam is vereist"));
      scrollToTop();
      return;
    }

    if (!address?.trim()) {
      setAddresserror(t("Require Address"));
      scrollToTop();
      return;
    }

    if (email && !isValidEmail(email)) {
      setEmailerror(t("Invalid email format"));
      scrollToTop();
      return;
    }

    if (privateemail && !isValidEmail(privateemail)) {
      setPrivateEmailerror(t("Invalid email format"));
      scrollToTop();
      return;
    }

    if (password && password.length < 8) {
      setPassworderror(t("Password must be at least 8 characters"));
      scrollToTop();
      return;
    }

    saveData();
  };
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const scrollToTop = () => {
    scrollRef.current?.scrollToPosition(0, 0, true);
  };
  const parseCustomDate = (dateStr) => {
    if (!dateStr) return new Date('1990-01-01');

    const [day, month, year] = dateStr.split('-');
    const fullYear = +year.length === 2 ? `20${year}` : year;
    const isoDate = `${fullYear}-${month}-${day}`;
    const parsed = new Date(isoDate);

    return isNaN(parsed) ? new Date('1990-01-01') : parsed;
  };
  const getImageData = (image) => {
    if (!image) return null; // No image provided

    // const isLocalFile = image.path.startsWith("file://");
    // const imagePath = isLocalFile ? image.path : image.path; // Adjust path conditionally
    // console.log("imagePath", imagePath);
    // console.log("imagePath", isLocalFile);

    // console.log('jksdfciklsjfisjiojs',imagePath);
    return {
      uri: image.path,
      name: "image",
      type: image.mime || "image/jpeg", // Default MIME type
    };
  };

  // console.log("kdjhcoisd-=-=-=-==-dtfbgtr-=-==-==,.,.,.", image.path);
  // console.log("kdjhcoisd-=-=-=-==-dfbdfg-=-=-=,.,.", image.mime);

  const saveData = async () => {
    if (!address || !address.trim()) {
      setAddresserror(t("Require Address"));
      return;
    }

    try {
      setLoding(true);

      const profileImage =
        image
          ? getImageData(image)
          : data?.data?.relaties?.file_path
            ? getImageData({
              path: data.data.relaties.file_path,
              mime: "image/jpeg",
            })
            : null;

      const payload = {
        token,
        aanhef: selectedItem?.title || "",
        user_id: userid || "",
        username: `${name || ""} ${mname || ""} ${lname || ""}`.trim(),
        voornaam: name || "",
        voorvoegsel: mname || "",
        achternaam: lname || "",
        google_maps: address,
        country: selectedCountry?.id || "",
        email: email || "",
        email_adres_private: privateemail || "",
        password: password || "",
        whatsapp_number: number || "",
        country_code: countryCode || "",
        birth_date: date || "",
        birth_place: location || "",
        iban: bank || "",
        marital_status: selectedMarital?.id || maritalstatusid || "",
        document_nr: document || "",
        bsn_nr: service || "",
        facebook_url: facebook || "",
        voertuig_kentekencheck: linkdin || "",
        contact_telefoon: phonenumber || "",
        contact_telefoon_country_code: countryCodephone || "",
        profile_image: profileImage,
      };

      console.log("Profile Edit Data :", payload);

      const response = await ApiService(apiConstants.updateProfile, {
        customData: payload,
      });

      if (response?.status) {
        await storeData("USERDATA", response);

        setTimeout(() => {
          navigation.navigate("Profile");
        }, 500);
      } else {
        setToast({
          top: 45,
          text: response?.data?.message || response?.message || "Update failed",
          type: "error",
          visible: true,
        });

      }
    } catch (error) {
      console.log("Profile update error:", error);
      if(axios.isAxiosError(error) && error.response){
        const errorMessage = error.response.data?.message || "Something went wrong. Please try again.";
        setToast({
          top: 45,
          text: errorMessage,
          type: "error",
          visible: true,
        });
      }
    } finally {
      setLoding(false);
    }
  };

  const selectbank = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.bank, {
        includeToken: true,
        relaties_id: getdata.data.relaties.id,
        role: getdata.data.user.role,
        user_id: getdata.data.user.id,
      });
      if (data.status) {
        setbankdata(data.data);
        //  console.log(data.data,'ujbehrfikluvdenv======');
      } else {
        console.log("Failed to fetch connections.");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredData(bankdata);
    } else {
      const filtered = bankdata.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, bankdata]);

  const selectMaritalstatus = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.maritalstatus, {
        includeToken: true,
        relaties_id: getdata.data.relaties.id,
        role: getdata.data.user.role,
        user_id: getdata.data.user.id,
      });
      if (data.status) {
        setMaritalStatus(data.data);
        //  console.log(data.data,'ujbehrfikluvdenv======');
      } else {
        console.log("Failed to fetch connections.");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    selectbank();
    selectMaritalstatus();
  }, []);

  useEffect(() => {
    if (searchmarital === "") {
      setFilteredStatus(maritalstatus);
    } else {
      const filtered = maritalstatus.filter((item) =>
        item.name.toLowerCase().includes(searchmarital.toLowerCase())
      );
      setFilteredStatus(filtered);
    }
  }, [searchmarital, maritalstatus]);

  const handleMaritalStatus = () => {
    setClickMarital(false);
  };

  const handlenatinalSelectItem = (item) => {
    console.log("nationalityyy", item.name, item);
    setnatinalSelectedItem(item.name);
    setSelectedCountry(item);
    setSearchQuery("");
    setIsOpen(false);
  };

  const filterCountries = () => {
    if (searchQuery === "") {
      setNationality(AllCountry);
      console.log("country", AllCountry);
    } else {
      const filtered = AllCountry.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCountry(filtered);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFilteredCountry(AllCountry);
    } else {
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    filterCountries(query);
  };

  return (
    // <SafeAreaView style={{ flex: 1, backgroundColor: Colors.primary }}>
    <>
      <BlueHeader
        title={t("Profiel bewerken")}
        bgcolor={Colors.primary}
      // Righticon={Images.refresh}
      // onPressRight={() => fetchData()}
      />


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

        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          enableOnAndroid
          extraScrollHeight={70}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
          style={styles.searchBarStyle}
        >
          {loding && <Loader />}

          <View style={styles.headerview}>

            <Image
              source={
                image && image.path && image && image.path !== null
                  ? { uri: image.path }
                  : data?.data?.user?.profile_image
                    ? { uri: data.data.user?.profile_image }
                    : Images.userblanck
              }
              style={styles.imageview}
            />
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
              style={styles.modalback}
            >
              <View style={styles.modalcontainer}>
                <View style={styles.modalheader}>
                  <Text style={styles.modalheadername}>
                    {t("Kies afbeelding")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalOptionsVisible(false)}
                  >
                    <Image style={styles.commonicon} source={Images.close} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setModalOptionsVisible(false);
                    OpenCamera();
                  }}
                >
                  <View style={styles.modalbtns}>
                    <Image
                      style={styles.commonicon}
                      source={Images.camera}
                    ></Image>
                    <Text style={styles.modalbtntext}>{t("Camera")}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setModalOptionsVisible(true);
                    OpenGallary();
                  }}
                >
                  <View style={styles.modalbtns}>
                    <Image style={styles.commonicon} source={Images.gallery} />

                    <Text style={styles.modalbtntext}>{t("Galerij")}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Modal>

            <TouchableOpacity
              onPress={() => setModalOptionsVisible(true)}
              style={styles.editbg}
            >
              <Image source={Images.edit} style={styles.editbtn} />
            </TouchableOpacity>
          </View>

          <View style={styles.maindataview}>
            <Text style={styles.title}>{t("Aanhef")}</Text>
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
                      {selectedItem?.title
                        ? selectedItem?.title
                        : selectedItem?.title}
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
              value={name}
              onChangeText={(txt) => {
                setName(txt);
                setNameerror("");
                // }
              }}
              title={t("Voornaam")}
              iconSource={Images.name}
              error={nameerror}
            />

            <Input
              value={mname}
              onChangeText={(txt) => {
                setmName(txt);
                setmNameerror, "";
              }}
              title={t("Voorvoegsel")}
              iconSource={Images.name}
              error={mnameerror}
            />

            <Input
              value={lname}
              onChangeText={(txt) => {
                setlName(txt);
                setlNameerror("");
              }}
              title={t("Achternaam")}
              iconSource={Images.name}
              error={lnameerror}
            />

            <Input
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                setEmailerror("");
              }}
              title={t("E-mail")}
              iconSource={Images.mail}
              error={emailerror}
            />

            <Input
              value={privateemail}
              onChangeText={(txt) => {
                setPrivateEmail(txt);
                setPrivateEmailerror("");
              }}
              title={t("Prive E-mail")}
              iconSource={Images.mail}
              error={privateemailerror}
            />


            <Text style={[styles.title, { marginTop: 1 }]}>
              {t("Adres")}
            </Text>
            <View style={styles.address}>
              <GooglePlacesInput
                InputStyle={{ backgroundColor: Colors.litegray1 }}
                apiKey={GOOGLE_API_KEY}
                value={address}
                onChangeText={setAddress}
                Icon={Images.location}
                onSelect={(item) => {
                  setAddress(item.description);
                  setAddresserror("");

                }}
                placeholder={t("Address Location")}
              />

              <Text style={styles.error}>{addresserror}</Text>
            </View>

            <Input
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                setPassworderror("");
              }}
              title={t("Wachtwoord")}
              iconSource={Images.lock}
              secureTextEntry={show ? true : false}
              rightIcon={show ? Images.eyeoff : Images.eye}
              onPress={() => setShow(!show)}
              color={Colors.black}
              error={passworderror}
            />

            <Text style={styles.title}>{t("WhatsApp nummer")}</Text>
            {/* <View style={styles.country}>
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
                selectedCountryTextStyle={styles.selectedCountryTextStyle}
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
                maxLength={10}
                placeholderTextColor={Colors.textgray}
                keyboardType="number-pad"
                placeholder={data.whatsapp_number}
                style={styles.input}
              />
            </View> */}
            <MyCountryPiker
              // key={countryCode}
              defaultCountry={countryCode}
              favorites={["IN", "NL", "SR"]}

              onSelect={(country) => {
                setCountryCode(country?.countrycode)
                console.log("Selected country:", country);
              }}
              showFlag={true}
              setValue={setNumber}
              value={number}
              showCallingCode={true}
              showPhoneInput={true}
              test={false} // validation on
              FontFamily={FONTS.LexendMedium}
            // ContainerStyle={{ backgroundColor: Colors.white }}
            />
            <Text style={styles.error}>{numbererror}</Text>

            <Text style={styles.title}>{t("Telefoon")}</Text>
            {/* <View style={styles.country}>

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
                selectedCountryTextStyle={styles.selectedCountryTextStyle}
                dropDownIconStyle={{ tintColor: Colors.black }}
                countryNameTextStyle={styles.countryNameTextStyle}
                searchBarPlaceHolder={t("Selecteer land")} //
                hideCountryFlag={false}
                hideCountryCode={false}
                searchBarContainerStyle={styles.searchBarStyle} //
                searchInputStyle={{ color: Colors.black }}
                countryCode={countryCodephone} //
                selectedValue={selectedValuephone} //
              />
              <TextInput
                value={phonenumber}
                onChangeText={handleTextChangephone}
                maxLength={10}
                placeholderTextColor={Colors.textgray}
                keyboardType="number-pad"
                placeholder={data.whatsapp_number}
                style={styles.input}
              />
     
            </View> */}
            <MyCountryPiker
              defaultCountry={countryCodephone}
              favorites={["IN", "NL", "SR"]}
              // key={countryCodephone}
              onSelect={(country) => {
                setCountryCodephone(country?.countrycode)
                console.log("Selected country:", country);
              }}
              showFlag={true}
              setValue={setphoneNumber}
              value={phonenumber}
              showCallingCode={true}
              showPhoneInput={true}
              test={false} // validation on
              FontFamily={FONTS.LexendMedium}
            // ContainerStyle={{ backgroundColor: Colors.white }}
            />
            <Text style={styles.error}>{phonenumbererror}</Text>

            <Text style={[styles.title, { marginTop: 1 }]}>
              {t("Geboortedatum")}
            </Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setOpen(true)}
            >
              <Image
                source={Images.date}
                style={{ tintColor: Colors.textgray, height: 24, width: 24 }}
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

            <DatePicker
              modal
              mode="date"
              date={date && !isNaN(new Date(date)) ? new Date(date) : new Date('1990-01-01')}
              // date={parseCustomDate(date)}
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

            <Text style={styles.error}>{dateerror}</Text>
            <Text style={[styles.title, { marginTop: 1 }]}>
              {t("Geboorteplaats")}
            </Text>
            <View style={styles.address}>
              <GooglePlacesInput
                InputStyle={{ backgroundColor: Colors.litegray1 }}
                apiKey={GOOGLE_API_KEY}
                value={location}
                onChangeText={setLocation}
                Icon={Images.location}

                onSelect={(item) => {
                  setLocation(item.description);
                }}
                placeholder={t("Geboorteplaats Place")}
              />

              <Text style={styles.error}>{locationerror}</Text>
            </View>

            <Text style={styles.title}>{t("Nationaliteit")}</Text>
            <TouchableOpacity
              onPress={toggleDropdown}
              style={styles.dropdownButtonStyle}
            >
              <Text style={styles.dropdownButtonTxtStyle}>
                {selectedCountry?.name
                  ? selectedCountry.name
                  : t("Kies Nationaliteit")}
              </Text>
              <Image
                source={Images.down}
                style={{ height: 20, width: 20, tintColor: Colors.black }}
              />
            </TouchableOpacity>

            {isOpen && (
              <Modal
                animationType="fade"
                transparent={true}
                visible={isOpen}
                onRequestClose={toggleDropdown}
              >
                <TouchableWithoutFeedback onPress={toggleDropdown}>
                  <View style={styles.modalbg}>
                    <TouchableWithoutFeedback>
                      <View style={styles.nationalitymodal}>
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search......."
                          placeholderTextColor={"gray"}
                          value={searchQuery}
                          onChangeText={handleSearchChange}
                        />
                        <FlatList
                          data={filteredCountry}
                          renderItem={({ item }) => {
                            return (
                              <TouchableOpacity
                                onPress={() => handlenatinalSelectItem(item)}
                                style={styles.dropdownItemStyle}
                              >
                                <Text style={styles.dropdownItemTxtStyle}>
                                  {item.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          }}
                          keyExtractor={(item) => item.id}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            )}
            <Text style={styles.error}>{Nationalityerror}</Text>

            <Input
              value={bank}
              onChangeText={handleselectIBAN}
              title={t("IBAN")}
              iconSource={Images.bank}
              error={bankerror}
              autoCapitalize="characters"
              keyboardType="default"
            />

            <Text style={styles.title}>{t("Burgerlijke staat")}</Text>
            <TouchableOpacity
              style={[styles.dropdownButtonStyle]}
              onPress={() => setClickMarital(!clickmarital)}
            >
              <Text style={styles.dropdownButtonTxtStyle}>
                {selectedMarital?.name
                  ? t(selectedMarital.name)
                  : t("Kies Burgelijke staat")}
              </Text>
              {/* <Text>{selectedMarital.name}</Text> */}
              <Image
                source={Images.down}
                style={{
                  height: 20,
                  width: 20,
                  tintColor: Colors.black,
                }}
              />
            </TouchableOpacity>
            {clickmarital ? (
              <Modal
                animationType="fade"
                transparent={true}
                visible={clickmarital}
                backdropOpacity={0.5}
              >
                <TouchableWithoutFeedback onPress={handleMaritalStatus}>
                  <View style={styles.modalbg}>
                    <TouchableWithoutFeedback>
                      <View style={styles.maritalstatusmodal}>
                        <TextInput
                          style={[styles.searchInput, { marginBottom: 10 }]}
                          placeholder={t("Search.......")}
                          placeholderTextColor={"gray"}
                          value={searchmarital}
                          onChangeText={(text) => setSearchMarital(text)}
                        />
                        <FlatList
                          data={filteredStatus}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <ScrollView scrollEnabled={false}>
                              <TouchableOpacity
                                style={styles.dropdownItemStyle}
                                onPress={() => {
                                  setSelectedMarital(item);
                                  setClickMarital(false);
                                }}
                              >
                                <Text style={styles.dropdownItemTxtStyle}>
                                  {t(item.name)}
                                </Text>
                              </TouchableOpacity>
                            </ScrollView>
                          )}
                          style={{ flexGrow: 0 }}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            ) : null}

            <Input
              value={document}
              onChangeText={handleselectdocument}
              autoCapitalize="characters"
              keyboardType="default"
              title={t("Document nr ( ID/Paspoort )")}
              iconSource={Images.document}
              error={documenterror}
            />

            <Input
              value={service}
              onChangeText={(txt) => {
                setService(txt);
                setServiceerror("");
              }}
              title={t("Burgerservicenummer (BSN)")}
              iconSource={Images.one}
              error={serviceerror}
              keyboardType="number-pad"
            />

            {/* <Input
              value={facebook}
              onChangeText={(txt) => {
                setFacebook(txt);
                setFacebookerror("");
              }}
              title={t("Facebook")}
              iconSource={Images.facebook}
              error={facebookerror}
            />
            <Input
              value={linkdin}
              onChangeText={(txt) => {
                setLinkdin(txt);
                setLinkdinerror("");
              }}
              title={t("LinkedIn")}
              iconSource={Images.linkdin}
              error={linkdinerror}
            /> */}
            <ButtonComponent
              onPress={OnSave}
              marginTop={RFValue(15)}
              title={t("Opslaan")}
              marginBottom={RFValue(30)}
            />
          </View>
        </KeyboardAwareScrollView>
        <Modal
          isVisible={loding}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Loader color={Colors.primary} />
          </View>
        </Modal>
      </View>
      {/* </SafeAreaView> */}
    </>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  closebtn: {
    borderColor: Colors.white,
    padding: 10,
    borderWidth: 1,
    position: "absolute",
    top: 20,
    right: 30,
    borderRadius: 10,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: "40%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.white,
    fontSize: RFValue(12),
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  previewImage: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
  },
  country: {
    height: heightPercentageToDP(7),
    alignItems: "center",
    flexDirection: "row",
    marginTop: 15,
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
    alignItems: "center",
    borderRadius: 10,
    fontSize: 16,
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    backgroundColor: Colors.litegray1,
    borderColor: "transparent",
    // backgroundColor:Colors.lightprimary
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
    // flex: 1,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginTop: RFValue(5),
  },
  dateInput: {
    width: widthPercentageToDP(88),
    height: heightPercentageToDP(7),
    // backgroundColor: Colors.white,
    borderRadius: 10,
    borderColor: Colors.litegray,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",

    marginBottom: 10,
  },
  dateInputText: {
    fontSize: RFValue(12),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    paddingLeft: 15,
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
    zIndex: 222,
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
    width: "50%",
    height: heightPercentageToDP(7),
    // backgroundColor:Colors.red
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
    marginLeft: "3%",
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
  modalOptionsContainer: {
    position: "absolute",
    top: 30,
    right: 4,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "space-around",
    elevation: 5,
    padding: 10,
  },
  option: {
    padding: 10,
    color: Colors.black,
  },
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
  searchInput: {
    height: RFValue(40),
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 5,
    margin: RFValue(10),
    paddingHorizontal: RFValue(10),
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  headerview: {
    paddingHorizontal: 24,
    marginTop: 24,
    borderRadius: 7,
    alignItems: "center",
    paddingBottom: 40,
    marginHorizontal: 24,
  },
  imageview: {
    height: 90,
    width: 90,
    alignSelf: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.litegray,
  },
  modalback: {
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
  modalheadername: {
    borderBottomWidth: 1,
    borderColor: Colors.black,
    color: Colors.black,
    fontSize: 17,
    paddingBottom: 15,
  },
  commonicon: {
    height: 24,
    width: 24,
  },
  modalbtns: {
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
  modalbtntext: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    paddingLeft: 5,
  },
  editbg: {
    height: 40,
    width: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    alignSelf: "center",
    top: 70,
    right: widthPercentageToDP(28),
  },
  editbtn: {
    height: 20,
    width: 20,
  },
  maindataview: {
    paddingHorizontal: 24,
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
  modalbg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  nationalitymodal: {
    width: "100%",
    maxHeight: 300,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 10,
    marginTop: 10,
  },
  maritalstatusmodal: {
    width: "95%",
    height: 300,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 10,
    flexDirection: "column",
  },
});
