import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";

export type ChildContractStatus = {
  status_name?: string;
  color?: string;
};

export type ChildContractItem = {
  id: number;
  contract_name?: string;
  start_date?: string;
  end_date?: string;
  child_data?: { display_name?: string };
  contract_template_data?: { template_name?: string };
  relaties_school_data?: { display_name?: string };
  status?: ChildContractStatus;
  created_at?: string;
};

export type ChildScheduleBlock = {
  id?: number | string;
  day?: string;
  start_time?: string;
  end_time?: string;
  total_hours?: string | number;
  day_price?: string | number;
  year_price?: string | number;
  weeks_count?: string | number;
  weeks_hours?: string | number;
  rate_amount?: string | number;
  company_currency?: string;
  block_time?: { block_name?: string; total_time?: string };
  rate?: { amount?: string | number };
};

export type ChildContractDetail = {
  id?: number;
  contract_name?: string;
  start_date?: string;
  end_date?: string;
  child_age?: string | number;
  total_year_price?: string | number;
  average_per_month?: string | number;
  total_hours?: string | number;
  average_hours_price?: string | number;
  company_currency?: string;
  child_data?: { display_name?: string };
  branchdata?: { relatie?: { display_name?: string } };
  parent_data_one?: { display_name?: string };
  parent_data_second?: { display_name?: string };
  contract_template_data?: { template_name?: string };
  relaties_school_data?: { display_name?: string };
  status?: ChildContractStatus;
  schedule_blocks?: ChildScheduleBlock[];
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

/** `relatiesId` = selected child connection id (old ChildContract route param). */
export async function fetchChildContracts(relatiesId: string | number) {
  const ctx = await getUserContext();
  return ApiService<ChildContractItem[]>(apiConstants.childcontract, {
    includeToken: true,
    customData: {
      relaties_id: relatiesId,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}

export async function fetchChildContractDetails(contractId: string | number) {
  const ctx = await getUserContext();
  return ApiService<ChildContractDetail>(apiConstants.childcontractdetails, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      contract_id: contractId,
    },
  });
}

export function formatChildDate(dateString?: string | null) {
  if (!dateString) return "-";
  return dateString;
}
