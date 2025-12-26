import { ActivityIndicator, StyleSheet, View } from "react-native";

interface LoaderProps {
  size?: "small" | "large";
  fullScreen?: boolean;
  style?: object;
}

export function Loader({
  size = "large",
  fullScreen = true,
  style,
}: LoaderProps) {
  if (fullScreen) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size={size} color="#6366f1" />
      </View>
    );
  }

  return <ActivityIndicator size={size} color="#6366f1" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
