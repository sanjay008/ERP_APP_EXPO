import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  const tryNavigate = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
      return true;
    }
    return false;
  };

  if (tryNavigate()) {
    return;
  }

  let attempts = 0;
  const interval = setInterval(() => {
    attempts += 1;
    if (tryNavigate() || attempts >= 20) {
      clearInterval(interval);
    }
  }, 300);
}