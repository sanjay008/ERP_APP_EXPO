import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { getData } from "../utils/storeData";
import { FONTS } from "../constants/fontFamily";
import { Colors } from "../constants/color";
import { useNavigation } from "@react-navigation/native";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { RFValue } from "react-native-responsive-fontsize";

const Footer = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState("");

  const userdata = async () => {
    const userDatatatata = await getData("USERDATA");
    setUserData(userDatatatata);
  };

  useEffect(() => {
    userdata();
  }, []);

  return (
    <View style={{ marginTop: heightPercentageToDP(8) }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => navigation.navigate("Profile")}
        style={{
          flexDirection: "row",
          borderTopStartRadius: 20,
          borderTopEndRadius: 20,
          paddingHorizontal: 25,
          alignItems: "center",
          backgroundColor: Colors.litegray, // Background color for shadow visibility
          borderWidth: 1,
          borderColor: Colors.Boxgray,
          paddingBottom: 15,
          paddingTop: 15,
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: heightPercentageToDP(10),

          // Shadow for iOS
          shadowColor: Colors.black,
          shadowOffset: {
            width: 0,
            height: -2, // Negative value for shadow on top
          },
          shadowOpacity: 0.1, // Adjust for visibility
          shadowRadius: 3.84,

          // Elevation for Android
          elevation: 6,
        }}
      >
        <Image
          source={{ uri: userData?.data?.relaties?.file_path }}
          style={{
            height: 40,
            width: 40,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: Colors.litegray,
          }}
        />
        <Text
          style={{
            fontSize: RFValue(13),
            color: Colors.black,
            fontFamily: FONTS.LexendMedium,
            marginLeft: 15,
            width: "80%",
          }}
        >
          {userData?.data?.relaties?.display_name
            ? userData?.data?.relaties?.display_name
            : "Profiel"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({});
