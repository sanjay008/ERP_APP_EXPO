import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { resolveInitialRoute } from "../utils/authSession";

export default function HomeRedirect() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    resolveInitialRoute().then((route) => {
      setHref(route);
    });
  }, []);

  if (!href) {
    return null;
  }

  return <Redirect href={href} />;
}
