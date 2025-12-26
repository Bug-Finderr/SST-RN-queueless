import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";
import { Button } from "./ui/Button";

type TokenStatus =
  | "waiting"
  | "being_served"
  | "completed"
  | "skipped"
  | "canceled";

interface TokenCardProps {
  tokenNumber: number;
  serviceName: string;
  status: TokenStatus;
  positionInQueue: number;
  estimatedWaitMins: number;
  createdAt: string;
  notification?: string;
  onCancel?: () => void;
}

const statusConfig: Record<
  TokenStatus,
  { color: string; bgColor: string; icon: string; label: string }
> = {
  waiting: {
    color: colors.warning,
    bgColor: colors.warningLight,
    icon: "time-outline",
    label: "Waiting",
  },
  being_served: {
    color: colors.success,
    bgColor: colors.successLight,
    icon: "person-outline",
    label: "Being Served",
  },
  completed: {
    color: colors.gray,
    bgColor: colors.grayLight,
    icon: "checkmark-circle-outline",
    label: "Completed",
  },
  skipped: {
    color: colors.danger,
    bgColor: colors.dangerLight,
    icon: "close-circle-outline",
    label: "Skipped",
  },
  canceled: {
    color: colors.gray,
    bgColor: colors.grayLight,
    icon: "ban-outline",
    label: "Canceled",
  },
};

const formatLocalTime = (isoString: string): string => {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

export default function TokenCard({
  tokenNumber,
  serviceName,
  status,
  positionInQueue,
  estimatedWaitMins,
  createdAt,
  notification,
  onCancel,
}: TokenCardProps) {
  const config = statusConfig[status];
  const canCancel = status === "waiting" || status === "being_served";
  const timeStr = formatLocalTime(createdAt);
  const isTurnNear = status === "waiting" && positionInQueue <= 3;

  return (
    <View style={styles.card}>
      {/* Turn Near Notification Banner */}
      {isTurnNear && status === "waiting" && (
        <View style={styles.turnNearBanner}>
          <Ionicons name="notifications" size={16} color="#fff" />
          <Text style={styles.turnNearText}>
            {notification || `Almost your turn! Position: ${positionInQueue}`}
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenNumber}>#{tokenNumber}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.serviceName}>{serviceName}</Text>
          <Text style={styles.timeText}>Booked at {timeStr}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
          <Ionicons
            name={config.icon as keyof typeof Ionicons.glyphMap}
            size={14}
            color={config.color}
          />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      {status === "waiting" && (
        <View style={styles.queueInfo}>
          <View style={styles.queueItem}>
            <Ionicons
              name="people-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.queueText}>
              Position: <Text style={styles.queueValue}>{positionInQueue}</Text>
            </Text>
          </View>
          <View style={styles.queueItem}>
            <Ionicons
              name="hourglass-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.queueText}>
              Est. Wait:{" "}
              <Text style={styles.queueValue}>{estimatedWaitMins} min</Text>
            </Text>
          </View>
        </View>
      )}

      {status === "being_served" && (
        <View style={styles.servingBanner}>
          <Ionicons name="megaphone-outline" size={20} color={colors.success} />
          <Text style={styles.servingText}>
            It's your turn! Please proceed.
          </Text>
        </View>
      )}

      {canCancel && onCancel && (
        <Button
          label="Cancel Token"
          icon="close-outline"
          variant="destructive"
          onPress={onCancel}
          fullWidth
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  turnNearBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warning,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 16,
    padding: 10,
    gap: 8,
  },
  turnNearText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tokenNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  queueInfo: {
    flexDirection: "row",
    marginTop: 16,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    gap: 24,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  queueText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  queueValue: {
    fontWeight: "700",
    color: colors.text,
  },
  servingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  servingText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
  },
});
