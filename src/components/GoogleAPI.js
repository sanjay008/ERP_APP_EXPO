import { Alert } from "react-native";
import apiConstants from "../api/apiConstants";
import ApiService from "../utils/Apiservice";
import { getData } from "../utils/storeData";

export const GoogleAPi = async () => {
    let commpny = await getData('COMPANYLOGIN');
    console.log("DYNAMIC GET API===>>>>>", commpny);
    if (commpny !== "") {
        try {
            const data = await ApiService(apiConstants.companyLogin, {
                customData: {
                    company_login: commpny,
                },
            });
            if (data.status) {
                // console.log("FDATA=>",data.data.default_company.erp_google_maps_api_key);
                
                let datas = await data.data.default_company.erp_google_maps_api_key
                return datas
            }
        } catch (err) {
            // setCompnyError(t("Voer een geldige bedrijfsnaam in"));
            console.log("Error fetching connections:", err)
            return 0
        }
    }
}
