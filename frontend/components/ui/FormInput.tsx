import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "@/lib/theme";

interface FormInputProps extends Omit<TextInputProps, "style"> {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function FormInput({
  label,
  icon,
  isPassword,
  multiline,
  numberOfLines,
  ...inputProps
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isMultiline = Boolean(
    multiline || (numberOfLines && numberOfLines > 1),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          isMultiline && styles.inputWrapperMultiline,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={colors.textMuted}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[styles.input, isMultiline && styles.inputMultiline]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...inputProps}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textLabel,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperMultiline: {
    height: 100,
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  inputMultiline: {
    textAlignVertical: "top",
    height: "100%",
  },
});
