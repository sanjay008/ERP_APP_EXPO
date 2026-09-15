import {
  Image,
  // SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";
import { Calendar } from "react-native-calendars";
import Modal from "react-native-modal";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import Header from "../components/header";
import { SafeAreaView } from "react-native-safe-area-context";

const Calendercomponent = () => {
  const [selectedDates, setSelectedDates] = useState({});
  const [opencalender, setOpenCalender] = useState(false);
  const [calenderdate, setCalenderDate] = useState(null);

  const onDayPress = (day) => {
    const selectedDay = day.dateString;

    setSelectedDates((prevDates) => ({
      ...prevDates,
      [selectedDay]: {
        selected: !prevDates[selectedDay]?.selected,
        marked: !prevDates[selectedDay]?.marked,
        selectedColor: Colors.primary,
      },
    }));

    setCalenderDate((prevDates) => {
      const updatedDates = { ...prevDates };
      if (updatedDates[selectedDay]) {
        delete updatedDates[selectedDay];
      } else {
        updatedDates[selectedDay] = true;
      }
      return updatedDates;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
        <Header back title={"Calendercomponent"} />
      <View>
        <Text style={[styles.title, { marginTop: 10 }]}>Datum</Text>
        <View style={styles.dateInput}>
          <ScrollView
            vertical
            style={{ maxWidth: "80%", maxHeight: "80%" }}
            showsHorizontalScrollIndicator={false}
          >
            <Text style={styles.dateText}>
              {Object.keys(calenderdate || {}).join(" , ") || "Select Datum"}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.primary,
              padding: 7,
              borderRadius: 5,
            }}
            onPress={() => setOpenCalender(true)}
          >
            <Image
              source={Images.date}
              style={{ tintColor: Colors.white, height: 20, width: 20 }}
            />
          </TouchableOpacity>
        </View>

        <Modal
          isVisible={opencalender}
          backdropOpacity={0.5}
          animationType="slide"
          onBackdropPress={() => setOpenCalender(false)}
        >
          <View style={styles.modalContent}>
            <Calendar
              onDayPress={onDayPress}
              markedDates={selectedDates}
              markingType={"Dot marking"}
              //   markingType={"multi-dot"}
              theme={{
                todayTextColor: Colors.primary,
                textSectionTitleColor: Colors.black,
                selectedDayBackgroundColor: Colors.primary, // Background for selected days
                selectedDayTextColor: Colors.white, // Text color for selected day
                dayTextColor: Colors.black, // Text color for normal days
                textDisabledColor: Colors.litegray, // Text color for disabled days
                monthTextColor: Colors.black, // Month text color
                indicatorColor: Colors.primary, // Color of the indicator for multi-dot
                arrowColor: Colors.primary, // Color for the arrow
              }}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => setOpenCalender(false)}
                style={styles.closeButton}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setOpenCalender(false);
                  // Add any additional actions for setting the date here
                }}
                style={styles.setDateButton}
              >
                <Text style={[styles.buttonText, { color: Colors.white }]}>
                  Set Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Calendercomponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginTop: 20,
    marginHorizontal: 20,
  },
  dateInput: {
    width: widthPercentageToDP(90),
    height: heightPercentageToDP(7),
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderColor: Colors.litegray,
    borderWidth: 1,
    paddingHorizontal: 15,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginRight: 10,
    borderColor: Colors.primary,
    borderWidth: 1,
    width: "40%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  setDateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: "40%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  buttonText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: FONTS.LexendMedium,
  },
});

// import {
//   Image,
//   SafeAreaView,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import React, { useState } from "react";
// import { Images } from "../constants/images";
// import { Colors } from "../constants/color";
// import { Calendar } from "react-native-calendars";
// import Modal from "react-native-modal";
// import { FONTS } from "../constants/fontFamily";
// import { RFValue } from "react-native-responsive-fontsize";
// import {
//   heightPercentageToDP,
//   widthPercentageToDP,
// } from "react-native-responsive-screen";

// const Calendercomponent = () => {
//   const [selectedDates, setSelectedDates] = useState({});
//   const [opencalender, setOpenCalender] = useState(false);
//   const [calenderdate, setCalenderDate] = useState(null);

//   const onDayPress = (day) => {
//     const selectedDay = day.dateString;

//     // Toggle date selection in marked dates
//     setSelectedDates((prevDates) => ({
//       ...prevDates,
//       [selectedDay]: {
//         selected: !prevDates[selectedDay]?.selected,
//         marked: !prevDates[selectedDay]?.marked,
//         selectedColor: Colors.primary,
//       },
//     }));

//     setCalenderDate((prevDates) => {
//       const updatedDates = { ...prevDates };

//       if (updatedDates[selectedDay]) {
//         // If date is already selected, remove it
//         delete updatedDates[selectedDay];
//       } else {
//         // Otherwise, add it
//         updatedDates[selectedDay] = true;
//       }

//       return updatedDates;
//     });
//   };
//   return (
//     <SafeAreaView style={styles.container}>
//       <View>
//         <Text style={[styles.title, { marginTop: 10 }]}>Datum</Text>
//         <View style={styles.dateInput}>
//           {/* <Text
//         style={{
//           color:
//             calenderdate && calenderdate.length > 0
//               ? // calenderdate ?
//                 Colors.black
//               : Colors.textgray,
//           // paddingLeft: 10,
//           fontFamily: FONTS.LexendRegular,
//           width: "70%",
//         }}
//       > */}
//           {/* {calenderdate && calenderdate.length > 0
//           ? calenderdate.join(", ") // Display all selected dates separated by commas
//           : t("Select Datum")} */}
//           {/* {Object.keys(calenderdate).join(", ") || t("Select Datum")} */}
//           {/* {Object.keys(calenderdate || {}).join(", ") || t("Select Datum")} */}
//           {/* {calenderdate || "Select Datum"} */}
//           {/* </Text> */}
//           <ScrollView
//             vertical
//             style={{ maxWidth: "80%", maxHeight: "80%" }} // Adjust width as needed
//             showsHorizontalScrollIndicator={false}
//           >
//             <Text style={styles.dateText}>
//               {Object.keys(calenderdate || {}).join(" , ") || "Select Datum"}
//             </Text>
//           </ScrollView>
//           <TouchableOpacity
//             style={{
//               backgroundColor: Colors.primary,
//               padding: 7,
//               borderRadius: 5,
//             }}
//             onPress={() => {
//               setOpenCalender(true);
//             }}
//           >
//             <Image
//               source={Images.date}
//               style={{ tintColor: Colors.white, height: 20, width: 20 }}
//             />
//           </TouchableOpacity>
//         </View>

//         {/* Calendar Modal */}
//         <Modal
//           visible={opencalender}
//           transparent={true}
//           animationType="slide"
//           onBackdropPress={() => setOpenCalender(false)}
//         >
//           <View
//             style={{
//               flex: 1,
//               justifyContent: "center",
//               alignItems: "center",
//               backgroundColor: "rgba(0, 0, 0, 0.5)",
//             }}
//           >
//             <View
//               style={{
//                 backgroundColor: "white",
//                 borderRadius: 10,
//                 padding: 10,
//                 width: "90%",
//               }}
//             >
//               <Calendar
//                 onDayPress={(day) => {
//                   onDayPress(day);
//                 }}
//                 markedDates={selectedDates}
//                 // markingType={"multi-dot"}
//                 markingType={"Dot marking"}
//                 theme={{
//                   // backgroundColor: Colors.white,
//                   // calendarBackground: Colors.white,
//                   // textSectionTitleColor: Colors.black,
//                   // selectedDayTextColor: Colors.white,
//                   todayTextColor: Colors.primary,
//                   // dayTextColor: Colors.black,
//                   // textDisabledColor: Colors.black,
//                 }}
//               />
//             </View>
//             <TouchableOpacity
//               onPress={() => setOpenCalender(false)}
//               style={{
//                 marginTop: 20,
//                 padding: 10,
//                 backgroundColor: Colors.white,
//                 borderRadius: 10,
//               }}
//             >
//               <Text
//                 style={{
//                   color: Colors.primary,
//                   fontSize: 16,
//                   fontFamily: FONTS.LexendMedium,
//                 }}
//               >
//                 Close
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </Modal>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default Calendercomponent;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   title: {
//     fontSize: RFValue(14),
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.black,
//     marginTop: 20,
//     marginHorizontal: 20,
//   },
//   dateInput: {
//     width: widthPercentageToDP(90),
//     height: heightPercentageToDP(7),
//     // maxHeight:'20%',
//     backgroundColor: Colors.white,
//     borderRadius: 10,
//     borderColor: Colors.litegray,
//     borderWidth: 1,
//     // paddingLeft: 10,
//     // paddingRight: 10,
//     paddingHorizontal: 15,
//     // paddingVertical: 15,
//     alignItems: "center",
//     marginTop: 10,
//     flexDirection: "row",
//     marginHorizontal: 20,
//     marginBottom: 10,
//     justifyContent: "space-between",
//   },
// });
