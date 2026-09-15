import { View, Text, StyleSheet, Pressable, TouchableOpacity, Dimensions } from 'react-native'
import React, { useState } from 'react'
import Modal from 'react-native-modal'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../constants/color'

export default function CustomModal({ Title, MiddleText, LastText, isVisible, setVisible }) {
    const {height} =Dimensions.get("window")
    return (
        <SafeAreaView style={{flex:1,justifyContent:"center",alignItems:'center'}}>
            <Modal
                animationIn={'fadeInDown'}
                isVisible={isVisible}
                style={[styles.modal,{marginTop:height / 2.5}]}
                onBackButtonPress={() => setVisible(false)}
            >
                <View>
                    <Text style={styles.Title}>{Title}</Text>
                </View>
                <Text style={styles.Description}>
                    {MiddleText}
                </Text>
                <Text>{LastText}</Text>
                <TouchableOpacity style={styles.PressableBTN} onPress={() => setVisible(false)}>
                    <Text style={styles.BtnTextColor}>OK</Text>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 10,
        width: '80%',
        marginHorizontal: 'auto',
        paddingVertical: 10,
        maxHeight: 200,
        alignSelf:'center',
        color:'black',
    },
    Title: {
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        color:'black'
    },
    Description: {
        fontSize: 15,
        fontWeight: '400',
        marginVertical: 5,
        color:'black',
        lineHeight:22
    },
    PressableBTN: {
        width: '100%',
        borderTopWidth: 1,
        borderColor: 'gray',
        position: 'absolute',
        bottom: 0,
        paddingVertical: 10,
    },
    BtnTextColor: {
        color: Colors.primary,
        fontSize: 16,
        textAlign: 'center',
        fontWeight:'600'
    }
})