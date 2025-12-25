import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";

type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "destructive"
  | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variants: Record<Variant, { bg: string; text: string; border?: string }> =
  {
    primary: { bg: "#6366f1", text: "#fff" },
    secondary: { bg: "#e2e8f0", text: "#475569" },
    success: { bg: "#10b981", text: "#fff" },
    danger: { bg: "#ef4444", text: "#fff" },
    destructive: { bg: "#fef2f2", text: "#ef4444", border: "#fecaca" },
    ghost: { bg: "rgba(255, 255, 255, 0.2)", text: "#fff" },
  };

const sizes: Record<
  Size,
  {
    h?: number;
    pv: number;
    ph: number;
    font: number;
    radius: number;
    icon: number;
  }
> = {
  sm: { pv: 8, ph: 12, font: 14, radius: 8, icon: 16 },
  md: { pv: 12, ph: 16, font: 15, radius: 10, icon: 18 },
  lg: { h: 56, pv: 16, ph: 24, font: 16, radius: 12, icon: 20 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.border ? 1 : 0,
          height: s.h,
          paddingVertical: s.pv,
          paddingHorizontal: s.ph,
          borderRadius: s.radius,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Ionicons
              name={icon}
              size={s.icon}
              color={v.text}
              style={styles.iconLeft}
            />
          )}
          <Text style={[styles.label, { color: v.text, fontSize: s.font }]}>
            {label}
          </Text>
          {icon && iconPosition === "right" && (
            <Ionicons
              name={icon}
              size={s.icon}
              color={v.text}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "600",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
