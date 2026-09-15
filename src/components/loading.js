import {ActivityIndicator, View} from 'react-native';
import React from 'react';
import {Colors} from '../constants/color';

const Loader = ({color}) => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        // backgroundColor: Colors.transparant,
      }}>
      <ActivityIndicator
        animating={true}
        size={'large'}
        color={color? color : Colors.primary}
      />
    </View>
  );
};

export default Loader;
