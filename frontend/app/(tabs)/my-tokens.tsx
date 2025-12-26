import { useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TokenCard from "@/components/TokenCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader } from "@/components/ui/Loader";
import { useCancelToken, useMyTokens } from "@/hooks/useQueue";
import { showError } from "@/lib/error";
import { colors } from "@/lib/theme";

type FilterType = "active" | "history";

export default function MyTokensScreen() {
  const [filter, setFilter] = useState<FilterType>("active");

  const {
    data: tokens = [],
    isLoading: isLoadingTokens,
    isRefetching: isRefetchingTokens,
    refetch: refetchTokens,
  } = useMyTokens();
  const { mutate: cancelToken } = useCancelToken();

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
              onError: (err) => showError(err, "Failed to cancel token"),
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
    <EmptyState
      icon="ticket-outline"
      title={filter === "active" ? "No Active Tokens" : "No History"}
      description={
        filter === "active"
          ? "Book a token from the Services tab to get started"
          : "Your past tokens will appear here"
      }
    />
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
        <Loader />
      ) : (
        <FlatList
          data={displayTokens}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingTokens}
              onRefresh={refetchTokens}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => (
            <TokenCard
              tokenNumber={item.tokenNumber}
              serviceName={item.service.name}
              status={item.status}
              positionInQueue={item.positionInQueue ?? 0}
              estimatedWaitMins={item.estimatedWaitMins ?? 0}
              createdAt={item.createdAt}
              notification={item.notification}
              onCancel={
                item.status === "waiting" || item.status === "being_served"
                  ? () => handleCancel(item.id, item.tokenNumber)
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
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
    backgroundColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
