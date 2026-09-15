import { getData } from "./storeData";

export async function isUserLoggedIn() {
  const select = await getData("SELECT");
  const userData = await getData("USERDATA");
  const user = userData?.data;
  return Boolean(select && user?.user && user?.relaties);
}
