// import {Image, StyleSheet, Text, View} from 'react-native';
// import SelectDropdown from 'react-native-select-dropdown';
// import {Colors} from '../constants/color';
// import {FONTS} from '../constants/fontFamily';
// import {Images} from '../constants/images';
// import {useEffect, useState} from 'react';
// import {getData} from '../utils/storeData';
// import axios from 'axios';
// const DropDown = ({
//   initialSelectedItem,
//   signatureModal,
//   workorderuitvoerId,
// }) => {
//   console.log('initial selected ', initialSelectedItem);
//   const [id, setId] = useState('');
//   const [StutsData, setStutsData] = useState([]);
//   console.log('++++++' + StutsData);
//   // const [selectedItem, setSelectedItem] = useState(initialSelectedItem.status || 'Approved');
//   const [selectedItem, setSelectedItem] = useState(initialSelectedItem || {});
//   console.log('selectedItem.......<<<<<<<<', selectedItem.id);
//   // const StatusUpdateApi = async () => {
//   //   const user = await getData('USERDATA');
//   //   const requestData = new FormData();
//   //   const company = await getData('COMPANYLOGIN');
//   //   requestData.append('company_login', company);
//   //   requestData.append('user_id', user.user_id);
//   //   requestData.append('workorder_uitvoer_id', workorderuitvoerId);
//   //   requestData.append('stusts_id', selectedItem.id);
//   //   // requestData.append('klant_signature', comment);
//   //   axios({
//   //     method: 'POST',
//   //     url: apiConstants.workorderuitvoeraddcomment,
//   //     data: requestData,
//   //   })
//   //     .then(res => {
//   //       console.log('StatusUpdateApiu--=-=-=-=-=-=--=-->', res.data);

//   //     })
//   //     .catch(err => console.log(err));
//   // };

//   const status_data = async () => {
//     const statusdataa = await getData('STATUSDATA');
//     // console.log('statusdataa++++++++initial selected ', statusdataa);
//     setStutsData(statusdataa);
//   };
//   useEffect(() => {
//     status_data();
//   }, []);
//   useEffect(async () => {
//     if (initialSelectedItem) {
//       setSelectedItem(initialSelectedItem);
//     }
//   }, [initialSelectedItem]);
//   return (
//     <SelectDropdown
//       data={StutsData}
//       onSelect={(selectedItem, index) => {
//         console.log(selectedItem, index);
//         setSelectedItem(selectedItem);
//         // console.log('selectedItem', selectedItem);
//         setId(index);
//         if (selectedItem.lable == 'Approved') {
//           signatureModal(true);
//         }
//       }}
//       renderButton={(item, isOpened) => {
//         // console.log('item labele', item);
//         return (
//           <View
//             style={[
//               styles.dropdownButtonStyle,
//               {
//                 backgroundColor: selectedItem.color_code
//                   ? selectedItem.color_code
//                   : id == 0
//                   ? Colors.neworderlite
//                   : id == 1
//                   ? Colors.planlite
//                   : id == 2
//                   ? Colors.finishedlite
//                   : id == 3
//                   ? Colors.postponedlite
//                   : id == 4
//                   ? Colors.holdlite
//                   : id == 5
//                   ? Colors.approvelite
//                   : id == 6
//                   ? Colors.diclinelite
//                   : Colors.invoicelite,
//               },
//             ]}>
//             <Text
//               style={[
//                 styles.dropdownButtonTxtStyle,
//                 {
//                   color: selectedItem.color_code
//                     ? Colors.white
//                     : id == 0
//                     ? Colors.neworder
//                     : id == 1
//                     ? Colors.plan
//                     : id == 2
//                     ? Colors.finished
//                     : id == 3
//                     ? Colors.postponed
//                     : id == 4
//                     ? Colors.hold
//                     : id == 5
//                     ? Colors.approve
//                     : id == 6
//                     ? Colors.dicline
//                     : Colors.invoice,
//                 },
//               ]}>
//               {selectedItem.status ? selectedItem.status : item.status}
//             </Text>
//             <Image
//               source={Images.down}
//               tintColor={
//                 selectedItem.color_code
//                   ? Colors.white
//                   : id == 0
//                   ? Colors.neworder
//                   : id == 1
//                   ? Colors.plan
//                   : id == 2
//                   ? Colors.finished
//                   : id == 3
//                   ? Colors.postponed
//                   : id == 4
//                   ? Colors.hold
//                   : id == 5
//                   ? Colors.approve
//                   : id == 6
//                   ? Colors.dicline
//                   : Colors.invoice
//               }
//               style={{height: 20, width: 20}}
//             />
//           </View>
//         );
//       }}
//       renderItem={(item, index, isSelected) => {
//         // console.log('jfbkfdkjbjkn', item);
//         return (
//           <View
//             style={{
//               ...styles.dropdownItemStyle,
//               ...(isSelected && {backgroundColor: Colors.white}),
//             }}>
//             <Text style={styles.dropdownItemTxtStyle}>{item.status}</Text>
//           </View>
//         );
//       }}
//       // defaultButtonText={initialSelectedItem ? initialSelectedItem.label : 'Approved'}
//       showsVerticalScrollIndicator={false}
//       dropdownStyle={styles.dropdownMenuStyle}
//     />
//   );
// };

// export default DropDown;
// const styles = StyleSheet.create({
//   dropdownButtonStyle: {
//     width: 120,
//     borderRadius: 7,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     right: 30,
//   },
//   dropdownButtonTxtStyle: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   dropdownButtonArrowStyle: {
//     fontSize: 28,
//   },
//   dropdownButtonIconStyle: {
//     fontSize: 28,
//     marginRight: 8,
//   },
//   dropdownMenuStyle: {
//     backgroundColor: Colors.white,
//     borderRadius: 8,
//   },
//   dropdownItemStyle: {
//     width: '100%',
//     flexDirection: 'row',
//     paddingHorizontal: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   dropdownItemTxtStyle: {
//     flex: 1,
//     fontSize: 14,
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.black,
//   },
//   dropdownItemIconStyle: {
//     fontSize: 28,
//     marginRight: 8,
//   },
// });
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { Images } from "../constants/images";
import { useEffect, useState } from "react";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import { widthPercentageToDP } from "react-native-responsive-screen";
import ApiService from "../utils/Apiservice";

const DropDown = ({
  initialSelectedItem,
  signatureModal,
  workorderuitvoerId,
  setCurrentStuts,
  signtureStatusUpdateApi
}) => {
  const [id, setId] = useState("");
  const [StutsData, setStutsData] = useState([]);
  const [companyName, setCompanyName] = useState("");
  // const [selectedItem, setSelectedItem] = useState({});
  const [selectedItem, setSelectedItem] = useState(initialSelectedItem || {});
  // const {signtureStatusUpdateApi} = route.params;
  // console.log("selectedItem", selectedItem.id);
  const status_data = async () => {
    const statusdataa = await getData("STATUSDATA");
    setStutsData(statusdataa);
  };

  useEffect(() => {
    status_data();
  }, []);

  useEffect(() => {
    if (initialSelectedItem) {
      setSelectedItem(initialSelectedItem);
    }
  }, [initialSelectedItem]);

  const handleSelectItem = (selectedItem, index) => {
    setSelectedItem(selectedItem);
    setId(index);
    if (selectedItem.id == 64) {
      signatureModal(true);
      setCurrentStuts(selectedItem.id);
      // Alert.alert(
      //   `${companyName}`,
      //   'Weet u zeker dat u de status wilt wijzigen zonder handtekening.',
      //   [
      //     {
      //       text: 'Cancel',
      //       // onPress: () => Alert.alert('Cancel Pressed'),
      //       style: 'destructive',
      //     },
      //     {
      //       text: 'Ok',
      //       // onPress: () => Alert.alert('Cancel Pressed'),
      //       style: 'default',
      //     },
      //   ],
      //   {
      //     cancelable: true,
      //     onDismiss: () =>
      //       Alert.alert(
      //         'This alert was dismissed by tapping outside of the alert dialog.',
      //       ),
      //   },
      // );
    } else {
      StatusUpdateApi(selectedItem.id);
      signtureStatusUpdateApi(selectedItem.id);

    }
  };
  // const StatusUpdateApi = async () => {
  //   const requestData = new FormData();
  //   const verify_token = await getData("USERDATA");
  //   requestData.append("token", verify_token.data.user.verify_token);
  //   requestData.append("slug", "task_n_order");
  //   // console.log("task data re ===== ", requestData);

  //   axios({
  //     method: "POST",
  //     url: apiConstants.getstatus,
  //     data: requestData,
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //   })
  //     .then((res) => {
  //       // console.log("StatusUpdateApiu--=-=-=-=-=-=--=-->", res.data);
  //       // if (res.data.status) {
  //       //   // if (res.data.success) {
  //       //   // console.log("task data ========  ", res.data.data);
  //       //   // setStutsData(res.data.data);
  //       //   // storeData("STATUSDATA", res.data.data);
  //       // } else {
  //       //   setErrorMessage("NO ORDERS");
  //       //   Edit();
  //       //   console.log("false fhnftjnfyjfyrhj");
  //       // }
  //     })
  //     .catch((err) => console.log(err));
  // };
  const StatusUpdateApi = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
      });
      if (data.status) {
       console.log('status execute details screen ');
      } else {
        console.log("false");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  // useEffect(() => {
  //   StusSearch();
  // }, []);
  // const StatusUpdateApi = async (selectId) => {
  //   const user = await getData("USERDATA");
  //   const requestData = new FormData();
  //   const company = await getData("COMPANYLOGIN");
  //   setCompanyName(company);
  //   requestData.append("company_login", company);

  //   requestData.append("user_id", user.user_id);
  //   requestData.append("workorder_uitvoer_id", workorderuitvoerId);
  //   requestData.append("stusts_id", selectId);
  //   // requestData.append('klant_signature', comment);
  //   console.log(",,,,,,,,,,,", requestData);
  //   axios({
  //     method: "POST",
  //     url: apiConstants.workorderuitvoerupdatestusts,
  //     data: requestData,
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //   })
  //     .then((res) => {
  //       console.log("StatusUpdateApiu--=-=-=-=-=-=--=-->", res.data);
  //     })
  //     .catch((err) => console.log(err));
  // };
 
  return (
    <SelectDropdown
      data={StutsData}
      onSelect={handleSelectItem}
      renderButton={(item, isOpened) => {
        return (
          <View
            style={[
              styles.dropdownButtonStyle,
              {
                backgroundColor: selectedItem.color || Colors.neworderlite,
              },
            ]}
          >
            <Text
              style={[
                styles.dropdownButtonTxtStyle,
                {
                  color: selectedItem.color
                    ? Colors.white
                    : Colors.neworder,
                },
              ]}
            >
              {selectedItem.status_name}
            </Text>
            <Image
              source={Images.down}
              tintColor={
                selectedItem.color ? Colors.white : Colors.neworder
              }
              style={{ height: 20, width: 20 }}
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
            <Text style={styles.dropdownItemTxtStyle}>{item.status_name}</Text>
          </View>
        );
      }}
      showsVerticalScrollIndicator={false}
      dropdownStyle={styles.dropdownMenuStyle}
    />
  );
};

export default DropDown;

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: 120,
    borderRadius: 7,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    right: widthPercentageToDP(10),
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownMenuStyle: {
    backgroundColor: Colors.white,
    borderRadius: 8,
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
});
