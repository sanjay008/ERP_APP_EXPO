import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  compact?: boolean;
  contentKey?: string | number;
};

function RichDescriptionEditor({
  value,
  onChange,
  placeholder = "Type here...",
  error = false,
  disabled = false,
  compact = false,
  contentKey,
}: Props) {
  const editorRef = useRef<RichEditor>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (contentKey !== undefined) {
      initializedRef.current = false;
    }
  }, [contentKey]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    editorRef.current?.setContentHTML(value || "");
    if (value || contentKey !== undefined) {
      initializedRef.current = true;
    }
  }, [value, contentKey]);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.editorShell,
          compact && styles.editorShellCompact,
          error ? styles.editorError : null,
          disabled ? styles.editorDisabled : null,
        ]}
      >
        <RichEditor
          ref={editorRef}
          scrollEnabled={compact}
          disabled={disabled}
          initialContentHTML={value || ""}
          placeholder={placeholder}
          onChange={onChange}
          editorStyle={{
            backgroundColor: Colors.white,
            color: Colors.black,
            placeholderColor: Colors.placeholder,
            contentCSSText: `
              font-family: ${FONTS.OutfitRegular};
              font-size: 14px;
              line-height: 22px;
              min-height: ${compact ? "100px" : "120px"};
              padding: 10px;
              margin: 0;
              overflow: hidden;
              word-break: break-word;
            `,
            cssText: `
              body {
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: ${Colors.white};
              }
              #editor {
                overflow: hidden;
              }
            `,
          }}
          style={[styles.editorInner, compact && styles.editorInnerCompact]}
        />
      </View>

      <View style={[styles.toolbarShell, error ? styles.editorError : null]}>
        <RichToolbar
          editor={editorRef}
          disabled={disabled}
          selectedIconTint={Colors.primary}
          iconTint={Colors.black}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            actions.heading1,
            actions.heading2,
            actions.insertBulletsList,
            actions.insertOrderedList,
            actions.undo,
            actions.redo,
          ]}
          style={styles.toolbarInner}
        />
      </View>
    </View>
  );
}

export default React.memo(RichDescriptionEditor);

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
    width: "100%",
  },
  editorShell: {
    width: "100%",
    minHeight: 140,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    overflow: "hidden",
  },
  editorShellCompact: {
    minHeight: 120,
  },
  editorInner: {
    minHeight: 138,
    backgroundColor: Colors.white,
  },
  editorInnerCompact: {
    minHeight: 118,
  },
  editorError: {
    borderColor: Colors.dicline,
  },
  editorDisabled: {
    opacity: 0.55,
  },
  toolbarShell: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.SquareBtnBG,
    overflow: "hidden",
  },
  toolbarInner: {
    backgroundColor: Colors.SquareBtnBG,
  },
});
