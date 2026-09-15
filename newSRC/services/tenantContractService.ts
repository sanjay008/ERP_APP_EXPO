import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";

export type ContractStatus = {
  id?: number | string;
  status_name?: string;
  color?: string;
};

export type ContractObjectData = {
  display_name?: string;
  street?: string;
  house_nr?: string;
  postcode?: string;
  country?: string;
};

export type ContractCurrency = {
  symbol?: string;
};

export type TenantContractItem = {
  id: number;
  debtor_number?: string;
  from?: string;
  end?: string;
  street?: string;
  house_nr?: string;
  rent_price?: string | number;
  object_data?: ContractObjectData;
  status?: ContractStatus;
  currency_data?: ContractCurrency;
};

export type TenantContractNote = {
  id: number;
  comment?: string;
  created_at?: string;
  user?: { username?: string };
};

export type TenantContractDetail = {
  id?: number;
  debtor_number?: string;
  rent_price?: string | number;
  deposit?: string | number;
  from?: string;
  end?: string;
  street?: string;
  house_nr?: string;
  postcode?: string;
  city?: string;
  object_data?: ContractObjectData;
  status?: ContractStatus;
  currency_data?: ContractCurrency;
  deposit_currencys?: ContractCurrency;
  landlord_data?: {
    display_name?: string;
    iban?: string;
  };
  bank_data?: { bank_name?: string };
  relatie_data?: { display_name?: string };
  tenant_two?: { display_name?: string };
  guarantor?: { display_name?: string };
  notes?: TenantContractNote[];
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export async function fetchTenantContracts() {
  const ctx = await getUserContext();
  return ApiService<TenantContractItem[]>(apiConstants.tenantcontract, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}

export async function fetchTenantContractDetails(contractId: string | number) {
  const ctx = await getUserContext();
  return ApiService<TenantContractDetail>(apiConstants.tenantcontractdetail, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      contract_id: contractId,
    },
  });
}

export function formatContractDate(dateString?: string | null) {
  if (!dateString) return "-";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
}

export function getContractStreet(item: TenantContractItem | TenantContractDetail) {
  const street =
    item.street !== undefined && item.street !== null
      ? item.street
      : item.object_data?.street || "-";
  const houseNr =
    item.house_nr !== undefined && item.house_nr !== null
      ? item.house_nr
      : item.object_data?.house_nr || "-";
  return `${street} | ${houseNr}`;
}
