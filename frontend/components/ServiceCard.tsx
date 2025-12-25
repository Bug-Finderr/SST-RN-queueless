import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";

interface ServiceCardProps {
  name: string;
  description: string;
  currentToken: number | null;
  waitingCount: number;
  estimatedWaitMins: number;
  onBook: () => void;
}

export function ServiceCard({
  name,
  description,
  currentToken,
  waitingCount,
  estimatedWaitMins,
  onBook,
}: ServiceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {currentToken ? `Now: #${currentToken}` : "No active"}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="people-outline" size={16} color="#64748b" />
          <Text style={styles.statText}>{waitingCount} waiting</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text style={styles.statText}>~{estimatedWaitMins} min</Text>
        </View>
      </View>

      <Button label="Book Token" onPress={onBook} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  badge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366f1",
  },
  description: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    lineHeight: 20,
  },
  stats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: "#64748b",
  },
});
