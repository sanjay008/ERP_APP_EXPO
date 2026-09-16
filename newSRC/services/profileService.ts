import axios from "axios";
import ApiService from "../utils/Apiservice";
import apiConstants from "../utils/apiConstants";
import { getData, storeData } from "../utils/storeData";

export type ProfileImageAsset = {
  uri: string;
  type?: string;
  name?: string;
};

export type UpdateProfilePayload = {
  userId: number;
  verifyToken: string;
  companyLogin: string;
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  address: string;
  birthPlace: string;
  birthDate: string;
  whatsappNumber?: string;
  countryCode?: string;
  categoryId?: number;
  profileImage?: ProfileImageAsset | null;
};

export type EditProfilePayload = {
  token: string;
  userId: number | string;
  salutation?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  privateEmail?: string;
  whatsappNumber?: string;
  countryCode?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  address?: string;
  birthDate?: string;
  birthPlace?: string;
  nationalityId?: string | number;
  iban?: string;
  maritalStatusId?: string | number;
  bsn?: string;
  documentNumber?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  profileImage?: ProfileImageAsset | null;
};

export async function updateProfileDetails(payload: EditProfilePayload) {
  const username = `${payload.firstName || ""} ${payload.middleName || ""} ${payload.lastName || ""}`.trim();

  const response = await ApiService(apiConstants.updateProfile, {
    customData: {
      token: payload.token,
      user_id: payload.userId,
      aanhef: payload.salutation || "",
      username,
      voornaam: payload.firstName || "",
      voorvoegsel: payload.middleName || "",
      achternaam: payload.lastName || "",
      email: payload.email || "",
      email_adres_private: payload.privateEmail || "",
      whatsapp_number: payload.whatsappNumber || "",
      country_code: payload.countryCode || "",
      contact_telefoon: payload.phoneNumber || "",
      contact_telefoon_country_code: payload.phoneCountryCode || "",
      google_maps: payload.address || "",
      birth_date: payload.birthDate || "",
      birth_place: payload.birthPlace || "",
      country: payload.nationalityId || "",
      iban: payload.iban || "",
      marital_status: payload.maritalStatusId || "",
      bsn_nr: payload.bsn || "",
      document_nr: payload.documentNumber || "",
      facebook_url: payload.facebookUrl || "",
      voertuig_kentekencheck: payload.linkedinUrl || "",
      profile_image: payload.profileImage?.uri ? payload.profileImage : undefined,
    },
  });

  if (response?.status) {
    await storeData("USERDATA", response);
    await storeData("LOGIN", true);
    await storeData("AUTH", true);
  }

  return response;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const formData = new FormData();

  formData.append("token", payload.verifyToken);
  formData.append("company_login", payload.companyLogin);
  formData.append("username", `${payload.firstName}${payload.lastName}`);
  formData.append("user_id", String(payload.userId));
  formData.append("aanhef", payload.salutation);
  formData.append("voornaam", payload.firstName);
  formData.append("voorvoegsel", payload.middleName);
  formData.append("achternaam", payload.lastName);
  formData.append("email", payload.email);
  formData.append("address", payload.address);
  formData.append("google_maps", payload.address);
  formData.append("department", "");
  formData.append("category_id", String(payload.categoryId ?? 2));
  formData.append("whatsapp_number", payload.whatsappNumber ?? "");
  formData.append("country_code", payload.countryCode ?? "");
  formData.append("birth_place", payload.birthPlace);
  formData.append("birth_date", payload.birthDate);

  if (payload.profileImage?.uri) {
    formData.append("profile_image", {
      uri: payload.profileImage.uri,
      name: payload.profileImage.name ?? "profile.jpg",
      type: payload.profileImage.type ?? "image/jpeg",
    } as never);
  }

  const response = await axios.post(apiConstants.updateProfile, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });

  const data = response.data;
  if (data?.status) {
    await storeData("USERDATA", data);
    await storeData("LOGIN", true);
    await storeData("AUTH", true);
  }

  return data;
}

export async function loadProfileSession() {
  const [userData, companyLogin, companyLogo] = await Promise.all([
    getData("USERDATA"),
    getData("COMPANYLOGIN"),
    getData("COMPANYLOGO"),
  ]);

  return {
    session: userData?.data ?? null,
    companyLogin: companyLogin ?? "",
    companyLogo: companyLogo ?? null,
  };
}
