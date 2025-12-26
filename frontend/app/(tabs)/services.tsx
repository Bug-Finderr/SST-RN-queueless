import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ServiceCard from "@/components/ServiceCard";
import { Loader } from "@/components/ui/Loader";
import { useBookToken, useServices } from "@/hooks/useQueue";
import { ApiError } from "@/lib/api";

export default function ServicesScreen() {
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);

  const {
    data: services = [],
    isLoading: isLoadingServices,
    isRefetching: isRefetchingServices,
    refetch: refetchServices,
  } = useServices();
  const { mutate: bookToken } = useBookToken();

  const handleBookToken = (serviceId: string, serviceName: string) => {
    Alert.alert("Book Token", `Book a token for ${serviceName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Book",
        onPress: () => {
          setBookingServiceId(serviceId);
          bookToken(serviceId, {
            onSuccess: (token) => {
              Alert.alert(
                "Token Booked!",
                `Your token number is #${token.tokenNumber}\n\nPosition: ${token.positionInQueue}\nEstimated wait: ${token.estimatedWaitMins} minutes`,
              );
            },
            onError: (err) => {
              const message =
                err instanceof ApiError ? err.message : "Failed to book token";
              Alert.alert("Error", message);
            },
            onSettled: () => setBookingServiceId(null),
          });
        },
      },
    ]);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="storefront-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No Services Available</Text>
      <Text style={styles.emptyText}>
        There are no services available at the moment. Please check back later.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>Select a service to book your token</Text>
      </View>

      {isLoadingServices && !services.length ? (
        <Loader />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingServices}
              onRefresh={refetchServices}
              colors={["#6366f1"]}
            />
          }
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => (
            <View>
              <ServiceCard
                name={item.name}
                description={item.description}
                currentToken={item.currentToken}
                waitingCount={item.waitingCount}
                estimatedWaitMins={item.estimatedWaitMins}
                onBook={() => handleBookToken(item.id, item.name)}
              />
              {bookingServiceId === item.id && (
                <View style={styles.bookingOverlay}>
                  <Loader size="small" fullScreen={false} />
                </View>
              )}
            </View>
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
    paddingBottom: 16,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: "66%",
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
  bookingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
