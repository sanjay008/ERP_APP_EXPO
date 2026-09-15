import React, { useEffect, useState } from "react";
import { Image } from "react-native";

export default function FallbackImage({ source, fallback, style, resizeMode = "contain" }) {
  const [imgSource, setImgSource] = useState(fallback);

  const isValidUrl = (uri) => {
    return typeof uri === "string" && uri.trim().length > 0 &&
      (uri.startsWith("http://") || uri.startsWith("https://"));
  };

  useEffect(() => {
    if (source?.uri && isValidUrl(source.uri)) {
      setImgSource({ uri: source.uri });
    } else {
      setImgSource(fallback);
    }
  }, [source?.uri, fallback]);

  return (
    <Image
      source={imgSource}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        console.warn("Image failed to load or URI invalid, using fallback.");
        setImgSource(fallback);
      }}
    />
  );
}
