import {
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { colors } from "@/lib/theme";

interface LoaderProps {
  size?: "small" | "large";
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function Loader({
  size = "large",
  fullScreen = true,
  style,
}: LoaderProps) {
  if (fullScreen) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size={size} color={colors.primary} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={colors.primary} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
