import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Vibration, Platform, Modal, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants/images';
import { Camera, CameraType } from 'react-native-camera-kit';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/color';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { RegisterBackContext } from '../constants/GoBackContext';
import ApiService from '../utils/Apiservice';
import apiConstants from '../api/apiConstants';
import { getData } from '../utils/storeData';
import { FONTS } from '../constants/fontFamily';
import { t } from 'i18next';

export default function ScannerDetails({ route }) {
    const { item, bgcolor } = route?.params || {};
    const [flashEnabled, setFlashEnabled] = useState(false);
    const { goBack, navigate } = useNavigation();
    const [IsLoading, setIsLoading] = useState(false);
    const { height, width } = Dimensions.get("window");
    const Focused = useIsFocused();
    const { setToast } = useContext(RegisterBackContext);
    const [Count, setCount] = useState(0);
    const cameraRef = useRef(null);
    const onReadCode = async (event) => {
        if (Platform.OS === 'android') {
            Vibration.vibrate([500, 500, 500]);
        } else {
            Vibration.vibrate();
        }
        let data = event?.nativeEvent?.codeStringValue
        let real_data = JSON.parse(data);
        console.log("Real Data", real_data);
        const id = real_data?.code_id ?? real_data?.qr_id;

        if (!id) {
            setToast({
                top: 45,
                text: t("Invalid QR Code"),
                type: "error",
                visible: true,
            });
            return;
        }

        await Verification(id);

    };

    const toggleFlash = () => {
        setFlashEnabled((prev) => !prev);
    };


    const Verification = async (unique_id) => {
        setIsLoading(true)
        try {
            const data = await getData("USERDATA");
            let UserData = data?.data;
            let res = await ApiService(apiConstants.event_booking_verification, {
                includeToken: true,
                customData: {
                    unique_id: unique_id,
                    event_id: item?.id
                },
            });

            console.log("QR Verification res", res);
            if (res?.status) {
                Vibration.vibrate([300, 500])
                navigate("EventDetails", { itemData: res, bgcolor: bgcolor })
            } else {
                setToast({
                    top: 45,
                    text: res?.message,
                    type: "error",
                    visible: true,
                });
            }
        } catch (error) {
            console.log("Confiramtion Error-", error);
            if (axios.isAxiosError(error)) {
                setToast({
                    text:
                        error?.response?.data?.message ||
                        error?.message ||
                        t("Something Wrong"),
                    type: "error",
                    visible: true,
                });
            }
        }
        finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (Focused) {
            setCount(pre => pre + 1)
        }
    }, [Focused])
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.TopIcon}>
                <TouchableOpacity
                    style={styles.Button}
                    onPress={toggleFlash}
                >
                    <Ionicons
                        name={flashEnabled ? "flash-sharp" : "flash-outline"}
                        size={24}
                        color={Colors.white}
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.Button} onPress={goBack}>
                    <Image source={Images.close} style={styles.Icons} />
                </TouchableOpacity>
            </View>
            <Camera
                key={Count}
                ref={cameraRef}
                style={styles.camera}
                cameraType={CameraType.Back}
                flashMode={'auto'}
                torchMode={flashEnabled ? 'on' : 'off'}
                scanBarcode={true}
                onReadCode={onReadCode}
            />
            <Image
                source={Images.ScannerCenter}
                style={{ width, height, position: "absolute" }}
            />
            <Modal
                visible={IsLoading}
                animationType='slide'
                backdropColor={"transparent"}
            >
                <View style={styles.Loader}>
                    <ActivityIndicator size={"large"} color={Colors.primary} />
                    <Text style={[styles.Text, { marginTop: 10 }]}>{t("Wait")}...</Text>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1
    },
    TopIcon: {
        position: "absolute",
        top: '10%',
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 20,
        zIndex: 9999,
    },
    Button: {
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 10,
        borderRadius: 25,
    },
    Icons: {
        width: 24,
        height: 24,
        tintColor: Colors.white,
    },
    Loader: {
        width: "50%",
        height: 100,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 7,
        position: 'absolute',
        top: '45%',
        left: '25%',
        elevation: 3
    },
    Text: {
        fontSize: 14,
        fontFamily: FONTS.LexendRegular,
        color: Colors.black
    }
});