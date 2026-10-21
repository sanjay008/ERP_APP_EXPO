import axios from "axios";
import { getGoogleMapsApiKey } from "./googleMapsApiKey";

export type PlaceAddressParts = {
  formatted: string;
  street: string;
  house_number: string;
  postcode: string;
  city: string;
  region: string;
  country_name: string;
  country_iso: string;
};

type AddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

function component(components: AddressComponent[], type: string) {
  return components.find((item) => item.types?.includes(type));
}

function parseAddressComponents(
  components: AddressComponent[],
  formatted: string
): PlaceAddressParts {
  const country = component(components, "country");
  const city =
    component(components, "locality") ||
    component(components, "postal_town") ||
    component(components, "administrative_area_level_2");

  return {
    formatted,
    street: component(components, "route")?.long_name || "",
    house_number: component(components, "street_number")?.long_name || "",
    postcode: component(components, "postal_code")?.long_name || "",
    city: city?.long_name || "",
    region: component(components, "administrative_area_level_1")?.long_name || "",
    country_name: country?.long_name || "",
    country_iso: country?.short_name || "",
  };
}

export async function fetchGooglePlaceAddress(placeId: string): Promise<PlaceAddressParts | null> {
  const apiKey = await getGoogleMapsApiKey();
  if (!apiKey || !placeId) return null;

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
      params: {
        place_id: placeId,
        fields: "address_component,formatted_address",
        key: apiKey,
      },
    });
    const result = response.data?.result;
    const formatted = String(result?.formatted_address || "").trim();
    const components = Array.isArray(result?.address_components)
      ? (result.address_components as AddressComponent[])
      : [];
    if (!formatted && !components.length) return null;
    return parseAddressComponents(components, formatted);
  } catch {
    return null;
  }
}

export const COMPANY_ADDRESS_PARTS = {
  street: "co_street",
  house_number: "co_house_number",
  postcode: "co_postcode",
  city: "co_city",
  region: "co_region",
  country_name: "co_country_name",
  country_iso: "co_country_iso",
} as const;

export const PERSON_ADDRESS_PARTS = {
  street: "street",
  house_number: "house_number",
  postcode: "postcode",
  city: "city",
  region: "region",
  country_name: "country_name",
  country_iso: "country_iso",
} as const;

export function addressPartFieldsFor(fieldName: string) {
  const name = String(fieldName || "").toLowerCase();
  if (name === "co_address" || name.startsWith("co_")) return COMPANY_ADDRESS_PARTS;
  return PERSON_ADDRESS_PARTS;
}
