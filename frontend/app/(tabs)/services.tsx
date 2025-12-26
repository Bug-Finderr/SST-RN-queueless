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
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader } from "@/components/ui/Loader";
import { useBookToken, useServices } from "@/hooks/useQueue";
import { showError } from "@/lib/error";
import { colors } from "@/lib/theme";

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
            onError: (err) => showError(err, "Failed to book token"),
            onSettled: () => setBookingServiceId(null),
          });
        },
      },
    ]);
  };

  const renderEmpty = () => (
    <EmptyState
      icon="storefront-outline"
      title="No Services Available"
      description="There are no services available at the moment. Please check back later."
    />
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
              colors={[colors.primary]}
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
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
