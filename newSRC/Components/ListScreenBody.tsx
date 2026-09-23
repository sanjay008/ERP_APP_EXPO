import React from "react";
import { View, StyleSheet } from "react-native";
import ApiFeedback from "./ApiFeedback";
import { isEmptyParsedError, type ParsedApiError } from "../utils/apiError";

type ListScreenBodyProps = {
  loading: boolean;
  itemCount: number;
  apiError?: ParsedApiError | null;
  onRetry?: () => void;
  emptyMessage?: string;
  children: React.ReactNode;
};

export default function ListScreenBody({
  loading,
  itemCount,
  apiError,
  onRetry,
  emptyMessage,
  children,
}: ListScreenBodyProps) {
  if (loading && itemCount === 0) {
    return (
      <View style={styles.fill}>
        <ApiFeedback loading />
      </View>
    );
  }

  if (apiError && itemCount === 0 && !isEmptyParsedError(apiError)) {
    return (
      <View style={styles.fill}>
        <ApiFeedback error={apiError} onRetry={onRetry} />
      </View>
    );
  }

  return <>{children}</>;
}

export function listEmptyFeedback(props: {
  loading: boolean;
  apiError?: ParsedApiError | null;
  emptyMessage?: string;
  onRetry?: () => void;
}) {
  if (props.loading) return null;

  const emptyError = isEmptyParsedError(props.apiError);

  return (
    <ApiFeedback
      error={emptyError ? null : props.apiError}
      isEmpty={!props.apiError || emptyError}
      emptyMessage={props.emptyMessage}
      onRetry={emptyError ? undefined : props.onRetry}
      compact
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
