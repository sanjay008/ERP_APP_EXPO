import React, { useContext, useEffect, useState } from "react";

import SplashScreen from "./Splash.js";
import { getData } from "../utils/storeData.js";
import { Image, StatusBar, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/color.js";
import { Images } from "../constants/images.js";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import ApiService from "../utils/Apiservice.js";
import apiConstants from "../api/apiConstants.js";
import { RegisterBackContext } from "../constants/GoBackContext.js";
import { GoogleAPi } from "../components/GoogleAPI.js";

const Auth = (props) => {

  const { RegisterBack, setRegisterBack, GOOGLE_API_KEY, setGOOGLE_API_KEY } = useContext(RegisterBackContext)

  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetchPermission();
  // }, []);

  // const fetchPermission = async () => {
  //   try {
  //     const getdata = await getData("USERDATA");
  //     if (
  //       !getdata ||
  //       !getdata.data ||
  //       !getdata.data.user ||
  //       !getdata.data.relaties
  //     ) {
  //       console.log("Missing required user data:", getdata);
  //       return;
  //     }

  //     const response = await ApiService(apiConstants.permission, {
  //       includeToken: true,
  //       customData: {
  //         relaties_id: getdata.data.relaties.id,
  //         user_id: getdata.data.user.id,
  //         role: getdata.data.user.role,
  //       },
  //     });

  //     if (response?.status && response?.data) {
  //       props.navigation.replace("BottamScreens1",{permission:response?.data});
  //       setPermission(response?.data);
  //       // Alert.alert("Success")
  //       console.log("response.data Permission==>", response.data.home_timeline?.read);

  //     }
  //   } catch (error) {
  //     console.log("Error fetching permission:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };






  // const isRegistered = useSelector((state) => state.Reducer.isRegistered);
  
  // console.log("auth isRegistered.........,.", isRegistered);

  const getAuthData = async () => {
    const auth = await getData("AUTH");
    const SELECT = await getData("SELECT");
    let logo = await getData("COMPANYLOGO");
    const user_data = await getData("USERDATA");
    const user = user_data?.data;


    // console.log("auth isRegistered.........,.", isRegistered);
    // console.log("SELECT.........,.", SELECT);
    // console.log("auth.........,.", auth);
    const get = async () => {
      let key = await GoogleAPi()
      setGOOGLE_API_KEY(key)
    }
    await get();
    console.log("Auth Screen user data", user);

    if (SELECT) {
      // if (isRegistered) {
      // if (auth) {
      if (user?.user && user?.relaties) {
        if (user?.relaties?.google_maps == null || user?.user?.profile_image == null || user?.relaties?.email_adres == null) {
          props.navigation.replace("NewStaff", {
            logo: logo,
            userId: user?.user?.id,
            type: "medewerker",
            typeId: 3,
            verify_token: user?.user?.verify_token,
            category_id: 2,
            dataaaa: user.data,
            is_logout: true
          });
        } else {
          setRegisterBack(false)
          props.navigation.reset({
            index: 0,
            routes: [{ name: "BottamScreens1" }],
          });

        }
        // fetchPermission()
        // props.navigation.replace("BottamScreens");
        // console.log("BottamScreens-=-=-=-=-=-=-=-=-=-=");
        // props.navigation.navigate("Select");
      } else {
        // props.navigation.navigate("Select");
        // props.navigation.replace("CompanyLogin");
        props.navigation.reset({
          index: 0,
          routes: [{ name: "CompanyLogin" }],
        });
        // props.navigation.replace("Login");
        // console.log("Login");
      }
    } else {
      props.navigation.navigate("Select");
      // if (SELECT) {
      //   if (auth) {
      //     props.navigation.replace("BottamScreens");
      //   } else {
      //     props.navigation.replace("Login");
      //   }
      // } else {
      //   props.navigation.navigate("Select");
      // }
    }
  };

  useEffect(() => {
    getAuthData();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor={"transparent"}
        barStyle={"dark-content"}
      />
      <Image source={Images.splash} style={styles.logo} />
    </View>
  );
};
export default Auth;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  logo: {
    width: wp("100%"),
    height: hp("100%"),
  },
});
