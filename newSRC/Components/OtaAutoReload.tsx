import { useOtaAutoReload } from "../hooks/useOtaAutoReload";

/** Mount once at app root — checks OTA on launch and foreground, reloads without modal. */
export default function OtaAutoReload() {
  useOtaAutoReload();
  return null;
}
