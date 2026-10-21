import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";

/** category_id is the form type for later: 1 company, 2 person, 3 object, 4 vehicle. */
export type QuickRelationCategoryId = 1 | 2 | 3 | 4 | number;

export type QuickRelationItem = {
  id?: number | string;
  title?: string;
  color?: string;
  hover_text?: string;
  icon?: string;
  popup_text?: string;
  category_id?: QuickRelationCategoryId;
  category_name?: string;
  relation_type_id?: number | string;
  relation_type_name?: string;
  relation_type_slug?: string;
  default_country_code?: string;
  is_employee_client?: boolean | number | string;
  is_customer_client?: boolean | number | string;
  is_employee_of_company?: boolean | number | string;
  is_create_user?: boolean | number | string;
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export function isRelationFlagOn(value?: boolean | number | string) {
  return value === 1 || value === "1" || value === true || value === "true";
}

export function parseQuickRelationItem(raw?: string): QuickRelationItem | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as QuickRelationItem;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export async function fetchQuickRelations() {
  const ctx = await getUserContext();
  return ApiService<QuickRelationItem[]>(apiConstants.getQuickRelations, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}
