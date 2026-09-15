import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackHandler, Dimensions, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import i18n from '../translation/i18n';
import { Colors } from './colors';
import { FONTS, FontSize } from './FONTS';

const storeData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.log(e);
  }
};

const getData = async (key: string): Promise<any | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.log(e);
  }
};

const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.log(e);
  }
};
export const { width, height } = Dimensions.get('window')
export const useAppInsets = useSafeAreaInsets;
export { storeData, getData, clearAllData };

const DATE_LOCALES: Record<string, string> = {
  en: 'en',
  nl: 'nl',
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_NL = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

export const formatDisplayDate = (date?: string | null): string => {
  if (!date) return '';

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '';

  const isNL = i18n.language === 'nl';
  const day = isNL ? DAYS_NL[parsed.getDay()] : DAYS_EN[parsed.getDay()];
  const month = isNL ? MONTHS_NL[parsed.getMonth()] : MONTHS_EN[parsed.getMonth()];

  return `${day} ${String(parsed.getDate()).padStart(2, '0')} ${month} ${parsed.getFullYear()}`;
}

export const GlobalCss = StyleSheet.create({
  SimpleFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  GapTop: {
    marginTop: 10
  },
  FontSizeSmall: {
    fontSize: FontSize.Small
  },
  GapBottom: {
    marginBottom: 40
  },
  GapMediumBottom: {
    marginBottom: 10
  },
  EmptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: 'center',
  },
  NormalText: {
    fontSize: FontSize.Small,
    color: Colors.black,
    fontFamily: FONTS.LexendSemiBold
  },
  Icon: {
    width: 20,
    height: 20
  },
  FullFlex: {
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: 'center',
    flexDirection: "row",
    flexWrap: "wrap"
  },
  paddingTop: {
    paddingTop: 15
  },
  FlexLayout: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  ListEmptyComponent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: 'center',

  },
  GapVertical:{
    marginVertical:10
  },
  OnlyGap:{
    gap:15
  }
});


export function formatToApiDate(
  date: Date | string | number | null | undefined
): string | null {
  if (!date) return null;

  let parsedDate: Date;

  if (date instanceof Date) {
    parsedDate = date;
  } else {
    parsedDate = new Date(date);
  }

  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
export const removeHtmlTags = (htmlString: string) => {
  if (!htmlString) return '';

  return htmlString
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<\/(p|div|br|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};
import { getApiErrorMessage, parseApiError } from "./apiError";

export const handleApiError = (error: unknown) => {
  const message = getApiErrorMessage(error, i18n.t("Something went wrong"));
  console.log("Final API Error Message:", message);
  return parseApiError(error, i18n.t("Something went wrong"));
};


export const BaseImageUrl = 'https://app.erpportaal.nl/public/media/inventory_variable_image/'

