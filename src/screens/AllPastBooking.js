import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import BlueHeader from "../components/BlueHeader";
import { useIsFocused, useRoute } from "@react-navigation/native";
import { t } from "i18next";
import { Images } from "../constants/images";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import Modal from "react-native-modal";
import { RFValue } from "react-native-responsive-fontsize";
import { getData, storeData } from "../utils/storeData";
import ApiService from "../utils/Apiservice";
import "moment/locale/nl";
import apiConstants from "../api/apiConstants";
import SelectDropdown from "react-native-select-dropdown";
import { RegisterBackContext } from "../constants/GoBackContext";
import axios from "axios";
import DatePicker from "react-native-date-picker";
import moment from "moment";
export default function AllPastBooking({ navigation }) {
  const { itemData } = useRoute().params || {};
  const isFocused = useIsFocused();
  const [search, setSearch] = useState("");
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [StutsData, setStutsData] = useState([]);
  const [UserData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [TodayDate, setTodayDate] = useState();
  const { height } = Dimensions.get("screen");
  const [step, setstep] = useState(0);
  const [company, setCompany] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [tripType, setTripType] = useState("");
  const [AllTripTypeData, setAllTripTypeData] = useState([]);
  const [tripdetails, setTripDetails] = useState("");
  const [tripTypeError, settripTypeError] = useState("");
  const [tripDetailsError, setTripDetailsError] = useState("");
  const [selectPickupLocation, setselectPickupLocation] = useState("");
  const [selectDropLocation, setselectDropLocation] = useState("");
  const [selectPickupLocationError, setselectPickupLocationError] =
    useState("");
  const [selectDropLocationError, setselectDropLocationError] = useState("");
  const [extraAddres, setExtraAddress] = useState([]);
  const [AddressValue, setAddressValue] = useState("");
  const [SuggestionAddress, setSuggestionAddress] = useState([]);
  const [Pickuptime, setPickupTime] = useState("");
  const [DropTime, setDropTime] = useState("");
  const [TotalPerson, setTotalPerson] = useState("");
  const [TotalSuitcase, setTotalSuitcase] = useState("0");
  const [TotalTrolly, setTotalTrolly] = useState("0");
  const [selectCurrency, setSelectCurrency] = useState({
    code: "SRD",
    id: 3,
    symbol: "SRD",
  });
  const [PickuptimeError, setPickuptimeError] = useState("");
  const [TotalPersonError, setToatalPersonError] = useState("");
  const [TotalSuitcaseError, setTotalSuitcaseError] = useState("");
  const [TotalTrollyError, setTotalTrollyError] = useState("");
  const [selectCurrencyError, setSelectCurrencyError] = useState("");
  const [OpenTime, setOpenTime] = useState(null);
  const [selctCategoryVehicalError, setselctCategoryVehicalError] =
    useState("");
  const [SelectCar, setSelectCar] = useState("");
  const [SelectCarError, setSelectCarError] = useState("");
  const [AddComment, setAddComment] = useState("");
  const [relatie, setRelatie] = useState("");
  const [AllCurrency, setAllCurrency] = useState([]);
  const [AllTripDetailsData, setAllTripDetailsData] = useState([]);
  const [AllAddressData, setAllAddressData] = useState([]);
  const [AllVehicals, setAllVehicals] = useState([]);
  const [AllCompanyData, setAllCompanyData] = useState([]);
  const [VehicalCategory, setVehicalCategory] = useState([]);
  const [AllReletiesData, setAllRelatiesData] = useState([]);
  const [Price, setPrice] = useState("");
  const [SelectVehicalCategory, setSelectVehicalCategory] = useState("");
  const [AllPaymentMethod, setAllPaymentMethod] = useState([]);
  const [SelectPaymentMethod, setSelectPaymentMethod] = useState("");
  const [AllTours, setAllTours] = useState([]);
  const [SelectTours, setSelectTours] = useState("");
  const [ToursPrice, setToursPrice] = useState("");
  const [open, setOpen] = useState(false);
  const [editdate, setEditDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [editdateformate, setEditDateformate] = useState();
  const [showaddpickup, setShowAddpickup] = useState(false);
  const [pickupaddress, setPickupaddress] = useState("");
  const [showaddend, setShowaddend] = useState(false);
  const [endAddress, setEndAddress] = useState("");
  const [countryforsuggestion, setCountryforsuggestion] = useState("");
  const [SuggestionAddressend, setSuggestionAddressend] = useState([]);
  const [AllPermission, setPermissions] = useState(null);
  const formatDatee = (date) => {
    return moment(date).locale("nl").format("dddd, D MMMM YYYY");
  };
  const getCurrentDate = () => {
    const today = new Date();

    // Dutch formatted date (e.g., '09 okt. 2024')
    const options = { day: "2-digit", month: "short", year: "numeric" };
    const formattedDate1 = today.toLocaleDateString("nl-NL", options);
    const [day, month, year] = formattedDate1.split(" ");
    const currentDate = `${day} ${month} ${year}`;

    // ISO format (YYYY-MM-DD)
    const yearNumeric = today.getFullYear();
    const monthNumeric = String(today.getMonth() + 1).padStart(2, "0");
    const dayNumeric = String(today.getDate()).padStart(2, "0");
    const formatDate = `${yearNumeric}-${monthNumeric}-${dayNumeric}`;

    return { currentDate, formatDate };
  };

  const { currentDate, formatDate } = getCurrentDate();
  const { RegisterBack, setRegisterBack, GOOGLE_API_KEY, setGOOGLE_API_KEY } =
    useContext(RegisterBackContext);
  const handleDateChange = (selectedDate) => {
    const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
    console.log(formattedDate, "formattedDate", selectedDate);

    setEditDateformate(formattedDate);
    console.log(selectedDate, formattedDate);
    if (selectedDate) {
      setEditDate(selectedDate);
    }
    setOpen(false);
  };
  useEffect(() => {
    StusSearch();
    const date = new Date();
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    const formatted = `${dayName} ${day} ${month} ${year}`;
    setTodayDate(formatted);
    // Alert.alert(String(formatted))
  }, [isFocused]);

  const AllCreateTaxiData = async (itemdata = null, Tours) => {
    try {
      const userData = await getData("USERDATA");
      const user = userData?.data?.user;
      const relatie = userData?.data?.relaties;

      console.log("USERDATA", userData?.data);

      if (!user || !relatie) return;

      const baseParams = {
        token: user.verify_token,
        relaties_id: relatie.id,
        role: user.role,
        user_id: user.id,
      };

      const trip = await ApiService(apiConstants.get_trip_types_and_details, {
        includeToken: true,
        customData: {
          ...baseParams,
          type_of_trip: tripType?.id || "",
          price_vehicle_id: itemdata?.id || SelectVehicalCategory?.id || "",
          currency: selectCurrency?.code || "",
        },
      });

      if (step >= 3 || step == 2) {
        const addressRes = await ApiService(apiConstants.get_relatie_address, {
          includeToken: true,
          customData: {
            ...baseParams,
            currency: selectCurrency?.code,
            tour_id: Tours?.id || SelectTours?.id || "",
          },
        });
        console.log("ADDDRRREEESSS", addressRes);

        if (Boolean(addressRes?.status)) {
          const mergedAddresses = [];
          const data = [
            addressRes?.payment_method_first,
            addressRes?.payment_method_second,
            addressRes?.payment_method_third,
            addressRes?.payment_method_four,
          ];
          setAllPaymentMethod(data);
          addressRes?.data?.forEach((item, index) => {
            if (item?.relatie_address) {
              mergedAddresses.push({
                id: `relatie_${index}`,
                destination_address: item.relatie_address,
              });
            }

            if (Array.isArray(item?.relatie_extra_address)) {
              item.relatie_extra_address.forEach((extra) => {
                if (extra?.destination_address) {
                  mergedAddresses.push({
                    id: extra.id,
                    destination_address: extra.destination_address,
                  });
                }
              });
            }
          });
          setAllAddressData(mergedAddresses);
          setAllTours(addressRes?.tour_name || []);
          setToursPrice(addressRes?.priceData || []);
        }
      }

      if (trip?.status) {
        setCountryforsuggestion(trip?.country_data || {});
        const categoryIdForPrice = itemdata?.id ?? SelectVehicalCategory?.id;
        const matchedCategory = trip?.category?.find(
          (el) => el?.id == categoryIdForPrice
        );
        const nextVehiclePrice =
          matchedCategory?.matched_price ??
          SelectVehicalCategory?.matched_price ??
          0;
        setPrice(nextVehiclePrice);
        setAllTripTypeData(trip?.type_of_trip || []);
        setVehicalCategory(trip?.category || []);
        console.log("trip*/*/", trip.country_data);

        setAllCurrency(trip?.all_currency || []);

        if (Array.isArray(trip?.tripDetails) && trip.tripDetails.length > 0) {
          setAllTripDetailsData(trip?.tripDetails);
        }
      }
    } catch (error) {
      console.error("AllCreateTaxiData Error:", error);
    }
  };

  useEffect(() => {
    // Alert.alert(`${item?.from_date?.includes(TodayDate)}`)
    const fetchPermission = async () => {
      try {
        const getdata = await getData("USERDATA");
        console.log("Permi userdata", getdata);

        if (
          !getdata ||
          !getdata.data ||
          !getdata.data.user ||
          !getdata.data.relaties
        ) {
          console.log("Missing required user data:", getdata);
          return;
        }

        const response = await ApiService(apiConstants.permission, {
          includeToken: true,
          customData: {
            relaties_id: getdata.data.relaties.id,
            user_id: getdata.data.user.id,
            role: getdata.data.user.role,
          },
        });

        // ✅ Check response.status === 200 or expected code
        if (response?.data) {
          setPermissions(response.data);
          console.log("response.data Permission ==>", response.data);
        } else {
          console.log("Unexpected response format or error:", response);
        }
      } catch (error) {
        console.log("Error fetching permission:", error);
      }
    };

    fetchPermission();
  }, []);

  useEffect(() => {
    const getVehical = async () => {
      const data = await getData("USERDATA");
      let datas = data.data;
      // console.log("User_DATa", datas);

      try {
        const vehicle_categoriesCar = await ApiService(
          apiConstants.get_vehicle_categories_cars,
          {
            includeToken: true,
            customData: {
              token: datas.user.verify_token,
              relaties_id: datas.relaties.id,
              role: datas.user.role,
              user_id: datas.user.id,
              currency: selectCurrency?.symbol,
              total_suitcase: TotalSuitcase,
              total_person: TotalPerson,
              total_trolly: TotalTrolly,
            },
          }
        );

        // console.log("vehicle_categoriesCar", vehicle_categoriesCar);

        if (
          vehicle_categoriesCar?.success &&
          Array.isArray(vehicle_categoriesCar.category)
        ) {
          const AllVehicals = vehicle_categoriesCar.category
            .filter(
              (el) =>
                Array.isArray(el.vehicle_data) && el.vehicle_data.length > 0
            )
            .flatMap((el) =>
              el.vehicle_data.map((subel) => ({
                id: subel.id,
                display_name: subel.display_name,
              }))
            );

          // console.log("AllVehicals", AllVehicals);
          setAllVehicals(AllVehicals);
        }
      } catch (error) {
        console.log("Vehical Get Error:-", error);
      }
    };

    if (step <= 3 || step == 5) {
    //   AllCreateTaxiData();
    }

    if (step <= 5) {
      getVehical();
    }
  }, [step, tripType]);

  const handleSearch = async (text) => {
    if (text.length < 3 || text.length > 10) return null;
    const components = countryforsuggestion
      ? Object.values(countryforsuggestion)
        .map((countryName) => {
          // you need a mapping from countryName -> ISO code
          // e.g. Suriname -> "sr"
          return `country:sr`;
        })
        .join("|")
      : null;
    try {
      const res = await axios.get(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        {
          params: {
            input: text,
            key: GOOGLE_API_KEY,
            ...(components && { components }),
          },
        }
        // {
        //   params: {
        //     input: text,
        //     key: GOOGLE_API_KEY,

        //   },
        // }
      );
      // Alert.alert("")
      console.log("res Suggest", res);

      setSuggestionAddress(res.data.predictions);
      return text;
    } catch (err) {
      console.warn("Suggestion Error:", err);
    }
  };
  const handleSearchend = async (text) => {
    if (text.length < 3 || text.length > 30) return null;
    try {
      const res = await axios.get(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        {
          params: {
            input: text,
            key: GOOGLE_API_KEY,
          },
        }
      );
      // Alert.alert("")
      console.log("res Suggest", res);

      setSuggestionAddressend(res.data.predictions);
      return text;
    } catch (err) {
      console.warn("Suggestion Error:", err);
    }
  };

  const handleSelect = async (description) => {
    try {
      setSuggestionAddressend([]);
      setSuggestionAddress([]);
      setAddressValue("");
      setExtraAddress([...extraAddres, description?.description]);
    } catch (err) {
      console.warn("Place Detail Error:", err);
    }
  };
  const handleSelectaddress = async (description) => {
    try {
      setSuggestionAddress([]);
      setAddressValue("");
      setSuggestionAddressend([]);
      setPickupaddress(description?.description);
    } catch (err) {
      console.warn("Place Detail Error:", err);
    }
  };
  const handleSelectpickup = async (description) => {
    try {
      setSuggestionAddressend([]);
      setSuggestionAddress([]);
      setAddressValue("");
      setEndAddress(description?.description);
    } catch (err) {
      console.warn("Place Detail Error:", err);
    }
  };

  const StusSearch = async () => {
    try {
      const data = await getData("USERDATA");
      // console.log("USERDATA TACXIU", data);

      if (data.data !== null) {
        let datas = data.data;
        setUserData(datas);
        try {
          let res = await ApiService(apiConstants.get_driver_trip_details, {
            includeToken: true,
            customData: {
              token: datas.user.verify_token,
              relaties_id: datas.relaties.id,
              role: datas.user.role,
              user_id: datas.user.id,
              is_past_bookings:1,
            },
          });
          console.log("restaxi", res.data);

          setStutsData(res?.data);
          // console.log("Present Taxi Data:-", {
          //     "token": datas.user.verify_token,
          //     "relaties_id": datas.relaties.id,
          //     // "relaties_id": 71,
          //     "role": datas.user.role,
          //     "user_id": datas.user.id
          // });
        } catch (error) {
          console.log("get_driver_trip_details Error:- ", error);
        }
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };
  const onRefresh = () => {
    setRefreshing(true);
    StusSearch();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  const handleStep = () => {
    setCompanyError("");
    setTripDetailsError("");
    settripTypeError("");
    setselectDropLocationError("");
    setselectPickupLocationError("");
    setPickuptimeError("");
    setToatalPersonError("");
    setTotalSuitcaseError("");
    setTotalTrollyError("");
    setSelectCurrencyError("");
    // setRelatie("");

    switch (step) {
      case 1:
        setstep((prev) => prev + 1);
        // if (relatie !== null && relatie) {
        //     setstep(prev => prev + 1);
        // } else {
        //     setCompanyError(t("Please Enter Releties"));
        //     return
        // }
        break;

      case 2:
        const isTripTypeValid = tripType !== null && tripType;
        const isTripDetailsValid = tripdetails !== null && tripdetails;
        const currency = selectCurrency !== null && selectCurrency;

        if (!isTripTypeValid) {
          settripTypeError(t("Select Trip"));
        }
        if (!isTripDetailsValid) {
          setTripDetailsError(t("Select TripDetails"));
        }
        if (!currency) {
          setSelectCurrencyError(t("Select Currency"));
        }
        if (isTripTypeValid && isTripDetailsValid && currency) {
          setstep((prev) => prev + 1);
        }
        break;

      case 3:
        let hasError = false;

        // Pickup validation
        if (showaddpickup) {
          if (!pickupaddress) {
            setselectPickupLocationError(t("Enter Pickup location"));
            hasError = true;
          }
        } else {
          if (!selectPickupLocation) {
            setselectPickupLocationError(t("Select Pickup location"));
            hasError = true;
          }
        }

        // Dropoff validation
        if (showaddend) {
          if (!endAddress) {
            setselectDropLocationError(t("Enter dropoff location"));
            hasError = true;
          }
        } else {
          if (!selectDropLocation) {
            setselectDropLocationError(t("Select dropoff location"));
            hasError = true;
          }
        }

        // If no errors → move to next step
        if (!hasError) {
          setstep((prev) => prev + 1);
        }
        // const pickup = selectPickupLocation !== null && selectPickupLocation;
        // const droff = selectDropLocation !== null && selectDropLocation;
        // if (showaddpickup) {
        //     if (!pickupaddress) {
        //         setselectPickupLocationError(t("Enter Pickup location"));
        //     }
        // } else {
        //     if (!pickup) {
        //         setselectPickupLocationError(t("Select Pickup location"));
        //     }
        // }
        // if (showaddend) {
        //     if (!endAddress) {
        //         setselectDropLocationError(t("Enter dropoff location"));
        //         return
        //     }
        // } else {
        //     if (!droff) {
        //         setselectDropLocationError(t("Select dropoff location"));
        //         return
        //     }

        // }

        // if (pickup && droff) {
        //     setstep(prev => prev + 1);
        // }
        break;
      case 4:
        setstep((pre) => pre + 1);
        break;
      case 5:
        const pickup_time = Pickuptime.trim() !== "";

        if (!pickup_time) {
          setPickuptimeError(t("Select Pickup Time"));
          return;
        }

        if (pickup_time) {
          setTotalSuitcase("0");
          setTotalTrolly("0");
          setstep((prev) => prev + 1);
        }
        break;

      case 6:
        const person = TotalPerson.trim() !== "";
        const suitcases = TotalSuitcase.trim() !== "";
        const trolly = TotalTrolly.trim() !== "";

        if (!person) {
          setToatalPersonError(t("Enter Total Person"));
        }
        if (!suitcases) {
          setTotalSuitcaseError(t("Enter Total Suitcase"));
        }
        if (!trolly) {
          setTotalTrollyError(t("Enter Total Trolley"));
          return;
        }

        if (person && suitcases && trolly) {
          setstep((prev) => prev + 1);
        }
        break;
      case 7:
        // const vehicle = selctCategoryVehical !== null;
        const vehicalCategory =
          SelectVehicalCategory !== null && SelectVehicalCategory;
        // const car = SelectCar.trim() !== "";

        if (!vehicalCategory) {
          setselctCategoryVehicalError(t("Select Vehicle Category"));
          return;
        }
        if (vehicalCategory) {
          setstep((pre) => pre + 1);
        }
        break;

      case 8:
        CreateTaxiPlan();
      default:
        break;
    }
  };

  const AllClear = () => {
    setstep(0);
    setselectPickupLocationError("");
    setSelectVehicalCategory("");
    setselectDropLocationError("");
    setSelectTours("");
    setAllTours([]);
    setToursPrice("");
    setPickuptimeError("");
    setToatalPersonError("");
    setTotalSuitcaseError("");
    setTotalTrollyError("");
    setSelectCurrencyError("");
    setCompany("");
    setDropTime("");
    setPickupTime("");
    setTotalPerson("");
    setTotalSuitcase("");
    setTotalTrolly("");
    setSelectCurrency("");
    setselectDropLocation("");
    setselectPickupLocation("");
    setTripDetails("");
    setTripType("");
    setSelectCar("");
    setselctCategoryVehicalError("");
    setSelectCarError("");
    setExtraAddress([]);
    setRelatie("");
    setAddComment("");
    setPrice("");
    setVehicalCategory("");
    setShowAddpickup(false);
    setPickupaddress("");
    setShowaddend(false);
    setEndAddress("");
    setSelectPaymentMethod("");
  };

  const CreateTaxiPlan = async () => {
    try {
      const data = await getData("USERDATA");
      let datas = data.data;
      // console.log("Releties",relatie);

      console.log("Request Data:--", {
        token: datas.user.verify_token,
        relaties_id: datas.relaties.id,
        role: datas.user.role,
        user_id: datas.user.id,
        company_client: company?.id || "",
        // "client_person": relatie?.from_relatie_data?.id || "",
        client_person: datas.relaties.id || "",
        trip_type: tripType?.id,
        trip_details_id: tripdetails?.id,
        starting_address: pickupaddress
          ? pickupaddress
          : selectPickupLocation?.destination_address,
        destination_address: endAddress
          ? endAddress
          : selectDropLocation?.destination_address,
        extra_custom_address: "",
        extra_stop_address: Array.isArray(extraAddres)
          ? extraAddres.join("////")
          : "",

        from_date: editdateformate
          ? editdateformate
          : moment().format("YYYY-MM-DD"),
        pickup_time: Pickuptime,
        drop_time: DropTime || "",
        total_person: TotalPerson,
        total_suitcase: TotalSuitcase,
        total_trolly: TotalTrolly,
        price_currency: selectCurrency?.code,
        comments: AddComment,
        tour_price: ToursPrice.price,
        payment_method: SelectPaymentMethod,
        tour_id: SelectTours.id,
        vehicle_category_id: SelectVehicalCategory?.id,
        vehicle_price: Price,
        pickup_switch: showaddpickup ? 1 : 0,
        drop_switch: showaddend ? 1 : 0,
        // "pickup_custom_address": pickupaddress,
        // "drop_custom_address": endAddress,
        calculated_price: Number(ToursPrice?.price || 0) + Number(Price || 0),
      });

      let trip = await ApiService(apiConstants.taxi_booking, {
        includeToken: true,
        customData: {
          token: datas.user.verify_token,
          relaties_id: datas.relaties.id,
          role: datas.user.role,
          user_id: datas.user.id,
          company_client: company?.id || "",
          // "client_person": relatie?.from_relatie_data?.id || "",
          client_person: datas.relaties.id || "",
          trip_type: tripType?.id,
          trip_details_id: tripdetails?.id,
          starting_address: pickupaddress
            ? pickupaddress
            : selectPickupLocation?.destination_address,
          destination_address: endAddress
            ? endAddress
            : selectDropLocation?.destination_address,
          extra_custom_address: "",
          extra_stop_address: Array.isArray(extraAddres)
            ? extraAddres.join("////")
            : "",

          from_date: editdateformate
            ? editdateformate
            : moment().format("YYYY-MM-DD"),
          pickup_time: Pickuptime,
          drop_time: DropTime || "",
          total_person: TotalPerson,
          total_suitcase: TotalSuitcase,
          total_trolly: TotalTrolly,
          price_currency: selectCurrency?.code,
          comments: AddComment,
          tour_price: ToursPrice.price,
          payment_method: SelectPaymentMethod,
          tour_id: SelectTours.id,
          vehicle_category_id: SelectVehicalCategory?.id,
          vehicle_price: Price,
          pickup_switch: showaddpickup ? 1 : 0,
          drop_switch: showaddend ? 1 : 0,
          // "pickup_custom_address": pickupaddress,
          // "drop_custom_address": endAddress,
          calculated_price: Number(ToursPrice?.price || 0) + Number(Price || 0),
        },
      });
      console.log("trip", trip);

      if (Boolean(trip?.success)) {
        setstep(0);
        AllClear();
        Alert.alert(
          t("Success"),
          t("Your booking is succesfully added we will contact you.")
        );
        StusSearch();
      }
    } catch (error) {
      console.log("Create Taxi Plan Error:-", error);
      Alert.alert(`${error?.message || "Faild!"}`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={"transparent"} translucent={true} />
      <BlueHeader
        bgcolor={itemData?.color_code || "#006400"}
        title={itemData?.item_title ? t(`${itemData?.item_title}`) : t("All Past Booking")}
        // onPressfilter={() => setModalVisible(true)}
        SearchBarInput
        value={search}
        onChangeText={(txt) => {
          setSearch(txt);
        }}
        onPressRight={onRefresh}
        onPressfilter={{}}
        Righticon={Images.refresh}
        filterButtonShow={false}
      // arrowOnPress={() => setSortModalVisible(!sortmodalVisible)}
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary, "#F048C6"]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        </View>

        <FlatList
          data={StutsData}
          contentContainerStyle={{ paddingBottom: 50 }}
          ListEmptyComponent={() => (
            <View
              style={{
                height: height * 0.7,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, color: Colors.black }}>
                {t("No Data Found")}
              </Text>
            </View>
          )}
          renderItem={({ item, index }) => {
            if (search !== "") {
              let check = item?.company_client_info?.display_name
                ?.toLocaleLowerCase()
                ?.includes(search.toLocaleLowerCase());
              if (!check) return;
            }
            return (
          <TouchableOpacity
                     onPress={() =>
                       navigation.navigate("BookingListDetails", {
                         item: item,
                         itemData: itemData,
                       })
                     }
                     style={styles.containerChild}
                   >
                <View style={styles.nameview}>
                  {item?.company_client_info?.display_name && (
                    <Text
                      style={[
                        styles.name,
                        {
                          fontSize: 17,
                          fontFamily: FONTS.LexendSemiBold,
                          color: Colors.black,
                        },
                      ]}
                    >
                      {item?.company_client_info?.display_name || "-"}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.name,
                      {
                        color: Colors.textgray,
                        fontSize: 17,
                        fontFamily: FONTS.LexendSemiBold,
                        color: Colors.black,
                      },
                    ]}
                  >
                    {item?.client_person_info?.display_name || "-"}
                  </Text>
                  <Text style={[styles.name, { color: Colors.textgray }]}>📍 {item?.starting_selected_address || "-"}
                    {"\n"}
                    <Text style={{}}>🏁 {item?.destination_selected_address}
                    </Text>
                  </Text>
                  {item?.tour_name && <Text
                    numberOfLines={1}
                    style={[styles.name, { color: Colors.textgray }]}
                  >
                    - {item?.tour_name}
                  </Text>}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      width: "92%",
                    }}
                  >
                    <Text
                      style={{
                        color: TodayDate == item?.from_date ? "green" : "blue",
                        fontFamily: FONTS.LexendMedium,
                        fontSize: 16,
                        width: "100%",
                      }}
                    >
                      {"\n"}
                      {t(`${item.from_date}`)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      width: "100%",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.textgray,
                        fontFamily: FONTS.LexendMedium,
                        fontSize: 14,
                      }}
                    >{`${item.pickup_time}${item?.drop_time == null ? "" : `-${item?.drop_time}`
                      }`}</Text>
                    <View style={styles.aview}>
                      <Text style={styles.Id}>{item?.id}</Text>
                    </View>
                  </View>
                  {item?.flight_schedule && (
                    <View
                      style={[
                        styles.aprooveView,
                        {
                          backgroundColor: Colors.litegray,
                          marginTop: 10,
                          alignItems: "flex-start",
                        },
                      ]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>

                        <Image
                          source={Images.dapartuar}
                          style={{ height: 20, width: 20, marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.aprrove,
                            { color: Colors.black, fontSize: 15 },
                          ]}
                        >
                          {`${item?.flight_schedule?.departure} `}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>



                        <Image
                          source={Images.arrivels}
                          style={{ height: 20, width: 20, marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.aprrove,
                            { color: Colors.black, fontSize: 15 },
                          ]}
                        >
                          {`${item?.flight_schedule?.arrival
                            }`}
                        </Text></View>
                    </View>
                  )}
                  <View
                    style={[
                      styles.aprooveView,
                      {
                        backgroundColor: item?.status_color,
                        marginTop: 10,
                      },
                    ]}
                  >
                    <Text style={[styles.aprrove]}>
                      {`${item?.status_name}`}
                    </Text>
                  </View>
                  {
                    item?.relaties_vehicle_name?.display_name &&
                    <View style={styles.vehicle_name}>
                      <Text style={[styles.label, { textAlign: "center", marginBottom: 0 }]}>{item?.relaties_vehicle_name?.display_name}({item?.relaties_vehicle_name?.voertuig_kenteken})({item?.relaties_vehicle_name?.vehicle_color})</Text>
                      {
                        item?.relaties_vehicle_name?.leads_status_data &&
                      <Text style={[styles.status,{textAlign:"center",backgroundColor: item?.relaties_vehicle_name?.leads_status_data?.color || Colors.green,color:Colors.white}]}>{item?.relaties_vehicle_name?.leads_status_data?.status_name}</Text>
                      }
                    </View>
                  }
                  {
                    (item?.relaties_vehicle_name?.display_name &&
                      Array.isArray(item?.driver_display_names) &&
                      item.driver_display_names.length > 0) && (
                      <View style={[styles.vehicle_name, { backgroundColor: Colors.black }]}>
                        <Text style={[styles.label, { textAlign: "center", color: Colors.white,marginBottom:0 }]}>
                          {item.driver_display_names
                            .map(el => el?.display_name?.trim())
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      </View>
                    )
                  }
                </View>
              </TouchableOpacity>
            );
          }}
        />
        <Modal
          animationType="slide"
          animationOut={"slideInDown"}
          animationIn={"slideInDown"}
          onSwipeComplete={() => {
            setSortModalVisible(false);
          }}
          onBackdropPress={() => {
            setSortModalVisible(false);
          }}
          onBackButtonPress={() => {
            setSortModalVisible(false);
          }}
          swipeDirection="down"
          style={{
            justifyContent: "flex-end",
            margin: 0,
            backgroundColor: Colors.transparant,
          }}
          visible={sortmodalVisible}
        >
          <View
            style={{
              flex: 1,
              // height: '30%',
              position: "absolute",
              bottom: 0,
              borderTopRightRadius: 30,
              borderTopLeftRadius: 30,
              backgroundColor: Colors.white,
              width: "100%",
              paddingTop: 20,
              paddingBottom: 35,
            }}
          >
            <FlatList
              data={[
                { id: "1", title: "Id" },
                { id: "2", title: "Name" },
                { id: "3", title: "Status" },
                { id: "4", title: "Date" },
              ]}
              ItemSeparatorComponent={() => {
                return <View style={styles.line} />;
              }}
              contentContainerStyle={{ marginHorizontal: 24 }}
              ListHeaderComponent={() => {
                return (
                  <Text
                    style={[
                      styles.name,
                      { fontFamily: FONTS.LexendSemiBold, fontSize: 24 },
                    ]}
                  >
                    {t("Sort By")}
                  </Text>
                );
              }}
              renderItem={({ item, index }) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSortModalVisible(false), arrowOnPress(item.title);
                    }}
                    style={[
                      styles.checkView,
                      { justifyContent: "space-between" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.name,
                        { fontFamily: FONTS.LexendRegular, fontSize: 17 },
                      ]}
                    >
                      {"   "}
                      {item.title}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.up,
                        // {
                        //     transform: [
                        //         sortOrder == "asc"
                        //             ? { rotate: "180deg" }
                        //             : { rotate: "0deg" },
                        //     ],
                        // },
                      ]}
                      onPress={() => {
                        setSortModalVisible(false);
                        // arrowOnPress(item.title);
                      }}
                    >
                      <Image
                        source={Images.downArrow}
                        style={{ height: 18, width: 18 }}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Modal>

        <Modal
          animationType="slide"
          animationOut={"slideInDown"}
          animationIn={"slideInDown"}
          onSwipeComplete={() => {
            setModalVisible(false);
          }}
          onBackdropPress={() => {
            setModalVisible(false);
          }}
          onBackButtonPress={() => {
            setModalVisible(false);
          }}
          style={{
            justifyContent: "flex-end",
            margin: 0,
            backgroundColor: Colors.transparant,
          }}
          visible={modalVisible}
        >
          <View
            style={{
              flex: 1,
              position: "absolute",
              bottom: 0,
              borderTopRightRadius: 30,
              borderTopLeftRadius: 30,
              backgroundColor: Colors.white,
              width: "100%",
              paddingTop: 20,
              paddingBottom: 35,
              paddingHorizontal: 20,
              height: heightPercentageToDP("90%"),
            }}
          >
            <FlatList
              data={StutsData}
              ItemSeparatorComponent={() => {
                return <View style={styles.line} />;
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ marginHorizontal: 24 }}
              ListHeaderComponent={() => {
                return (
                  <Text
                    style={[
                      styles.name,
                      { fontFamily: FONTS.LexendSemiBold, fontSize: 24 },
                    ]}
                  >
                    {t("Filter") || "_ _"}
                  </Text>
                );
              }}
              renderItem={({ item, index }) => {
                return (
                  // <View style={styles.checkView}>
                  //   <CheckBox
                  //     style={styles.checkbox}
                  //     onClick={() => handleCheckboxChange(item)}
                  //     isChecked={selectedItems.includes(item.id)}
                  //     checkBoxColor={Colors.litegray}
                  //     checkedCheckBoxColor={Colors.primary}
                  //   />
                  //   <Text
                  //     style={[styles.name, { fontFamily: FONTS.LexendRegular }]}
                  //   >
                  //     {"   "}
                  //     {item.status_name}
                  //   </Text>
                  // </View>
                  <TouchableOpacity
                    style={styles.checkView}
                    //   onPress={() => handleCheckboxChange(item)}
                    activeOpacity={0.5}
                  >
                    <CheckBox
                      // onClick={() => handleCheckboxChange(item)}
                      // isChecked={selectedItems.includes(item.id)}
                      checkBoxColor={Colors.litegray}
                      checkedCheckBoxColor={Colors.primary}
                    />
                    <Text
                      style={{
                        fontFamily: FONTS.LexendRegular,
                        color: Colors.black,
                      }}
                    >
                      {"   "}
                      {item.status_name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <View
              style={
                {
                  // flexDirection: "row",
                  // justifyContent: "space-between",
                  // marginHorizontal: 24,
                }
              }
            >
              {/* <TouchableOpacity
                          onPress={() => {
                            setSelectedItems([]);
                            searchStatus([]);
                          }}
                          style={styles.btn}
                        >
                          <Text style={[styles.name, { color: Colors.white }]}>
                            {t("Herstellen")}
                          </Text>
                        </TouchableOpacity> */}

              <TouchableOpacity
                onPress={() => {
                  // searchStatus(selectedItems);
                  setModalVisible(false);
                }}
                style={styles.btn}
              >
                <Text style={[styles.name, { color: Colors.white }]}>
                  {t("Zoeken")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <View>
          <Modal
            animationType="slide"
            animationOut={"slideOutDown"}
            animationIn={"slideInDown"}
            onSwipeComplete={() => {
              AllClear();
            }}
            onBackdropPress={() => {
              AllClear();
            }}
            onBackButtonPress={() => {
              AllClear();
            }}
            // swipeDirection="down"
            isVisible={Boolean(step)}
          // isVisible={true}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.centeredView}
            >
              <View style={styles.MainContentView}>
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    alignItems: "center",
                    marginBottom: 10,
                    justifyContent: "center",
                  }}
                >
                  <View style={{ position: "absolute", left: 0 }}>
                    {
                      // step !== 2 &&
                      step !== 1 && (
                        <TouchableOpacity
                          style={styles.closebtnbg}
                          onPress={() => {
                            // if(step == 2){
                            //     setstep(0)
                            // }
                            setstep((pre) => pre - 1);
                          }}
                        >
                          <Image
                            source={Images.back}
                            style={{ height: 20, width: 20 }}
                          />
                        </TouchableOpacity>
                      )
                    }
                  </View>
                  <Text
                    style={[
                      styles.TextHeading,
                      { fontFamily: FONTS.LexendSemiBold },
                    ]}
                  >
                    {t("Add Trip")}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.closebtnbg,
                      { position: "absolute", right: 0 },
                    ]}
                    onPress={() => {
                      AllClear();
                    }}
                  >
                    <Image
                      source={Images.close}
                      style={{ height: 20, width: 20 }}
                    />
                  </TouchableOpacity>
                </View>

                {step == 1 && (
                  <View>
                    {/* <View>
                                                <Text style={[styles.TextHeading, { marginVertical: 5 }]}>{t("company")}</Text>
                                                <SelectDropdown
                                                    data={AllCompanyData}
                                                    onSelect={(item) => {
                                                        console.log(item);
                                                        setCompany(item); setAllRelatiesData(
                                                            Array.isArray(item?.relaties_to_connection)
                                                                ? item.relaties_to_connection.filter(el => el?.from_relatie_data)
                                                                : []
                                                        );
                                                        setRelatie('')
                                                    }}
                                                    search
                                                    renderButton={(item, isOpened, isSelected) => (
                                                        <View
                                                            style={[
                                                                styles.dropdownButtonStyle,
                                                                {
                                                                    backgroundColor: Colors.white,

                                                                },
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.dropdownButtonTxtStyle,
                                                                    {
                                                                        color: isSelected ? Colors.primary : Colors.black,
                                                                    },
                                                                ]}
                                                            >
                                                                {company ? company?.display_name : t("select company client")}
                                                            </Text>
                                                            <Image
                                                                source={Images.down}
                                                                tintColor={Colors.black}
                                                                style={{ height: 20, width: 20 }}
                                                            />
                                                        </View>
                                                    )}
                                                    renderItem={(item, index, isSelected) => (
                                                        <View
                                                            style={[
                                                                styles.dropdownItemStyle,
                                                                isSelected && { backgroundColor: Colors.litegray1 }
                                                            ]}
                                                        >
                                                            <Text style={[styles.dropdownItemTxtStyle, { color: isSelected ? Colors.primary : Colors.black }]}>{item?.display_name}</Text>
                                                        </View>
                                                    )}
                                                    showsVerticalScrollIndicator={false}
                                                    dropdownStyle={styles.dropdownMenuStyle}
                                                />

                                            </View>
                                            <View>
                                                <Text style={[styles.TextHeading, { marginVertical: 5 }]}>{t("relaties")} <Text style={styles.Red}>*</Text></Text>
                                                <SelectDropdown
                                                    data={AllReletiesData}
                                                    disabled={AllReletiesData?.length == 0}
                                                    onSelect={(item) => {
                                                        setRelatie(item); console.log(item);
                                                    }}
                                                    search
                                                    renderButton={(item, isOpened) => (
                                                        <View
                                                            style={[
                                                                styles.dropdownButtonStyle,
                                                                {
                                                                    backgroundColor: Colors.white,
                                                                },
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.dropdownButtonTxtStyle,
                                                                    {
                                                                        color: Colors.black,
                                                                    },
                                                                ]}
                                                            >
                                                                {relatie ? relatie?.from_relatie_data?.display_name : t("select Relation Type")}
                                                            </Text>
                                                            <Image
                                                                source={Images.down}
                                                                tintColor={Colors.black}
                                                                style={{ height: 20, width: 20 }}
                                                            />
                                                        </View>
                                                    )}
                                                    renderItem={(item, index, isSelected) => (
                                                        <View
                                                            style={[
                                                                styles.dropdownItemStyle,
                                                                isSelected && { backgroundColor: Colors.litegray1 },
                                                            ]}
                                                        >
                                                            <Text style={[styles.dropdownItemTxtStyle, { color: isSelected ? Colors.primary : Colors.black }]}>{item?.from_relatie_data?.display_name}</Text>
                                                        </View>
                                                    )}
                                                    showsVerticalScrollIndicator={false}
                                                    dropdownStyle={styles.dropdownMenuStyle}
                                                />
                                                {
                                                    companyError &&
                                                    <Text style={styles.Error}>{companyError}</Text>

                                                }
                                            </View> */}
                    <TouchableOpacity onPress={() => setOpen(true)}>
                      <Text style={styles.title}>{t("Date")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setOpen(true)}
                    >
                      <Text style={styles.editDateText}>
                        {editdate
                          ? formatDatee(editdate)
                          : currentDate || t("Select Datum")}
                      </Text>

                      <View style={styles.dateImageContainer}>
                        <Image source={Images.date} style={styles.dateImage} />
                      </View>
                    </TouchableOpacity>

                    <DatePicker
                      modal
                      mode="date"
                      date={editdate instanceof Date ? editdate : new Date()} // Ensure it's always a Date object
                      // date={editdate ? editdate : new Date("1990")}
                      locale="nl" // Set Dutch locale
                      is24hourSource="locale"
                      open={open}
                      onConfirm={handleDateChange}
                      onCancel={() => {
                        setOpen(false);
                      }}
                      title={t("Voer geboortedatum in")}
                      confirmText="Select"
                      dividerColor={"yellow"}
                      buttonColor={"yellow"}
                      minimumDate={new Date()} // 👈 Past dates disabled
                    />
                  </View>
                )}

                {step == 2 && (
                  <View style={{}}>
                    <Text style={[styles.TextHeading, {}]}>
                      {t("Trip Type")} <Text style={styles.Red}>*</Text>
                    </Text>
                    <SelectDropdown
                      data={AllTripTypeData}
                      onSelect={(item) => {
                        setTripType(item);
                        setTripDetails("");
                      }}
                      renderButton={(item, isOpened) => {
                        return (
                          <View style={[styles.dropdownButtonStyle]}>
                            <Text style={[styles.dropdownButtonTxtStyle]}>
                              {tripType ? `${tripType?.title}` : ""}
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
                            <Text
                              style={[
                                styles.dropdownItemTxtStyle,
                                {
                                  color: isSelected
                                    ? Colors.primary
                                    : Colors.black,
                                },
                              ]}
                            >
                              {item.title}
                            </Text>
                          </View>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                      dropdownStyle={styles.dropdownMenuStyle}
                    />

                    {tripTypeError && (
                      <Text style={styles.Error}>{t(tripTypeError)}</Text>
                    )}
                    <Text style={[styles.TextHeading, {}]}>
                      {t("Trip Details")} <Text style={styles.Red}>*</Text>
                    </Text>

                    <SelectDropdown
                      data={AllTripDetailsData}
                      onSelect={(item) => setTripDetails(item)}
                      renderButton={(item, isOpened) => {
                        return (
                          <View style={[styles.dropdownButtonStyle]}>
                            <Text style={[styles.dropdownButtonTxtStyle]}>
                              {tripdetails
                                ? `${tripdetails?.trip_details}`
                                : ""}
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
                            <Text
                              style={[
                                styles.dropdownItemTxtStyle,
                                {
                                  color: isSelected
                                    ? Colors.primary
                                    : Colors.black,
                                },
                              ]}
                            >
                              {`${item.trip_details}`}
                            </Text>
                          </View>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                      dropdownStyle={styles.dropdownMenuStyle}
                    />

                    {tripDetailsError && (
                      <Text style={styles.Error}>{t(tripDetailsError)}</Text>
                    )}
                    {/* <View style={{}}> */}
                    <Text style={[styles.TextHeading, {}]}>{t("tours")} </Text>
                    <SelectDropdown
                      data={AllTours}
                      keyboardShouldPersistTaps="handled"
                      
                      defaultButtonText="" // button empty text when nothing selected
                      onSelect={(item) => {
                        setSelectTours(item);
                        // AllCreateTaxiData("", item);
                      }}
                      renderButton={(item, isOpened) => (
                        <View
                          style={[
                            styles.dropdownButtonStyle,
                            {
                              backgroundColor: Colors.white,
                              height: RFValue(40),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownButtonTxtStyle,
                              {
                                color: Colors.black,
                              },
                            ]}
                          >
                            {SelectTours ? SelectTours?.tour_name : ""}
                          </Text>

                          {SelectTours && (
                            <TouchableOpacity
                              onPress={() => setSelectTours("")}
                              style={{ marginRight: 5 }}
                            >
                              <Image
                                source={Images.close}
                                tintColor={Colors.black}
                                style={{
                                  height: 20,
                                  width: 20,
                                  tintColor: Colors.red,
                                }}
                              />
                            </TouchableOpacity>
                          )}

                          <Image
                            source={Images.down}
                            tintColor={Colors.black}
                            style={{ height: 20, width: 20 }}
                          />
                        </View>
                      )}
                      renderItem={(item, index, isSelected) => (
                        <View
                          style={[
                            styles.dropdownItemStyle,
                            isSelected && { backgroundColor: Colors.litegray1 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownItemTxtStyle,
                              {
                                color: isSelected
                                  ? Colors.primary
                                  : Colors.black,
                              },
                            ]}
                          >
                            {item?.tour_name}
                          </Text>
                        </View>
                      )}
                      showsVerticalScrollIndicator={false}
                      dropdownStyle={styles.dropdownMenuStyle}
                    />
                    {/* </View> */}
                    {/* <View style={{}}> */}
                    <Text style={[styles.TextHeading, {}]}>
                      {t("currency")} <Text style={styles.Red}>*</Text>
                    </Text>
                    <SelectDropdown
                      data={AllCurrency}
                      keyboardShouldPersistTaps="handled"
                      onSelect={(item) => {
                        setSelectCurrency(item);
                        console.log(item);
                      }}
                      renderButton={(item, isOpened) => (
                        <View
                          style={[
                            styles.dropdownButtonStyle,
                            {
                              backgroundColor: Colors.white,
                              height: RFValue(40),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownButtonTxtStyle,
                              {
                                color: Colors.black,
                              },
                            ]}
                          >
                            {selectCurrency ? selectCurrency?.symbol : ""}
                          </Text>
                          <Image
                            source={Images.down}
                            tintColor={Colors.black}
                            style={{ height: 20, width: 20 }}
                          />
                        </View>
                      )}
                      renderItem={(item, index, isSelected) => (
                        <View
                          style={[
                            styles.dropdownItemStyle,
                            isSelected && { backgroundColor: Colors.litegray1 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownItemTxtStyle,
                              {
                                color: isSelected
                                  ? Colors.primary
                                  : Colors.black,
                              },
                            ]}
                          >
                            {item?.symbol}
                          </Text>
                        </View>
                      )}
                      showsVerticalScrollIndicator={false}
                      dropdownStyle={[styles.dropdownMenuStyle,{height:160}]}
                    />
                    {selectCurrencyError && (
                      <Text style={[styles.Error, { marginTop: 0 }]}>
                        {t(selectCurrencyError)}
                      </Text>
                    )}
                    {/* </View> */}
                  </View>
                )}

                {step == 3 && (
                  <View>
                    <View style={styles.Handle}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text style={styles.HeadingText}>
                          {t("pickup location")}
                          <Text style={styles.Red}>*</Text>
                        </Text>
                        <Text
                          style={[
                            styles.HeadingText,
                            { position: "absolute", right: 55 },
                          ]}
                        >
                          {t("New")}
                        </Text>

                        {/* <TouchableOpacity style={{}} onPress={() => setShowAddpickup(!showaddpickup)}> */}
                        <Switch
                          value={showaddpickup}
                          onValueChange={(val) => setShowAddpickup(val)}
                          trackColor={{
                            false: Colors.textgray,
                            true: Colors.primary,
                          }}
                          thumbColor={
                            showaddpickup ? Colors.white : Colors.white
                          }
                        />
                        {/* </TouchableOpacity> */}
                      </View>
                      {showaddpickup ? (
                        <>
                          <TextInput
                            style={[
                              styles.CustomInput,
                              {
                                backgroundColor: Colors.white,
                                width: "100%",
                                height: RFValue(45),
                                borderRadius: 5,
                                marginVertical: 5,
                              },
                            ]}
                            placeholder={t("Enter Address")}
                            value={pickupaddress}
                            onChangeText={(text) => {
                              setPickupaddress(text), handleSearch(text);
                            }}
                            placeholderTextColor={Colors.textgray}
                          />

                          {SuggestionAddress?.length > 0 &&
                            pickupaddress?.length > 3 && (
                              <ScrollView
                                style={styles.Fixed}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                              >
                                {SuggestionAddress?.map((el) => (
                                  <Pressable
                                    style={styles.SuggestEl}
                                    onPress={() => {
                                      handleSelectaddress(el);
                                      console.log(el);
                                    }}
                                  >
                                    <Text style={styles.SuggestText}>
                                      {el?.description}
                                    </Text>
                                  </Pressable>
                                ))}
                              </ScrollView>
                            )}
                        </>
                      ) : (
                        <SelectDropdown
                          data={AllAddressData}
                          onSelect={(item) => setselectPickupLocation(item)}
                          renderButton={(item, isOpened) => {
                            return (
                              <View
                                style={[
                                  styles.dropdownButtonStyle,
                                  { height: RFValue(50) },
                                ]}
                              >
                                <Text style={[styles.dropdownButtonTxtStyle]}>
                                  {selectPickupLocation
                                    ? selectPickupLocation?.destination_address
                                    : ""}
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
                                  isSelected && {
                                    backgroundColor: Colors.white,
                                  },
                                ]}
                              >
                                <Text style={styles.dropdownItemTxtStyle}>
                                  {item.destination_address}
                                </Text>
                              </View>
                            );
                          }}
                          showsVerticalScrollIndicator={false}
                          dropdownStyle={styles.dropdownMenuStyle}
                        />
                      )}
                      {selectPickupLocationError && (
                        <Text style={styles.Error}>
                          {t(selectPickupLocationError)}
                        </Text>
                      )}
                    </View>

                    <View style={styles.Handle}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text style={styles.HeadingText}>
                          {t("dropoff location")}
                          <Text style={styles.Red}>*</Text>
                        </Text>
                        <Text
                          style={[
                            styles.HeadingText,
                            { position: "absolute", right: 55 },
                          ]}
                        >
                          {t("New")}
                        </Text>
                        {/* <TouchableOpacity> */}
                        <Switch
                          value={showaddend}
                          onValueChange={(val) => setShowaddend(val)}
                          trackColor={{
                            false: Colors.textgray,
                            true: Colors.primary,
                          }}
                          thumbColor={
                            showaddpickup ? Colors.white : Colors.white
                          }
                        />
                        {/* </TouchableOpacity> */}
                      </View>
                      {showaddend ? (
                        <>
                          <TextInput
                            style={[
                              styles.CustomInput,
                              {
                                backgroundColor: Colors.white,
                                width: "100%",
                                height: RFValue(45),
                                borderRadius: 5,
                                marginVertical: 5,
                              },
                            ]}
                            placeholder={t("Enter Address")}
                            value={endAddress}
                            onChangeText={(text) => {
                              setEndAddress(text), handleSearchend(text);
                            }}
                            placeholderTextColor={Colors.textgray}
                          />
                          {SuggestionAddressend?.length > 0 &&
                            endAddress?.length > 3 && (
                              <ScrollView
                                style={styles.Fixed}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                              >
                                {SuggestionAddressend?.map((el) => (
                                  <Pressable
                                    style={styles.SuggestEl}
                                    onPress={() => {
                                      handleSelectpickup(el);
                                      console.log(el);
                                    }}
                                  >
                                    <Text style={styles.SuggestText}>
                                      {el?.description}
                                    </Text>
                                  </Pressable>
                                ))}
                              </ScrollView>
                            )}
                        </>
                      ) : (
                        <SelectDropdown
                          data={AllAddressData}
                          onSelect={(item) => setselectDropLocation(item)}
                          renderButton={(item, isOpened) => {
                            return (
                              <View
                                style={[
                                  styles.dropdownButtonStyle,
                                  { height: RFValue(50) },
                                ]}
                              >
                                <Text style={[styles.dropdownButtonTxtStyle]}>
                                  {selectDropLocation
                                    ? selectDropLocation?.destination_address
                                    : ""}
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
                                  isSelected && {
                                    backgroundColor: Colors.white,
                                  },
                                ]}
                              >
                                <Text style={styles.dropdownItemTxtStyle}>
                                  {item.destination_address}
                                </Text>
                              </View>
                            );
                          }}
                          showsVerticalScrollIndicator={false}
                          dropdownStyle={styles.dropdownMenuStyle}
                        />
                      )}
                      {selectDropLocationError && (
                        <Text style={styles.Error}>
                          {t(selectDropLocationError)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {step == 4 && (
                  <View>
                    <Text style={[styles.HeadingText, { marginVertical: 0 }]}>
                      {t("extra stops")}
                    </Text>
                    <View
                      style={[
                        styles.AllInput,
                        {
                          height: RFValue(50),
                          paddingVertical: 0,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: Colors.white,
                        },
                      ]}
                    >
                      <TextInput
                        style={styles.CustomInput}
                        placeholder={t("Enter Address")}
                        value={AddressValue}
                        onChangeText={(text) => {
                          setAddressValue(text);
                          handleSearch(text);
                        }}
                        placeholderTextColor={Colors.textgray}
                      />
                      {/* ✅ button only if input not empty & not in suggestion list */}
                      {AddressValue?.trim().length > 0 &&
                        !extraAddres.includes(AddressValue) && (
                          <TouchableOpacity
                            onPress={() => {
                              setExtraAddress([...extraAddres, AddressValue]);
                              setAddressValue(""); // clear input
                            }}
                          >
                            <Text
                              style={{ fontSize: RFValue(18), color: "green" }}
                            >
                              ✓
                            </Text>
                          </TouchableOpacity>
                        )}
                      <TouchableOpacity
                        onPress={() => {
                          const newArray = [...extraAddres];
                          newArray.splice(inx, 1);
                          setExtraAddress(newArray);
                        }}
                      ></TouchableOpacity>
                    </View>
                    <ScrollView
                      style={styles.Scroll}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                    >
                      {extraAddres?.map((el, inx) => (
                        <View style={styles.Extra}>
                          <Text
                            numberOfLines={5}
                            style={[styles.TextHeading, { width: "90%" }]}
                          >
                            {el}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              const newArray = [...extraAddres];
                              newArray.splice(inx, 1);
                              setExtraAddress(newArray);
                            }}
                          >
                            <Image
                              source={Images.close}
                              style={{
                                width: RFValue(15),
                                height: RFValue(15),
                              }}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                    {SuggestionAddress?.length > 0 &&
                      AddressValue?.length > 3 && (
                        <ScrollView
                          style={styles.Fixed}
                          showsVerticalScrollIndicator={false}
                          bounces={false}
                        >
                          {SuggestionAddress?.map((el) => (
                            <Pressable
                              style={styles.SuggestEl}
                              onPress={() => {
                                handleSelect(el);
                                console.log(el);
                              }}
                            >
                              <Text style={styles.SuggestText}>
                                {el?.description}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}
                  </View>
                )}

                {step == 5 && (
                  <View style={{ gap: RFValue(5) }}>
                    <View style={{}}>
                      <View>
                        <Text
                          style={[styles.TextHeading, { marginVertical: 5 }]}
                        >
                          {t("Pickup Time")} <Text style={styles.Red}>*</Text>
                        </Text>
                        <TouchableOpacity
                          style={[styles.Box, { height: RFValue(40) }]}
                          onPress={() => setOpenTime("pickup")}
                        >
                          <Text style={[styles.TextHeading]}>
                            {Pickuptime || "- -"}
                          </Text>
                          <Image
                            source={Images.time}
                            style={{ width: RFValue(25), height: RFValue(25) }}
                          />
                        </TouchableOpacity>
                        {PickuptimeError && (
                          <Text style={[styles.Error, { marginTop: 0 }]}>
                            {t(PickuptimeError)}
                          </Text>
                        )}
                      </View>
                      <View>
                        <Text
                          style={[styles.TextHeading, { marginVertical: 5 }]}
                        >
                          {t("Drop Time")}
                        </Text>
                        <TouchableOpacity
                          style={[styles.Box, { height: RFValue(40) }]}
                          onPress={() => setOpenTime("drop")}
                        >
                          <Text style={[styles.TextHeading]}>
                            {DropTime || "- -"}
                          </Text>
                          <Image
                            source={Images.time}
                            style={{ width: RFValue(25), height: RFValue(25) }}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <DatePicker
                      modal
                      mode="time"
                      locale="en-GB"
                      is24hourSource="locale"
                      open={Boolean(OpenTime)}
                      date={new Date()}
                      onConfirm={(selectedTime) => {
                        const formattedTime =
                          moment(selectedTime).format("HH:mm"); // 24-hour format

                        if (OpenTime === "pickup") {
                          setPickupTime(formattedTime);
                          // Reset DropTime if already smaller
                          if (
                            DropTime &&
                            moment(DropTime, "HH:mm").isBefore(
                              moment(formattedTime, "HH:mm")
                            )
                          ) {
                            setDropTime(""); // clear invalid drop time
                          }
                        } else {
                          // check drop > pickup
                          if (
                            Pickuptime &&
                            moment(formattedTime, "HH:mm").isBefore(
                              moment(Pickuptime, "HH:mm")
                            )
                          ) {
                            Alert.alert(
                              "Invalid Time",
                              "Drop time cannot be before pickup time."
                            );
                          } else {
                            setDropTime(formattedTime);
                          }
                        }

                        setOpenTime(null);
                      }}
                      onCancel={() => setOpenTime(null)}
                      confirmText="Select"
                      dividerColor={"yellow"}
                      buttonColor={"yellow"}
                    />
                  </View>
                )}

                {step == 6 && (
                  <>
                    {/* <View style={styles.BothFlex}> */}
                    <View style={{}}>
                      <Text style={[styles.TextHeading, { marginVertical: 5 }]}>
                        {t("Total Person")} <Text style={styles.Red}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.AllInput, { marginTop: RFValue(1) }]}
                        placeholder={t("person")}
                        returnKeyType="done"
                        keyboardType="decimal-pad"
                        textContentType="telephoneNumber"
                        value={TotalPerson}
                        onChangeText={setTotalPerson}
                      />
                      {TotalPersonError && (
                        <Text style={[styles.Error, { marginTop: 0 }]}>
                          {t(TotalPersonError)}
                        </Text>
                      )}
                    </View>
                    <View style={{}}>
                      <Text style={[styles.TextHeading, { marginVertical: 5 }]}>
                        {t("Suitcases")} <Text style={styles.Red}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.AllInput,
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          },
                        ]}
                      >
                        <TextInput
                          style={[
                            {
                              marginTop: RFValue(1),
                              fontFamily: FONTS.LexendRegular,
                              color: Colors.black,
                              width: "85%",
                            },
                          ]}
                          placeholder={t("Suitcases")}
                          returnKeyType="done"
                          keyboardType="decimal-pad"
                          textContentType="telephoneNumber"
                          value={TotalSuitcase}
                          onChangeText={setTotalSuitcase}
                        />
                        <TouchableOpacity
                          onPress={() => setTotalSuitcase(TotalPerson)}
                        >
                          <Image
                            source={Images.refresh}
                            style={{ width: 18, height: 18 }}
                          />
                        </TouchableOpacity>
                      </View>

                      {TotalSuitcaseError && (
                        <Text style={[styles.Error, { marginTop: 0 }]}>
                          {t(TotalSuitcaseError)}
                        </Text>
                      )}
                    </View>
                    {/* </View> */}

                    <View style={{}}>
                      <Text style={[styles.TextHeading, { marginVertical: 5 }]}>
                        {t("trollies")} <Text style={styles.Red}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.AllInput,
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          },
                        ]}
                      >
                        <TextInput
                          style={[
                            {
                              marginTop: RFValue(1),
                              fontFamily: FONTS.LexendRegular,
                              color: Colors.black,
                              width: "85%",
                            },
                          ]}
                          placeholder={t("trollies")}
                          returnKeyType="done"
                          keyboardType="decimal-pad"
                          textContentType="telephoneNumber"
                          value={TotalTrolly}
                          onChangeText={setTotalTrolly}
                        />
                        <TouchableOpacity
                          onPress={() => {

                            if (TotalSuitcase != 0) {
                              setTotalTrolly(TotalSuitcase)
                            } else {
                              setTotalTrolly(TotalPerson)
                            }
                          }}
                        >
                          <Image
                            source={Images.refresh}
                            style={{ width: 18, height: 18 }}
                          />
                        </TouchableOpacity>
                      </View>

                      {TotalTrollyError && (
                        <Text style={[styles.Error, { marginTop: 0 }]}>
                          {t(TotalTrollyError)}
                        </Text>
                      )}
                    </View>
                  </>
                )}

                {step == 7 && (
                  <View style={{ gap: 5 }}>
                    {/* <View>
                                            <Text style={styles.TextHeading}>{t("select vehicle")} <Text style={styles.Red}>*</Text></Text>
                                            <SelectDropdown
                                                data={AllVehicals}
                                                onSelect={(item) => setselctCategoryVehical(item)}
                                                renderButton={(item, isOpened) => (
                                                    <View
                                                        style={[
                                                            styles.dropdownButtonStyle,
                                                            {
                                                                backgroundColor: Colors.white,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.dropdownButtonTxtStyle,
                                                                {
                                                                    color: Colors.black,
                                                                },
                                                            ]}
                                                        >
                                                            {selctCategoryVehical ? `${selctCategoryVehical?.display_name}` : t("select Vehical")}
                                                        </Text>
                                                        <Image
                                                            source={Images.down}
                                                            tintColor={Colors.black}
                                                            style={{ height: 20, width: 20 }}
                                                        />
                                                    </View>
                                                )}
                                                renderItem={(item, index, isSelected) => (
                                                    <View
                                                        style={[
                                                            styles.dropdownItemStyle,
                                                            isSelected && { backgroundColor: Colors.white },
                                                        ]}
                                                    >
                                                        <Text style={styles.dropdownItemTxtStyle}>{`${item?.display_name}`}</Text>
                                                    </View>
                                                )}
                                                showsVerticalScrollIndicator={false}
                                                dropdownStyle={styles.dropdownMenuStyle}
                                            />
                                            {
                                                selctCategoryVehicalError &&
                                                <Text style={[styles.Error, { marginTop: 0 }]}>{selctCategoryVehicalError}</Text>

                                            }
                                        </View> */}

                    <View>
                      <Text
                        style={[
                          styles.TextHeading,
                          { marginVertical: RFValue(5) },
                        ]}
                      >
                        {t("Category")} <Text style={styles.Red}>*</Text>
                      </Text>
                      <SelectDropdown
                        data={VehicalCategory}
                        onSelect={(item) => {
                          setSelectVehicalCategory(item);
                        //   AllCreateTaxiData(item, "");
                        }}
                        renderButton={(item, isOpened) => (
                          <View
                            style={[
                              styles.dropdownButtonStyle,
                              {
                                backgroundColor: Colors.white,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dropdownButtonTxtStyle,
                                {
                                  color: Colors.black,
                                  // justifyContent: "space-between",
                                },
                              ]}
                            >
                              {SelectVehicalCategory ? (
                                <>
                                  <Text style={styles.TextHeading}>
                                    {t(SelectVehicalCategory?.price_title)}
                                    {"   "}
                                  </Text>
                                  <Text style={styles.TextHeading}>
                                    {t(SelectVehicalCategory?.matched_price)}{" "}
                                    {selectCurrency.symbol}
                                    {"   "}
                                  </Text>
                                  <Text style={styles.TextHeading}>
                                    👥 {t(SelectVehicalCategory?.max_person)}
                                  </Text>
                                  <Text style={styles.TextHeading}>
                                    {"  "}🧳{" "}
                                    {t(
                                      SelectVehicalCategory?.max_suitcase_trolly_combine
                                    )}
                                  </Text>
                                </>
                              ) : (
                                ""
                              )}
                            </Text>
                            <Image
                              source={Images.down}
                              tintColor={Colors.black}
                              style={{ height: 20, width: 20 }}
                            />
                          </View>
                        )}
                        renderItem={(item, index, isSelected) => (
                          <View
                            style={[
                              styles.dropdownItemStyle,
                              isSelected && { backgroundColor: Colors.white },
                            ]}
                          >
                            <Text style={styles.dropdownItemTxtStyle}>
                              {t(`${item?.price_title}`)}
                            </Text>
                            <Text style={styles.dropdownItemTxtStyle}>
                              {t(`${item?.matched_price}`)}{" "}
                              {selectCurrency.symbol}
                            </Text>
                            <Text style={styles.dropdownItemTxtStyle}>
                              👥 {t(`${item?.max_person}`)}
                            </Text>
                            <Text style={styles.dropdownItemTxtStyle}>
                              🧳 {t(`${item?.max_suitcase_trolly_combine}`)}
                            </Text>
                          </View>
                        )}
                        showsVerticalScrollIndicator={false}
                        dropdownStyle={styles.dropdownMenuStyle}
                      />
                      {selctCategoryVehicalError && (
                        <Text style={[styles.Error, { marginTop: 0 }]}>
                          {t(selctCategoryVehicalError)}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.TextHeading,
                          { marginVertical: RFValue(5) },
                        ]}
                      >
                        {t("Payment Method")} <Text style={styles.Red}>*</Text>
                      </Text>
                      <SelectDropdown
                        data={AllPaymentMethod}
                        onSelect={(item) => {
                          setSelectPaymentMethod(item);
                        }}
                        renderButton={(item, isOpened) => (
                          <View
                            style={[
                              styles.dropdownButtonStyle,
                              {
                                backgroundColor: Colors.white,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dropdownButtonTxtStyle,
                                {
                                  color: Colors.black,
                                },
                              ]}
                            >
                              {t(SelectPaymentMethod)
                                ? t(`${SelectPaymentMethod}`)
                                : ""}
                            </Text>
                            <Image
                              source={Images.down}
                              tintColor={Colors.black}
                              style={{ height: 20, width: 20 }}
                            />
                          </View>
                        )}
                        renderItem={(item, index, isSelected) => (
                          <View
                            style={[
                              styles.dropdownItemStyle,
                              isSelected && { backgroundColor: Colors.white },
                            ]}
                          >
                            <Text style={styles.dropdownItemTxtStyle}>
                              {t(`${item}`)}
                            </Text>
                          </View>
                        )}
                        showsVerticalScrollIndicator={false}
                        dropdownStyle={styles.dropdownMenuStyle}
                      />
                      {selctCategoryVehicalError && (
                        <Text style={[styles.Error, { marginTop: 0 }]}>
                          {t(selctCategoryVehicalError)}
                        </Text>
                      )}
                    </View>


                    <View style={styles.comments}>
                      <Text
                        style={[
                          styles.TextHeading,
                          { marginVertical: 8, textTransform: "none" },
                        ]}
                      >
                        {t("Voeg een notitie toe")}
                      </Text>

                      <TextInput
                        style={[
                          styles.textInput,
                          { backgroundColor: Colors.white },
                        ]}
                        value={AddComment}
                        onChangeText={setAddComment}
                        placeholder="Notitie..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                )}

                {step == 8 && (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: RFValue(50) }}
                    style={{ maxHeight: RFValue(400) }}
                  >
                    <View style={{ gap: RFValue(12) }}>
                      {/* Header */}
                      <View
                        style={{
                          paddingHorizontal: RFValue(15),
                          borderRadius: RFValue(8),
                          // marginBottom: RFValue(5)
                        }}
                      >
                        <Text
                          style={[
                            styles.TextHeading,
                            {
                              color: Colors.black,
                              fontSize: RFValue(13),

                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {t("Trip Summary")}
                        </Text>
                      </View>

                      {/* Company & Relation Section */}
                      {/* <View style={{
                                                backgroundColor: Colors.white,
                                                padding: RFValue(15),
                                                borderRadius: RFValue(8),
                                                elevation: 2,
                                                shadowColor: Colors.black,
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 4,
                                                borderLeftWidth: 4,
                                                borderLeftColor: Colors.primary
                                            }}>
                                                <Text style={[styles.Text, {
                                                    color: Colors.primary,
                                                    fontWeight: 'bold',
                                                    fontSize: RFValue(14),
                                                    marginBottom: RFValue(8)
                                                }]}>{t("Company Details")}</Text>

                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: RFValue(6) }}>
                                                    <Text style={[styles.Text, { color: Colors.black, fontWeight: '600', flex: 0.4 }]}>{t("Company")}</Text>
                                                    <Text style={[styles.Text, { color: Colors.textgray, flex: 0.6, textAlign: 'right' }]}>{company?.display_name || '-'}</Text>
                                                </View>

                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <Text style={[styles.Text, { color: Colors.black, fontWeight: '600', flex: 0.4 }]}>{t("Relation")}</Text>
                                                    <Text style={[styles.Text, { color: Colors.textgray, flex: 0.6, textAlign: 'right' }]}>{relatie?.from_relatie_data?.display_name || '-'}</Text>
                                                </View>
                                            </View> */}

                      {/* Trip Information Section */}
                      <View
                        style={{
                          backgroundColor: Colors.white,
                          padding: RFValue(15),
                          borderRadius: RFValue(8),
                          elevation: 2,
                          shadowColor: Colors.black,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          borderLeftWidth: 4,
                          borderLeftColor: "#4CAF50",
                        }}
                      >
                        <Text
                          style={[
                            styles.Text,
                            {
                              color: "#4CAF50",
                              fontWeight: "bold",
                              fontSize: RFValue(14),
                              marginBottom: RFValue(8),
                            },
                          ]}
                        >
                          {t("Trip Information")}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.textgray,
                                fontWeight: "600",
                                flex: 0.4,
                              },
                            ]}
                          >
                            {t("Type")}
                          </Text>
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.black,
                                flex: 0.6,
                                textAlign: "right",
                              },
                            ]}
                          >
                            {tripType?.title || "-"}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.textgray,
                                fontWeight: "600",
                                flex: 0.4,
                              },
                            ]}
                          >
                            {t("Details")}
                          </Text>
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.black,
                                flex: 0.6,
                                textAlign: "right",
                              },
                            ]}
                            numberOfLines={2}
                          >
                            {tripdetails?.trip_details || "-"}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.textgray,
                                fontWeight: "600",
                                flex: 0.5,
                              },
                            ]}
                          >
                            {t("Currency")}
                          </Text>
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.black,
                                flex: 0.5,
                                textAlign: "right",
                              },
                            ]}
                          >
                            {" "}
                            {selectCurrency?.symbol || "-"}
                          </Text>
                        </View>
                      </View>

                      {/* Location Section */}
                      <View
                        style={{
                          backgroundColor: Colors.white,
                          padding: RFValue(15),
                          borderRadius: RFValue(8),
                          elevation: 2,
                          shadowColor: Colors.black,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          borderLeftWidth: 4,
                          borderLeftColor: "#FF9800",
                        }}
                      >
                        <Text
                          style={[
                            styles.Text,
                            {
                              color: "#FF9800",
                              fontWeight: "bold",
                              fontSize: RFValue(14),
                              marginBottom: RFValue(8),
                            },
                          ]}
                        >
                          {t("Locations")}
                        </Text>

                        <View style={{ marginBottom: RFValue(8) }}>
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.textgray,
                                fontWeight: "600",
                                marginBottom: RFValue(3),
                              },
                            ]}
                          >
                            {t("Pickup")}
                          </Text>
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.black,
                                fontSize: RFValue(12),
                                lineHeight: RFValue(16),
                              },
                            ]}
                            numberOfLines={2}
                          >
                            📍{" "}
                            {selectPickupLocation?.destination_address ||
                              pickupaddress}
                          </Text>
                        </View>

                        <View
                          style={{
                            marginBottom:
                              extraAddres?.length > 0 ? RFValue(8) : 0,
                          }}
                        >
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.textgray,
                                fontWeight: "600",
                                marginBottom: RFValue(3),
                              },
                            ]}
                          >
                            {t("Drop-off")}
                          </Text>
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.black,
                                fontSize: RFValue(12),
                                lineHeight: RFValue(16),
                              },
                            ]}
                            numberOfLines={2}
                          >
                            🏁{" "}
                            {selectDropLocation?.destination_address ||
                              endAddress}
                          </Text>
                        </View>

                        {extraAddres?.length > 0 && (
                          <View>
                            <Text
                              style={[
                                styles.Text,
                                {
                                  color: Colors.textgray,
                                  fontWeight: "600",
                                  marginBottom: RFValue(5),
                                },
                              ]}
                            >
                              {t("Extra Stops")}
                            </Text>
                            {extraAddres.map((address, index) => (
                              <Text
                                key={index}
                                style={[
                                  styles.Text,
                                  {
                                    color: Colors.black,
                                    fontSize: RFValue(12),
                                    marginBottom: RFValue(3),
                                    paddingLeft: RFValue(10),
                                    lineHeight: RFValue(16),
                                  },
                                ]}
                                numberOfLines={2}
                              >
                                {index + 1}. {address}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Trip Details Section */}
                      <View
                        style={{
                          backgroundColor: Colors.white,
                          padding: RFValue(15),
                          borderRadius: RFValue(8),
                          elevation: 2,
                          shadowColor: Colors.black,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          borderLeftWidth: 4,
                          borderLeftColor: "#9C27B0",
                        }}
                      >
                        <Text
                          style={[
                            styles.Text,
                            {
                              color: "#9C27B0",
                              fontWeight: "bold",
                              fontSize: RFValue(14),
                              marginBottom: RFValue(8),
                            },
                          ]}
                        >
                          {t("Trip Details")}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: RFValue(6),
                          }}
                        >
                          <View style={{ flex: 1, marginRight: RFValue(10) }}>
                            <Text
                              style={[
                                styles.Text,
                                {
                                  color: Colors.textgray,
                                  fontWeight: "600",
                                  fontSize: RFValue(12),
                                },
                              ]}
                            >
                              {t("Pickup Time")}
                            </Text>
                            <Text
                              style={[
                                styles.Text,
                                { color: Colors.black, fontSize: RFValue(13) },
                              ]}
                            >
                              🕐 {Pickuptime || "-"}
                            </Text>
                          </View>
                          {DropTime && (
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.Text,
                                  {
                                    color: Colors.textgray,
                                    fontWeight: "600",
                                    fontSize: RFValue(12),
                                  },
                                ]}
                              >
                                {t("Drop Time")}
                              </Text>
                              <Text
                                style={[
                                  styles.Text,
                                  {
                                    color: Colors.black,
                                    fontSize: RFValue(13),
                                  },
                                ]}
                              >
                                🕐 {DropTime}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View
                        style={{
                          backgroundColor: Colors.white,
                          padding: RFValue(15),
                          borderRadius: RFValue(8),
                          elevation: 2,
                          shadowColor: Colors.black,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          borderLeftWidth: 4,
                          borderLeftColor: Colors.primary,
                        }}
                      >
                        <Text
                          style={[
                            styles.Text,
                            {
                              color: Colors.primary,
                              fontWeight: "bold",
                              fontSize: RFValue(14),
                              marginBottom: RFValue(8),
                            },
                          ]}
                        >
                          {t("Trip Details")}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{ width: "30%", marginBottom: RFValue(6) }}
                          >
                            <Text
                              style={[
                                styles.Text,
                                {
                                  color: Colors.textgray,
                                  fontWeight: "600",
                                  fontSize: RFValue(12),
                                },
                              ]}
                            >
                              {t("Persons")}
                            </Text>
                            <Text
                              style={[
                                styles.Text,
                                { color: Colors.black, fontSize: RFValue(13) },
                              ]}
                            >
                              👥 {TotalPerson || "-"}
                            </Text>
                          </View>
                          <View
                            style={{ width: "30%", marginBottom: RFValue(6) }}
                          >
                            <Text
                              style={[
                                styles.Text,
                                {
                                  color: Colors.textgray,
                                  fontWeight: "600",
                                  fontSize: RFValue(12),
                                },
                              ]}
                            >
                              {t("Suitcases")}
                            </Text>
                            <Text
                              style={[
                                styles.Text,
                                { color: Colors.black, fontSize: RFValue(13) },
                              ]}
                            >
                              🧳 {TotalSuitcase || "-"}
                            </Text>
                          </View>
                          <View
                            style={{ width: "30%", marginBottom: RFValue(6) }}
                          >
                            <Text
                              style={[
                                styles.Text,
                                {
                                  color: Colors.textgray,
                                  fontWeight: "600",
                                  fontSize: RFValue(12),
                                },
                              ]}
                            >
                              {t("Trollies")}
                            </Text>
                            <Text
                              style={[
                                styles.Text,
                                { color: Colors.black, fontSize: RFValue(13) },
                              ]}
                            >
                              🧳 {TotalTrolly || "-"}
                            </Text>
                          </View>
                          <View
                            style={{
                              width: "100%",
                              marginBottom: RFValue(6),
                              justifyContent: "space-between",
                              flexDirection: "row",
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.Text,
                                  {
                                    color: Colors.textgray,
                                    fontWeight: "600",
                                    fontSize: RFValue(12),
                                  },
                                ]}
                              >
                                {t("Tours")}
                              </Text>
                              <Text
                                style={[
                                  styles.Text,
                                  {
                                    color: Colors.black,
                                    fontSize: RFValue(13),
                                  },
                                ]}
                              >
                                {`${SelectTours?.tour_name} ` || "-"}
                              </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: "flex-end" }}>
                              <Text
                                style={[
                                  styles.Text,
                                  {
                                    color: Colors.textgray,
                                    fontWeight: "600",
                                    fontSize: RFValue(12),
                                  },
                                ]}
                              >
                                {t("Price")}
                              </Text>
                              <Text
                                style={[
                                  styles.Text,
                                  {
                                    color: Colors.black,
                                    fontSize: RFValue(13),
                                  },
                                ]}
                              >
                                {`${selectCurrency?.symbol}${ToursPrice?.price} ` ||
                                  "-"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Vehicle & Payment Section */}
                      <View
                        style={{
                          backgroundColor: Colors.white,
                          padding: RFValue(15),
                          borderRadius: RFValue(8),
                          elevation: 2,
                          shadowColor: Colors.black,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          borderLeftWidth: 4,
                          borderLeftColor: "#2196F3",
                        }}
                      >
                        <Text
                          style={[
                            styles.Text,
                            {
                              color: "#2196F3",
                              fontWeight: "bold",
                              fontSize: RFValue(14),
                              marginBottom: RFValue(8),
                            },
                          ]}
                        >
                          {t("Vehicle & Price")}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: RFValue(6),
                          }}
                        >
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.textgray,
                                fontWeight: "600",
                                flex: 0.5,
                              },
                            ]}
                          >
                            {t("Category")}
                          </Text>
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.black,
                                flex: 0.5,
                                textAlign: "right",
                              },
                            ]}
                          >
                            {" "}
                            {SelectVehicalCategory?.price_title || "-"}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginVertical: RFValue(6),
                          }}
                        >
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.textgray,
                                fontWeight: "600",
                                flex: 0.5,
                              },
                            ]}
                          >
                            {t("Price")}
                          </Text>
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.black,
                                flex: 0.5,
                                textAlign: "right",
                              },
                            ]}
                          >
                            {selectCurrency?.symbol}{" "}
                            {(() => {
                              const resolved =
                                Price !== "" &&
                                Price !== null &&
                                Price !== undefined
                                  ? Price
                                  : SelectVehicalCategory?.matched_price;
                              return resolved !== "" &&
                                resolved !== null &&
                                resolved !== undefined
                                ? resolved
                                : "-";
                            })()}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginVertical: RFValue(6),
                          }}
                        >
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.textgray,
                                fontWeight: "600",
                                fontSize: RFValue(12),
                              },
                            ]}
                          >
                            {t("Payment Method")}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.Text,
                            { color: Colors.black, fontSize: RFValue(13) },
                          ]}
                        >
                          {SelectPaymentMethod || "-"}
                        </Text>
                      </View>

                      {/* Notes Section */}
                      {AddComment && (
                        <View
                          style={{
                            backgroundColor: Colors.white,
                            padding: RFValue(15),
                            borderRadius: RFValue(8),
                            elevation: 2,
                            shadowColor: Colors.black,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            borderLeftWidth: 4,
                            borderLeftColor: "#607D8B",
                          }}
                        >
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: "#607D8B",
                                fontWeight: "bold",
                                fontSize: RFValue(14),
                                marginBottom: RFValue(8),
                              },
                            ]}
                          >
                            {t("Comment")}
                          </Text>
                          <Text
                            style={[
                              styles.Text,
                              {
                                color: Colors.textgray,
                                fontStyle: "italic",
                                fontSize: RFValue(12),
                                lineHeight: RFValue(18),
                                backgroundColor: "#F5F5F5",
                                padding: RFValue(10),
                                borderRadius: RFValue(6),
                              },
                            ]}
                          >
                            📝 {AddComment}
                          </Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.NextBtn,
                          {
                            width: step == 8 ? "50%" : "100%",
                            marginVertical: RFValue(5),
                          },
                        ]}
                      >
                        <Text style={styles.Text}>
                          {t("Total Price")} : {selectCurrency?.symbol}{" "}
                          {(Number(Price) || 0) +
                            (Number(ToursPrice?.price) || 0)}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                )}

                <View style={styles.Flex}>
                  {step == 8 && (
                    <TouchableOpacity
                      style={[
                        styles.NextBtn,
                        { width: step == 8 ? "50%" : "100%" },
                      ]}
                      onPress={() => setstep(1)}
                    >
                      <Text style={styles.Text}>{t("Edit")}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.NextBtn,
                      { width: step == 8 ? "50%" : "100%" },
                    ]}
                    onPress={handleStep}
                  >
                    <Text style={styles.Text}>
                      {step < 8 ? t("Next") : t("Save")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  status:{
    textAlign:"center",
    padding:2,
    paddingHorizontal:15,
    borderRadius:4,
    alignSelf:"center",
    marginTop:2
  },
  containerChild: {
    marginHorizontal: 20,
    flexDirection: "row",
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    justifyContent: "space-between",
  },
  vehicle_name: {
    backgroundColor: Colors.yellows,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 4
  },
  pimage: { height: 50, width: 50, borderRadius: 7 },
  nameview: { justifyContent: "space-evenly", paddingLeft: 10 },
  name: { color: Colors.black, fontFamily: FONTS.LexendMedium, fontSize: 15 },
  username: {
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    width: widthPercentageToDP("32%"),
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    marginTop: 20,
  },
  aview: {
    // position: "absolute",
    // right: 10,
    // top: '',
    justifyContent: "center",
    // height: "100%",
    // flexDirection:'row',
    alignItems: "center",
    // alignSelf: 'center',
    // flexDirection: 'column-reverse',
    // gap:5
  },

  aprrove: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
  },

  date: {
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 5 },

  pimage: { height: 50, width: 50, borderRadius: 7 },
  nameview: { justifyContent: "space-evenly", paddingLeft: 10 },
  name: { color: Colors.black, fontFamily: FONTS.LexendMedium, fontSize: 15 },
  checkView: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(12),
  },
  btn: {
    height: RFValue(41),
    backgroundColor: Colors.primary,
    // width: "45%",
    paddingHorizontal: 20,
    // alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
    marginTop: 15,
  },
  aprooveView: {
    padding: 5,
    borderRadius: 5,
    alignItems: "center",
    // marginBottom: 6,
  },
  Id: {
    color: Colors.black,
  },
  aprrove: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
  },
  date: {
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  checkView: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(12),
  },
  btn: {
    height: RFValue(41),
    backgroundColor: Colors.primary,
    // width: "45%",
    paddingHorizontal: 20,
    // alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
    marginTop: 15,
  },
  up: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 35,
    width: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalOptionsContainer: {
    position: "absolute",
    top: 50,
    right: 4,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "space-around",
    elevation: 5,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
  icons: {
    height: 110,
    width: 110,
    borderWidth: 2,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 15,
    borderColor: Colors.primary,
  },
  AddBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 7,
    alignSelf: "flex-start",
  },
  Text: {
    color: Colors.white,
    fontSize: RFValue(12),
    fontWeight: "500",
    fontFamily: FONTS.LexendRegular,
  },
  MainContentView: {
    width: "100%",
    // minHeight: '20%',
    backgroundColor: Colors.litegray,
    borderRadius: 10,
    marginHorizontal: "auto",
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    // maxHeight: '80%'
  },
  NextBtn: {
    width: "100%",
    height: RFValue(35),
    backgroundColor: Colors.primary,
    alignSelf: "center",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: RFValue(10),
  },
  closeBox: {
    position: "absolute",
    top: 0,
    right: 0,
    margin: 10,
  },
  close: {
    color: "white",
    width: 20,
    height: 20,
    borderColor: "black",
    border: "0.9",
  },
  closebtnbg: {
    height: 35,
    width: 35,
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  TextHeading: {
    fontSize: RFValue(13),
    // fontWeight: '500',
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    textTransform: "capitalize",
    marginVertical: 8,
  },
  Flex: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFValue(5),
  },
  AllInput: {
    width: "100%",
    borderWidth: 0.5,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: RFValue(40),
    // paddingVertical: RFValue(6),
    borderColor: Colors.litegray,
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginVertical: 10,
    backgroundColor: Colors.white,
  },
  dropdownButtonStyle: {
    height: RFValue(40),
    borderWidth: 1,
    borderColor: Colors.litegray,
    width: "100%",
    borderRadius: 7,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    // marginTop: RFValue(5),

    backgroundColor: Colors.white,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    marginLeft: "3%",
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  dropdownMenuStyle: {
    height:250,
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
  Error: {
    fontSize: RFValue(11),
    color: Colors.red,
    fontFamily: FONTS.LexendRegular,
    fontWeight: "500",
    marginTop: 5,
    marginLeft: 5,
  },
  Red: {
    color: Colors.red,
  },
  HeadingText: {
    fontSize: RFValue(12),
    fontWeight: "500",
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    marginVertical: 8,
  },
  Handle: {
    marginVertical: 10,
  },
  Fixed: {
    width: "100%",
    borderRadius: RFValue(4),
    // height: RFValue(300),
    maxHeight: RFValue(150),
    // ✅ iOS Shadow
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    // ✅ Android Shadow
    elevation: 4,

    // ✅ Optional (shadow won’t be visible without background)
    backgroundColor: Colors.white,
    // position: 'absolute',
    // top: RFValue(50),
    zIndex: 9999,
    borderWidth: 1,
    borderColor: Colors.textgray,
  },
  SuggestEl: {
    width: "100%",
    height: RFValue(40),
    borderBottomWidth: 0.5,
    borderColor: "#BBBBBB",
    backgroundColor: Colors.white,
    justifyContent: "center",
    paddingHorizontal: RFValue(10),
    zIndex: 9999,
    padding: 5,
    // alignItems:'center'
  },
  SuggestText: {
    fontSize: RFValue(12),
    fontWeight: "500",
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  Extra: {
    width: "100%",
    padding: 10,
    backgroundColor: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.textgray,
    borderRadius: 10,
    marginVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  CustomInput: {
    width: "90%",
    fontSize: RFValue(12),
    fontWeight: "500",
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
  },
  Scroll: {
    width: "100%",
    maxHeight: RFValue(120),
  },
  BothFlex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  Box: {
    width: "100%",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    flexDirection: "row",
    borderColor: Colors.litegray,
    backgroundColor: Colors.white,
    justifyContent: "space-between",
    borderRadius: 7,
    height: RFValue(35),
    alignItems: "center",
  },
  label: {
    fontSize: RFValue(13),
    fontWeight: "500",
    marginBottom: 5,
    color: "#333",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: RFValue(13),
    color: "#000",
    minHeight: 100,
    fontFamily: FONTS.LexendRegular,
  },
  comments: {
    marginVertical: 10,
  },
  editDateText: {
    color: Colors.black,
    paddingLeft: 10,
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(12),
  },
  dateImageContainer: {
    backgroundColor: Colors.primary,
    padding: 7,
    borderRadius: 5,
  },
  dateImage: {
    tintColor: Colors.white,
    height: 20,
    width: 20,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#ccc",
    width: "100%",
    alignSelf: "center",
  },
  title: {
    paddingVertical: 8,
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    alignSelf: "center",
  },
});
