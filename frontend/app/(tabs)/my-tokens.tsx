import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TokenCard } from "@/components/TokenCard";
import { useCancelToken, useMyTokens } from "@/hooks/use-queue";
import { ApiError } from "@/lib/api";

type FilterType = "active" | "history";

export default function MyTokensScreen() {
  const {
    data: tokens = [],
    isLoading: isLoadingTokens,
    isRefetching: isRefetchingTokens,
    refetch: refetchTokens,
  } = useMyTokens();
  const { mutate: cancelToken } = useCancelToken();
  const [filter, setFilter] = useState<FilterType>("active");

  const handleCancel = (tokenId: string, tokenNumber: number) => {
    Alert.alert(
      "Cancel Token",
      `Are you sure you want to cancel token #${tokenNumber}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            cancelToken(tokenId, {
              onSuccess: () => {
                Alert.alert("Success", "Token canceled successfully");
              },
              onError: (err) => {
                const message =
                  err instanceof ApiError
                    ? err.message
                    : "Failed to cancel token";
                Alert.alert("Error", message);
              },
            });
          },
        },
      ],
    );
  };

  const activeTokens = tokens.filter(
    (t) => t.status === "waiting" || t.status === "being_served",
  );
  const historyTokens = tokens.filter(
    (t) => t.status !== "waiting" && t.status !== "being_served",
  );

  const displayTokens = filter === "active" ? activeTokens : historyTokens;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ticket-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>
        {filter === "active" ? "No Active Tokens" : "No History"}
      </Text>
      <Text style={styles.emptyText}>
        {filter === "active"
          ? "Book a token from the Services tab to get started"
          : "Your past tokens will appear here"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tokens</Text>
        <Text style={styles.subtitle}>Track your queue position</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "active" && styles.filterActive,
          ]}
          onPress={() => setFilter("active")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "active" && styles.filterTextActive,
            ]}
          >
            Active ({activeTokens.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "history" && styles.filterActive,
          ]}
          onPress={() => setFilter("history")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "history" && styles.filterTextActive,
            ]}
          >
            History ({historyTokens.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingTokens && !tokens.length ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={displayTokens}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingTokens}
              onRefresh={refetchTokens}
              colors={["#6366f1"]}
            />
          }
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => (
            <TokenCard
              tokenNumber={item.token_number}
              serviceName={item.service_name}
              status={item.status}
              positionInQueue={item.position_in_queue}
              estimatedWaitMins={item.estimated_wait_mins}
              createdAt={item.created_at}
              notification={item.notification}
              onCancel={
                item.status === "waiting" || item.status === "being_served"
                  ? () => handleCancel(item.id, item.token_number)
                  : undefined
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  filterActive: {
    backgroundColor: "#6366f1",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  filterTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#475569",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});
