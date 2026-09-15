import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
} from "react-native";
import { Colors } from "../constants/color";
import { Camera, CameraType } from "react-native-camera-kit";
import { Images } from "../constants/images";
import { compressImage } from "../utils/imageCompressor";

export default function CustomCamera({ navigation, route }) {
  const params = route?.params || {};
  const { setData } = params;

  const [photos, setPhotos] = useState([]);
  const [torch, setTorch] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission !== "authorized") {
        console.log("Camera Permission Denied");
      }
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const result = await cameraRef.current.capture();
      console.log(result?.uri);
      
      setPhotos((prev) => [...prev, result.uri]); 
    }
  };

// const done = () => {
//   const formattedPhotos = photos.map((uri, index) => ({
//     uri: uri,
//     name: `camera_${Date.now()}_${index}.jpg`,
//     type: "image/jpeg",
//   }));

//   route.params?.setData?.(formattedPhotos);
//   navigation.goBack();
// };
const done = async () => {
  // remove empty or undefined photos FIRST
  const validUris = photos.filter(uri => uri && uri !== "");

  const formattedPhotos = validUris.map((uri, index) => ({
    uri: uri,
    name: `camera_${Date.now()}_${index}.jpg`,
    type: "image/jpeg",
  }));

  const compressedPhotos = await Promise.all(
    formattedPhotos.map((photo) => compressImage(photo))
  );

  route.params?.setData?.(compressedPhotos);
  navigation.goBack();
};

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        cameraType={CameraType.Back}
        flashMode="auto"
        photo={true}
      />

      {/* Flash Button */}
      <TouchableOpacity
        style={styles.flashButton}
        onPress={() => setTorch(!torch)}
      >
        <Image
          source={torch ? Images.OnFlash : Images.OffFlash}
          style={{ width: 28, height: 28 }}
          tintColor={Colors.white}
        />
      </TouchableOpacity>

      {/* Thumbnails */}
      <FlatList
        data={photos}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ position: "absolute", bottom: 100 }}
        contentContainerStyle={{ paddingLeft: 10, paddingRight: 25 }}
        renderItem={({ item }) => (
          <Image source={{ uri: item || item?.uri }} style={styles.AllClickImage} />
        )}
        keyExtractor={(_, i) => i.toString()}
      />

      {/* Capture Button */}
      <TouchableOpacity onPress={takePhoto} style={styles.captureOuter}>
        <View style={styles.captureInner} />
      </TouchableOpacity>

      {/* Done Button */}
      <TouchableOpacity
        disabled={photos.length === 0}
        onPress={done}
        style={[
          styles.DoneBtn,
          photos.length > 0 && { backgroundColor: Colors.primary },
        ]}
      >
        <Text style={styles.Text}>Done ({photos.length})</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  captureOuter: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.white,
    elevation: 8,
  },
  captureInner: {
    width: 38,
    height: 38,
    backgroundColor: Colors.white,
    borderRadius: 30,
  },
  flashButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 10,
  },
  AllClickImage: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  DoneBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 10,
    borderRadius: 10,
  },
  Text: {
    color: Colors.white,
    fontSize: 16,
  },
});
