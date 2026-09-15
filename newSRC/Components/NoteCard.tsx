import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";

type Props = {
  author?: string;
  time?: string;
  text?: string;
  heading?: string;
};

function stripHtml(html?: string | null) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function NoteCard({ author, time, text, heading }: Props) {
  return (
    <View style={styles.wrap}>
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}
      <View style={styles.block}>
        <View style={styles.headerBar}>
          <Ionicons name="star" size={16} color={AppColors.primary} />
          <Text style={styles.author}>{author || "-"}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.text}>{stripHtml(text)}</Text>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  heading: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 8,
  },
  block: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DCE6FA",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F0FD",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  author: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  body: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  text: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.black,
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 11,
    color: AppColors.subtitle,
    textAlign: "right",
  },
});
