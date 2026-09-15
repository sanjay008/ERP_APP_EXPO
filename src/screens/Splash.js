import React, { useEffect } from 'react';
import {View, Image, StyleSheet, StatusBar, Platform, Text} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Colors} from '../constants/color';
import {Images} from '../constants/images';
const SplashScreen = () => {

  return (
    <>
      <View style={styles.container}>
        <StatusBar
          translucent={true}
          backgroundColor={'transparent'}
          barStyle={'dark-content'}
        />
        <Image source={Images.splash} style={styles.logo} />
      </View>
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  logo: {
    width: wp('100%'),
    height: hp('100%'),
  },
});

export default SplashScreen;
