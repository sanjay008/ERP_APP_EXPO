import ApiService from "../utils/Apiservice";
import apiConstants from "../utils/apiConstants";
import { storeData } from "../utils/storeData";

export type LanguageItem = {
  id?: number;
  language_name: string;
  language_shortname: string;
};

export type CountryItem = {
  id?: number;
  country_name: string;
  country_code: string;
  flag_code?: string;
};

export type LoginUser = {
  id: number;
  email?: string;
  whatsapp_number?: string;
  enable_2fa?: number;
  verify_token?: string;
  login_company?: string;
  profile_image?: string | null;
};

export type CompanyData = {
  default_company?: {
    company_logo?: string;
    erp_google_maps_api_key?: string;
    country_codes?: string;
  };
};

export const fetchLanguages = () =>
  ApiService<LanguageItem[]>(apiConstants.langauge, {});

export const fetchCountries = () =>
  ApiService<CountryItem[]>(apiConstants.country, {});

export const loginCompany = (companyName: string) =>
  ApiService<{ default_company: CompanyData["default_company"] }>(
    apiConstants.companyLogin,
    {
      customData: { company_login: companyName.trim() },
    }
  );

export const loginNew = (payload: {
  companyLogin: string;
  email?: string;
  whatsappNumber?: string;
  countryCode: string;
}) =>
  ApiService<{ user: LoginUser; type?: string }>(apiConstants.login_new, {
    customData: {
      email: payload.email?.trim() ?? "",
      company_login: payload.companyLogin,
      whatsapp_number: payload.whatsappNumber?.trim() ?? "",
      country_code: payload.countryCode,
    },
  });

export const verifyOtp = (payload: {
  companyLogin: string;
  userId: number;
  otp: string;
  verifyToken: string;
  otpType: string;
  fcmToken?: string;
}) =>
  ApiService(apiConstants.Verifyotp_new_otp, {
    customData: {
      company_login: payload.companyLogin,
      user_id: payload.userId,
      otp: payload.otp,
      token: payload.verifyToken,
      fcm_token: payload.fcmToken ?? "",
      otp_type: payload.otpType,
    },
  });

export const resendOtp = (payload: {
  companyLogin: string;
  userId: number;
  otpType: string;
}) =>
  ApiService<{ type?: string }>(apiConstants.resend_otp, {
    customData: {
      company_login: payload.companyLogin,
      user_id: payload.userId,
      otp_type: payload.otpType,
    },
  });

export const loginWithPassword = (payload: {
  companyLogin: string;
  email: string;
  password: string;
  fcmToken?: string;
}) =>
  ApiService(apiConstants.Login, {
    customData: {
      password: payload.password.trim(),
      company_login: payload.companyLogin,
      email: payload.email,
      fcm_token: payload.fcmToken ?? "",
    },
  });

export const persistCompanySession = async (
  companyName: string,
  companyData?: CompanyData["default_company"]
) => {
  await storeData("COMPANYLOGIN", companyName.trim());
  await storeData("COMPANYLOGO", companyData?.company_logo ?? "");
  await storeData("GOOGLEMAPAPIKEY", companyData?.erp_google_maps_api_key ?? "");
};

export const persistAuthSession = async (response: unknown) => {
  await storeData("USERDATA", response);
  await storeData("LOGIN", true);
  await storeData("AUTH", true);
};

export type NewUserRegisterData = {
  id: number;
  verify_token: string;
};

export const registerNewUser = (payload: {
  companyLogin: string;
  whatsappNumber: string;
  countryCode: string;
}) =>
  ApiService<NewUserRegisterData>(apiConstants.register, {
    customData: {
      company_login: payload.companyLogin,
      whatsapp_number: payload.whatsappNumber,
      country_code: payload.countryCode,
    },
  });

export const verifySignupOtp = (payload: {
  companyLogin: string;
  userId: number;
  otp: string;
  verifyToken: string;
}) =>
  ApiService(apiConstants.Verifyotp, {
    customData: {
      company_login: payload.companyLogin,
      user_id: payload.userId,
      otp: payload.otp,
      token: payload.verifyToken,
      otp_type: "user_register_requests",
    },
  });

export type CreateUserWithRelatiesPayload = {
  verifyToken: string;
  userId: number;
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  address: string;
  birthPlace: string;
  birthDate: string;
  profileImage?: { uri: string; type?: string; name?: string } | null;
};

export const createUserWithRelaties = (payload: CreateUserWithRelatiesPayload) =>
  ApiService(apiConstants.createUserWithRelaties, {
    customData: {
      token: payload.verifyToken,
      user_id: payload.userId,
      relaties_type: "medewerker",
      relaties_type_id: 3,
      aanhef: payload.salutation,
      voornaam: payload.firstName,
      voorvoegsel: payload.middleName,
      achternaam: payload.lastName,
      email: payload.email,
      address: payload.address,
      department: null,
      category_id: 2,
      bedrijfsnaam: null,
      woning_name: null,
      voertuig_project: null,
      profile_image: payload.profileImage?.uri ? payload.profileImage : "",
      birth_place: payload.birthPlace,
      birth_date: payload.birthDate,
    },
  });

export const needsProfileCompletion = (response: {
  data?: {
    relaties?: {
      google_maps?: string | null;
      email_adres?: string | null;
    };
    user?: { profile_image?: string | null };
  };
}) => {
  const relaties = response?.data?.relaties;
  const user = response?.data?.user;

  return (
    relaties?.google_maps == null ||
    relaties?.email_adres == null ||
    user?.profile_image == null
  );
};

export { apiConstants };
