import React, { useContext } from "react";
import { View, StyleSheet } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "../constants/color";
import { RegisterBackContext } from "../constants/GoBackContext";

 // Replace with your Google API key

const GoogleAddress = () => {
    const { RegisterBack, setRegisterBack, GOOGLE_API_KEY, setGOOGLE_API_KEY } = useContext(RegisterBackContext)
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder="Search"
        minLength={2} // minimum length of text to search
        autoFocus={false}
        returnKeyType={"search"}
        fetchDetails={true}
        onPress={(data, details = null) => {
          // 'details' is provided when fetchDetails = true
          console.log(data, "jhjuuh");
          console.log(details, "ooo");
          // Use 'details.geometry.location' to get the latitude and longitude
        }}
        query={{
          key: GOOGLE_API_KEY,
          language: "en", // language of the results
        }}
        styles={{
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          predefinedPlacesDescription: styles.predefinedPlacesDescription,
        }}
        nearbyPlacesAPI="GooglePlacesSearch"
        debounce={200}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: RFValue(45),
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: RFValue(5),
  },
  textInputContainer: {
    width: "100%",
  },
  textInput: {
    height: 44,
    color: "#5d5d5d",
    fontSize: 16,
  },
  predefinedPlacesDescription: {
    color: "#1faadb",
  },
});

export default GoogleAddress;
