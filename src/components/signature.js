// import React, {useRef} from 'react';
// import {
//   AppRegistry,
//   StyleSheet,
//   Text,
//   View,
//   TouchableHighlight,
//   TouchableOpacity,
// } from 'react-native';
// import SignatureCapture from 'react-native-signature-capture';
// import {Colors} from '../constants/color';
// import {FONTS} from '../constants/fontFamily';

// const SignatureComponent = props => {
//   const {SaveSign} = props;
//   const signatureRef = useRef(null);

//   const saveSign = () => {
//     signatureRef.current.saveImage();
//   };

//   const resetSign = () => {
//     signatureRef.current.resetImage();
//   };

//   const onSaveEvent = result => {
//     //result.encoded - for the base64 encoded png
//     //result.pathName - for the file path name
//     // console.log(result);
//     // console.log('result');
//     SaveSign;
//   };

//   const onDragEvent = () => {
//     // This callback will be called when the user enters signature
//     console.log('dragged');
//   };

//   return (
//     <View style={{flex: 1}}>
//       <SignatureCapture
//         style={[{flex: 1}, styles.signature]}
//         ref={signatureRef}
//         onSaveEvent={onSaveEvent}
//         onDragEvent={onDragEvent}
//         saveImageFileInExtStorage={false}
//         showNativeButtons={false}
//         showTitleLabel={false}
//         backgroundColor={Colors.litegray}
//         strokeColor={Colors.black}
//         minStrokeWidth={4}
//         maxStrokeWidth={4}
//         viewMode={'portrait'}
//       />

//       <View
//         style={{
//           flex: 1,
//           flexDirection: 'row',
//           position: 'absolute',
//           bottom: 0,
//         }}>
//         <TouchableOpacity style={styles.buttonStyle} onPress={resetSign}>
//           <Text
//             style={{
//               fontSize: 15,
//               fontFamily: FONTS.LexendMedium,
//               color: Colors.black,
//             }}>
//             Opnieuw
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.buttonStyle, {backgroundColor: Colors.primary}]}
//           onPress={() => {
//             saveSign();
//           }}>
//           <Text
//             style={{
//               fontSize: 15,
//               fontFamily: FONTS.LexendMedium,
//               color: Colors.white,
//             }}>
//             Opslaan
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   signature: {
//     flex: 1,
//     borderColor: Colors.black,
//     borderWidth: 1,
//     marginTop: 10,
//   },
//   buttonStyle: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     height: 40,
//     backgroundColor: Colors.white,
//     margin: 10,
//     borderRadius: 7,
//   },
// });

// export default SignatureComponent;
