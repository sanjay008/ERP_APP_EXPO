import axios from "axios";
import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { AppApiError, isEmptyListResponse, toAppApiError } from "../utils/apiError";
import { getData } from "../utils/storeData";
import i18n from "../translation/i18n";

export type ProductItem = {
  id?: number | string;
  product_name?: string;
  image_product?: string;
};

export type ProductImageAsset = {
  uri: string;
  type?: string;
  name?: string;
};

export type ProductSubCategory = {
  id?: number | string;
  sub_category_name?: string;
};

export type ProductCategory = {
  id?: number | string;
  category_name?: string;
  parentsub?: ProductSubCategory[];
};

function toProductListError(error: unknown): AppApiError {
  const parsed = toAppApiError(error);
  if (parsed.message.includes("Unsupported operand types")) {
    return new AppApiError({
      kind: "server",
      message: i18n.t("Product list server error"),
      statusCode: parsed.statusCode,
    });
  }
  return parsed;
}

export async function fetchProducts() {
  const userData = await getData("USERDATA");
  const verifyToken = userData?.data?.user?.verify_token;

  try {
    const response = await ApiService<ProductItem[]>(apiConstants.product_list, {
      customData: verifyToken ? { token: verifyToken } : {},
    });

    if (!response?.status) {
      if (isEmptyListResponse(response)) return [];
      throw toAppApiError({ message: response?.message || "Failed to fetch products" });
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw toProductListError(error);
  }
}

export type ProductTemplate = {
  id?: number | string;
  template_name?: string;
};

export async function fetchProductTemplates() {
  const userData = await getData("USERDATA");
  const verifyToken = userData?.data?.user?.verify_token;

  const response = await ApiService<ProductTemplate[]>(apiConstants.get_all_templates, {
    customData: verifyToken ? { token: verifyToken } : {},
  });

  if (!response?.status) {
    if (isEmptyListResponse(response)) return [];
    throw toAppApiError({ message: response?.message || "Failed to fetch templates" });
  }
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchProductCategories() {
  const userData = await getData("USERDATA");
  const verifyToken = userData?.data?.user?.verify_token;

  const response = await ApiService<ProductCategory[]>(
    apiConstants.get_all_templates_categorys,
    {
      customData: verifyToken ? { token: verifyToken } : {},
    }
  );

  if (!response?.status) {
    if (isEmptyListResponse(response)) return [];
    throw toAppApiError({ message: response?.message || "Failed to fetch categories" });
  }
  return Array.isArray(response.data) ? response.data : [];
}

export async function createProductFromTemplate(payload: {
  templateId: string | number;
  title: string;
  price: string;
  categoryId: string | number;
  description?: string;
  subCategoryIds?: Array<string | number>;
  images?: ProductImageAsset[];
}) {
  const userData = await getData("USERDATA");
  const verifyToken = userData?.data?.user?.verify_token;

  const formData = new FormData();
  formData.append("token", verifyToken ?? "");
  formData.append("template_id", String(payload.templateId));
  formData.append("name", payload.title);
  formData.append("price", payload.price);
  formData.append("category_id", String(payload.categoryId));
  formData.append(
    "sub_category_id",
    (payload.subCategoryIds ?? []).map(String).join(",")
  );
  formData.append("description", payload.description || "");

  (payload.images ?? []).forEach((img, index) => {
    const ext = img.type?.split("/")[1] || "jpg";
    formData.append("images[]", {
      uri: img.uri,
      type: img.type || "image/jpeg",
      name: img.name || `img_${Date.now()}_${index}.${ext}`,
    } as never);
  });

  const response = await axios.post(apiConstants.create_from_template, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });

  const data = response.data;
  if (!data?.status) {
    throw toAppApiError({ message: data?.message || "Failed to create product" });
  }
  return data;
}
