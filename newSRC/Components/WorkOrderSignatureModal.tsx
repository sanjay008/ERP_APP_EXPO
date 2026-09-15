import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import SignatureCanvas from "react-native-signature-canvas";
import { useTranslation } from "react-i18next";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";
import FallBackImage from "./FallBackImage";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../utils/screenInsets";

const SIGNATURE_WEB_STYLE = `
  .m-signature-pad--footer .save { display: none; }
  .m-signature-pad--footer .clear {
    margin: auto;
    background-color: #EF4444;
    padding: 0 20px;
  }
  .m-signature-pad {
    box-shadow: none;
    border: 1px solid #E0E5EA;
    border-radius: 10px;
  }
  body, html {
    width: 100%;
    height: 100%;
  }
`;

type Props = {
  visible: boolean;
  existingSignature?: string | null;
  initialName?: string;
  submitting?: boolean;
  onClose: () => void;
  onApprove: (payload: { signName: string; signature: string }) => void;
};

function stripBase64Prefix(value: string) {
  return value.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
}

export default function WorkOrderSignatureModal({
  visible,
  existingSignature,
  initialName = "",
  submitting = false,
  onClose,
  onApprove,
}: Props) {
  const { t } = useTranslation();
  const { modalPadding } = useScreenInsets();
  const signatureRef = useRef<any>(null);
  const [signName, setSignName] = useState(initialName);
  const [nameError, setNameError] = useState("");
  const [resetPad, setResetPad] = useState(false);

  const hasExistingSignature = Boolean(existingSignature);
  const showPad = !hasExistingSignature || resetPad;

  useEffect(() => {
    if (visible) {
      setSignName(initialName);
      setNameError("");
      setResetPad(false);
    }
  }, [visible, initialName]);

  const handleClose = () => {
    setNameError("");
    setResetPad(false);
    onClose();
  };

  const submitApproval = (signatureBase64: string) => {
    onApprove({
      signName: signName.trim(),
      signature: signatureBase64,
    });
  };

  const handleApprovePress = () => {
    if (!signName.trim()) {
      setNameError(t("Enter Naam"));
      return;
    }

    if (showPad) {
      signatureRef.current?.readSignature();
      return;
    }

    submitApproval("");
  };

  const handleSignatureOk = (signature: string) => {
    submitApproval(stripBase64Prefix(signature));
  };

  const handleSignatureEmpty = () => {
    setNameError(t("Please enter signature"));
  };

  const handleReset = () => {
    if (!showPad && hasExistingSignature) {
      setResetPad(true);
      return;
    }

    signatureRef.current?.clearSignature();
  };

  const handleUndo = () => {
    signatureRef.current?.undo();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={getKeyboardAvoidBehavior()}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.backdrop}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            <View style={[styles.sheet, { paddingBottom: modalPadding + 16 }]}>
              <View style={styles.header}>
                <Text style={styles.title}>{t("Handtekening voor akkoord")}</Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <FallBackImage
                    source={Images.CloseIcon}
                    style={styles.closeIcon}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>

              {showPad ? (
                <View style={styles.padWrap}>
                  <SignatureCanvas
                    ref={signatureRef}
                    onOK={handleSignatureOk}
                    onEmpty={handleSignatureEmpty}
                    webStyle={SIGNATURE_WEB_STYLE}
                    autoClear={false}
                    descriptionText=""
                    backgroundColor="#FFFFFF"
                    penColor="#111111"
                  />
                </View>
              ) : (
                <Image
                  source={{ uri: existingSignature || undefined }}
                  style={styles.existingSignature}
                  resizeMode="contain"
                />
              )}

              {showPad || hasExistingSignature ? (
                <View style={styles.actionRow}>
                  {showPad ? (
                    <Pressable style={styles.actionBtn} onPress={handleUndo}>
                      <Text style={styles.actionBtnText}>{t("Undo")}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.actionBtn} onPress={handleReset}>
                    <Text style={styles.actionBtnText}>{t("Opnieuw")}</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.nameRow}>
                <Text style={styles.nameLabel}>{t("Naam")} :</Text>
                <TextInput
                  style={styles.nameInput}
                  value={signName}
                  onChangeText={(text) => {
                    setSignName(text);
                    if (nameError) setNameError("");
                  }}
                  placeholder={t("Naam")}
                  placeholderTextColor={AppColors.subtitle}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

              <Pressable
                style={[styles.approveBtn, submitting && styles.approveBtnDisabled]}
                onPress={handleApprovePress}
                disabled={submitting}
              >
                <Text style={styles.approveBtnText}>
                  {submitting ? t("Loading...") : t("Approve")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
    paddingRight: 12,
  },
  closeIcon: {
    width: 22,
    height: 22,
  },
  padWrap: {
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  existingSignature: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    marginBottom: 12,
    backgroundColor: "#F7F9FB",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: "#F0F3F8",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionBtnText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  nameLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
  },
  errorText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: "#D14343",
    marginBottom: 8,
  },
  approveBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  approveBtnDisabled: {
    opacity: 0.7,
  },
  approveBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.white,
  },
});
