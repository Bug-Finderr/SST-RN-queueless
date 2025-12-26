import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useAuthState, useLogout } from "@/hooks/useAuth";
import { colors } from "@/lib/theme";

const showToast = (message: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("Info", message);
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthState();
  const { mutateAsync: logout } = useLogout();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handlePlaceholderPress = () => showToast("Just a placeholder button");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.role === "admin" && (
            <View style={styles.adminBadge}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePlaceholderPress}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePlaceholderPress}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: colors.warningLight },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.warning}
                />
              </View>
              <Text style={styles.menuText}>Notifications</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePlaceholderPress}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: colors.successLight },
                ]}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color={colors.success}
                />
              </View>
              <Text style={styles.menuText}>Help & Support</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePlaceholderPress}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: colors.backgroundAlt },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.menuText}>About</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <Button
          label="Logout"
          icon="log-out-outline"
          variant="destructive"
          onPress={handleLogout}
          fullWidth
          style={{ marginTop: 24 }}
        />

        <Text style={styles.version}>QueueLess v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 4,
  },
  adminText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  menuSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundAlt,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  version: {
    textAlign: "center",
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 24,
  },
});
