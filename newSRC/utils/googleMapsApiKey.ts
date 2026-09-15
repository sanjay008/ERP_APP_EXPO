import { getData } from "./storeData";

export async function getGoogleMapsApiKey(): Promise<string> {
  const key = await getData("GOOGLEMAPAPIKEY");
  return typeof key === "string" ? key : "";
}
