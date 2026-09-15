import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleProp,
  ImageStyle,
  ImageSourcePropType,
  ImageResizeMode,
  ImageURISource,
  Image,
} from 'react-native';
import { Images } from '../utils/Images';

type Props = {
  source?: ImageURISource | ImageSourcePropType | number | null | string;
  style?: StyleProp<ImageStyle>;
  fallbackImage?: ImageSourcePropType | number;
  tintColor?: string;
  resizeMode?: ImageResizeMode;
  baseUrl?: string;
};

const DEFAULT_FALLBACK = Images.DefaultImage;

const isUriSource = (src: any): src is ImageURISource => {
  return (
    typeof src === 'object' &&
    src !== null &&
    typeof src.uri === 'string'
  );
};

const isFullUrl = (uri: string) => {
  return /^https?:\/\//i.test(uri);
};

const joinUrl = (base: string, path: string) => {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
};

const FallBackImage: React.FC<Props> = ({
  source,
  style,
  fallbackImage,
  tintColor,
  resizeMode = 'cover',
  baseUrl = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const fallback = fallbackImage ?? DEFAULT_FALLBACK;

  const finalSource = useMemo(() => {
    if (hasError) {
      return fallback;
    }

    if (!source) {
      return fallback;
    }

    if (typeof source === 'number') {
      return source;
    }

    if (typeof source === 'string') {
      const uri = source.trim();

      if (!uri) {
        return fallback;
      }

      return {
        uri: isFullUrl(uri)
          ? uri
          : baseUrl
          ? joinUrl(baseUrl, uri)
          : uri,
      };
    }

    if (isUriSource(source)) {
      const uri = source.uri?.trim();

      if (!uri) {
        return fallback;
      }

      return {
        ...source,
        uri: isFullUrl(uri)
          ? uri
          : baseUrl
          ? joinUrl(baseUrl, uri)
          : uri,
      };
    }

    return fallback;
  }, [source, hasError, fallback, baseUrl]);

  useEffect(() => {
    setHasError(false);
  }, [source]);

  return (
    <Image
      source={finalSource as ImageSourcePropType}
      style={[style as StyleProp<ImageStyle>, tintColor ? { tintColor } : undefined]}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
};

export default React.memo(FallBackImage);