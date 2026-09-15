import { View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import ToastMessage from './ToastMessage'
import { RegisterBackContext } from '../constants/GoBackContext';
import OTAUpdatePopup from './OTAUpdatePopup';
import { restart, useStallionUpdate } from 'react-native-stallion';

export default function LayoutHeader({ children }) {
    const context = useContext(RegisterBackContext) || {};
    const { Toast, UpdateModal, setUpdateModal = () => {} } = context;
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const stallionUpdate = useStallionUpdate();
    const isRestartRequired = isReady
        ? (stallionUpdate?.isRestartRequired ?? false)
        : false;

    useEffect(() => {
        if (isRestartRequired && !UpdateModal) {
            setUpdateModal(true);
        }
    }, [isRestartRequired, UpdateModal, setUpdateModal]);

    const handleRestart = async () => {
        try {
            restart();
        } catch(e) {
            console.log('Restart error:', e);
        }
        setUpdateModal(false);
    };

    return (
        <View style={{ flex: 1 }}>
            {UpdateModal ? <OTAUpdatePopup onRestart={handleRestart} /> : null}
            <ToastMessage
                type={Toast?.type}
                visible={Toast?.visible}
                text={Toast?.text}
                top={Toast?.top}
            />
            {children}
        </View>
    )
}