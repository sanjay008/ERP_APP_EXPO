import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { t } from 'i18next';
import { Colors } from '../constants/color';
import { RegisterBackContext } from '../constants/GoBackContext';

const OTAUpdatePopup = ({ onRestart }) => {
  const [loading, setLoading] = useState(false);
  const { setUpdateModal = () => {} } = useContext(RegisterBackContext) || {};

  const handleRestart = async () => {
    setLoading(true);
    try {
      await onRestart?.(); 
    } catch (err) {
      console.log('Restart error:', err);
    } finally {
      setLoading(false);
      setUpdateModal(false);
    }
  };

  return (
    <Modal
      isVisible={false}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropOpacity={0.5}
      useNativeDriver
    >
      <View style={styles.container}>
        <Text style={styles.title}>{t('Update Available')}</Text>
        <Text style={styles.description}>
          {t('A new version of the app is ready. Restart now to apply the latest updates.')}
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('Restarting...')}</Text>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleRestart}>
              <Text style={styles.primaryButtonText}>{t('Restart Now')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => setUpdateModal(false)}>
              <Text style={styles.secondaryButtonText}>{t('Close')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    width: '95%',
    alignSelf: 'center',
    shadowColor: Colors.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.primary, marginBottom: 14, textAlign: 'center' },
  description: { fontSize: 18, textAlign: 'center', color: Colors.black, marginBottom: 28, lineHeight: 24 },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  loadingText: { marginTop: 10, fontSize: 16, color: Colors.primary, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 16 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: Colors.primary },
  secondaryButton: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.primary },
  primaryButtonText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  secondaryButtonText: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
});

export default OTAUpdatePopup;
