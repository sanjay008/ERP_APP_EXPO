import messaging from '@react-native-firebase/messaging'
import {PermissionsAndroid, Platform,Alert} from 'react-native';

export async function requestPermission() {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied (Android)');
        return;
      }
    }

    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const token = await messaging().getToken();
      console.log('✅ FCM Token:', token);
      return token;
    } else {
      console.log('❌ Permission not granted');
    }
  } catch (error) {
    console.log('Permission error:', error);
  }
}