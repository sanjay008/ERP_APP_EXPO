import React, { useMemo, useState } from "react";
import {
  StyleProp,
  ImageStyle,
  ImageSourcePropType,
  ImageResizeMode,
  ImageURISource,
  Image,
} from "react-native";
import { Images } from "../utils/Images";

type Props = {
  source?: ImageURISource | ImageSourcePropType | number | null | string;
  style?: StyleProp<ImageStyle>;
  fallbackImage?: ImageSourcePropType | number;
  tintColor?: string;
  resizeMode?: ImageResizeMode;
  baseUrl?: string;
};

const DEFAULT_FALLBACK = Images.DefaultImage;

const isUriSource = (src: unknown): src is ImageURISource => {
  return typeof src === "object" && src !== null && typeof (src as ImageURISource).uri === "string";
};

const isFullUrl = (uri: string) => /^https?:\/\//i.test(uri);

const joinUrl = (base: string, path: string) => {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
};

type Resolved =
  | { kind: "require"; value: number }
  | { kind: "uri"; value: string }
  | { kind: "empty" };

function resolveUri(source: Props["source"], baseUrl: string): Resolved {
  if (source == null) return { kind: "empty" };

  if (typeof source === "number") {
    return { kind: "require", value: source };
  }

  if (typeof source === "string") {
    const uri = source.trim();
    if (!uri) return { kind: "empty" };
    return {
      kind: "uri",
      value: isFullUrl(uri) ? uri : baseUrl ? joinUrl(baseUrl, uri) : uri,
    };
  }

  if (isUriSource(source)) {
    const uri = source.uri?.trim() || "";
    if (!uri) return { kind: "empty" };
    return {
      kind: "uri",
      value: isFullUrl(uri) ? uri : baseUrl ? joinUrl(baseUrl, uri) : uri,
    };
  }

  return { kind: "empty" };
}

function sourceIdentity(source: Props["source"], baseUrl: string) {
  const resolved = resolveUri(source, baseUrl);
  if (resolved.kind === "require") return `require:${resolved.value}`;
  if (resolved.kind === "uri") return `uri:${resolved.value}`;
  return "empty";
}

const FallBackImage: React.FC<Props> = ({
  source,
  style,
  fallbackImage,
  tintColor,
  resizeMode = "cover",
  baseUrl = "",
}) => {
  const fallback = fallbackImage ?? DEFAULT_FALLBACK;
  const identity = sourceIdentity(source, baseUrl);
  const resolved = useMemo(() => resolveUri(source, baseUrl), [identity]);
  const [failedIdentity, setFailedIdentity] = useState<string | null>(null);
  const hasError = failedIdentity === identity;

  const finalSource = useMemo(() => {
    if (hasError || resolved.kind === "empty") return fallback;
    if (resolved.kind === "require") return resolved.value;
    return { uri: resolved.value };
  }, [fallback, hasError, resolved]);

  return (
    <Image
      source={finalSource as ImageSourcePropType}
      style={[style as StyleProp<ImageStyle>, tintColor ? { tintColor } : undefined]}
      resizeMode={resizeMode}
      onError={() => {
        if (identity !== "empty") setFailedIdentity(identity);
      }}
    />
  );
};

function propsAreEqual(prev: Props, next: Props) {
  if (prev.tintColor !== next.tintColor) return false;
  if (prev.resizeMode !== next.resizeMode) return false;
  if (prev.baseUrl !== next.baseUrl) return false;
  if (prev.fallbackImage !== next.fallbackImage) return false;
  if (prev.style !== next.style) return false;
  return (
    sourceIdentity(prev.source, prev.baseUrl || "") ===
    sourceIdentity(next.source, next.baseUrl || "")
  );
}

export default React.memo(FallBackImage, propsAreEqual);
