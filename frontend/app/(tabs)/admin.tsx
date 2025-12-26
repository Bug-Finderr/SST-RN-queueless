import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormInput } from "@/components/ui/FormInput";
import { Loader } from "@/components/ui/Loader";
import {
  useCallNextToken,
  useCompleteToken,
  useCreateService,
  useQueueStatus,
  useServices,
  useSkipToken,
} from "@/hooks/useQueue";
import { showError } from "@/lib/error";
import { colors } from "@/lib/theme";

export default function AdminScreen() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [avgTime, setAvgTime] = useState("");

  const { data: services = [], isRefetching, refetch } = useServices();
  const { data: queueStatus, isLoading: isLoadingQueue } =
    useQueueStatus(selectedService);
  const { mutate: createService, isPending: isCreatingService } =
    useCreateService();
  const { mutate: callNextToken } = useCallNextToken();
  const { mutate: completeToken } = useCompleteToken();
  const { mutate: skipToken } = useSkipToken();

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleCreateService = () => {
    if (!serviceName.trim() || !serviceDesc.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    createService(
      {
        name: serviceName.trim(),
        description: serviceDesc.trim(),
        avgServiceTimeMins: parseInt(avgTime, 10) || 5,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setServiceName("");
          setServiceDesc("");
          setAvgTime("");
          Alert.alert("Success", "Service created successfully");
        },
        onError: (err) => showError(err, "Failed to create service"),
      },
    );
  };

  const handleCallNext = () => {
    if (!selectedService) return;

    callNextToken(selectedService, {
      onSuccess: (result) => {
        if (result.nextTokenNumber) {
          Alert.alert(
            "Token Called",
            `Now serving token #${result.nextTokenNumber}`,
          );
        } else if (result.completedPrevious) {
          Alert.alert(
            "Queue Complete",
            "Previous token completed. No more waiting tokens.",
          );
        } else {
          Alert.alert("Info", "No waiting tokens");
        }
      },
      onError: (err) => showError(err, "Failed to call next token"),
    });
  };

  const handleCompleteToken = () => {
    if (!selectedService || !queueStatus?.currentToken) return;

    Alert.alert(
      "Complete Token",
      `Mark token #${queueStatus.currentToken} as completed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () => {
            completeToken(selectedService, {
              onSuccess: (result) => {
                if (result.completed) {
                  Alert.alert(
                    "Success",
                    `Token #${result.tokenNumber} completed`,
                  );
                } else {
                  Alert.alert("Info", "No token being served");
                }
              },
              onError: (err) => showError(err, "Failed to complete token"),
            });
          },
        },
      ],
    );
  };

  const handleSkipToken = (tokenId: string, tokenNumber: number) => {
    Alert.alert("Skip Token", `Skip token #${tokenNumber}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Skip",
        style: "destructive",
        onPress: () => {
          skipToken(tokenId, {
            onSuccess: () => {
              Alert.alert("Success", `Token #${tokenNumber} skipped`);
            },
            onError: (err) => showError(err, "Failed to skip token"),
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        {services.length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {services.length === 0 ? (
        <EmptyState
          icon="storefront-outline"
          title="No Services Yet"
          description="Create your first service to start managing queues."
          action={{
            label: "Create Service",
            icon: "add",
            onPress: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.content}
        >
          {/* Service Selection */}
          <Text style={styles.sectionTitle}>Select Service</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.serviceScroll}
          >
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceChip,
                  selectedService === service.id && styles.serviceChipActive,
                ]}
                onPress={() => handleSelectService(service.id)}
              >
                <Text
                  style={[
                    styles.serviceChipText,
                    selectedService === service.id &&
                      styles.serviceChipTextActive,
                  ]}
                >
                  {service.name}
                </Text>
                <View style={styles.chipBadge}>
                  <Text style={styles.chipBadgeText}>
                    {service.waitingCount}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Queue Management */}
          {selectedService && (
            <View style={styles.queueSection}>
              {isLoadingQueue ? (
                <Loader />
              ) : queueStatus ? (
                <>
                  {/* Current Token */}
                  <View style={styles.currentTokenCard}>
                    <Text style={styles.currentTokenLabel}>Now Serving</Text>
                    <Text style={styles.currentTokenNumber}>
                      {queueStatus.currentToken
                        ? `#${queueStatus.currentToken}`
                        : "None"}
                    </Text>

                    <Button
                      label={
                        queueStatus.currentToken
                          ? "Complete & Call Next"
                          : "Call Next"
                      }
                      icon="arrow-forward"
                      variant="success"
                      onPress={handleCallNext}
                      style={{ marginBottom: 12 }}
                      fullWidth
                    />

                    {queueStatus.currentToken && (
                      <Button
                        label="Complete"
                        icon="checkmark-circle"
                        variant="ghost"
                        onPress={handleCompleteToken}
                        fullWidth
                      />
                    )}
                  </View>

                  {/* Waiting Queue */}
                  <Text style={styles.sectionTitle}>
                    Waiting Queue ({queueStatus.totalWaiting})
                  </Text>
                  {queueStatus.waitingTokens.length === 0 ? (
                    <View style={styles.emptyQueue}>
                      <Ionicons
                        name="checkmark-circle"
                        size={48}
                        color={colors.success}
                      />
                      <Text style={styles.emptyQueueText}>No one waiting</Text>
                    </View>
                  ) : (
                    queueStatus.waitingTokens.map((token) => (
                      <View key={token.id} style={styles.queueItem}>
                        <View style={styles.queueItemLeft}>
                          <Text style={styles.queuePosition}>
                            {token.position}
                          </Text>
                          <View>
                            <Text style={styles.queueTokenNumber}>
                              Token #{token.tokenNumber}
                            </Text>
                          </View>
                        </View>
                        <Button
                          label="Skip"
                          icon="close"
                          variant="destructive"
                          size="sm"
                          onPress={() =>
                            handleSkipToken(token.id, token.tokenNumber)
                          }
                        />
                      </View>
                    ))
                  )}
                </>
              ) : null}
            </View>
          )}

          {!selectedService && (
            <View style={styles.selectPrompt}>
              <Ionicons name="arrow-up" size={32} color={colors.textMuted} />
              <Text style={styles.selectPromptText}>
                Select a service to manage its queue
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Service Modal */}
      <BottomSheet
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Service"
      >
        <FormInput
          label="Service Name"
          placeholder="e.g., General Consultation"
          value={serviceName}
          onChangeText={setServiceName}
        />

        <FormInput
          label="Description"
          placeholder="Describe this service"
          value={serviceDesc}
          onChangeText={setServiceDesc}
          multiline
          numberOfLines={3}
        />

        <FormInput
          label="Average Service Time (minutes)"
          placeholder="5"
          value={avgTime}
          onChangeText={setAvgTime}
          keyboardType="number-pad"
        />

        <Button
          label="Create Service"
          onPress={handleCreateService}
          loading={isCreatingService}
          size="lg"
          fullWidth
          style={{ marginTop: 8 }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textLabel,
    marginBottom: 12,
  },
  serviceScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 24,
  },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.border,
    borderRadius: 24,
    marginRight: 10,
    gap: 8,
  },
  serviceChipActive: {
    backgroundColor: colors.primary,
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textLabel,
  },
  serviceChipTextActive: {
    color: colors.white,
  },
  chipBadge: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  queueSection: {
    flex: 1,
  },
  currentTokenCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  currentTokenLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  currentTokenNumber: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.white,
    marginBottom: 16,
  },
  emptyQueue: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyQueueText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: "600",
    marginTop: 8,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  queueItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  queuePosition: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    textAlign: "center",
    lineHeight: 32,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  queueTokenNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  selectPrompt: {
    alignItems: "center",
    paddingTop: 60,
  },
  selectPromptText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 12,
  },
});
