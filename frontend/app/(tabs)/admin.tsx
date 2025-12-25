import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheet } from "@/components/BottomSheet";
import {
  useCallNextToken,
  useCompleteToken,
  useCreateService,
  useQueueStatus,
  useServices,
  useSkipToken,
} from "@/hooks/use-queue";
import { ApiError } from "@/lib/api";

export default function AdminScreen() {
  const { data: services = [], isRefetching, refetch } = useServices();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { data: queueStatus, isLoading: isLoadingQueue } =
    useQueueStatus(selectedService);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [avgTime, setAvgTime] = useState("5");

  // Mutations
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
        avg_service_time_mins: parseInt(avgTime, 10) || 5,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setServiceName("");
          setServiceDesc("");
          setAvgTime("5");
          Alert.alert("Success", "Service created successfully");
        },
        onError: (err) => {
          const message =
            err instanceof ApiError ? err.message : "Failed to create service";
          Alert.alert("Error", message);
        },
      },
    );
  };

  const handleCallNext = () => {
    if (!selectedService) return;

    callNextToken(selectedService, {
      onSuccess: (result) => {
        if (result.token_number) {
          Alert.alert(
            "Token Called",
            `Now serving token #${result.token_number}`,
          );
        } else if (result.completed_previous) {
          Alert.alert(
            "Queue Complete",
            "Previous token completed. No more waiting tokens.",
          );
        } else {
          Alert.alert("Info", "No waiting tokens");
        }
      },
      onError: (err) => {
        const message =
          err instanceof ApiError ? err.message : "Failed to call next token";
        Alert.alert("Error", message);
      },
    });
  };

  const handleCompleteToken = () => {
    if (!selectedService || !queueStatus?.current_token) return;

    Alert.alert(
      "Complete Token",
      `Mark token #${queueStatus.current_token} as completed?`,
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
                    `Token #${result.token_number} completed`,
                  );
                } else {
                  Alert.alert("Info", "No token being served");
                }
              },
              onError: (err) => {
                const message =
                  err instanceof ApiError
                    ? err.message
                    : "Failed to complete token";
                Alert.alert("Error", message);
              },
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
            onError: (err) => {
              const message =
                err instanceof ApiError ? err.message : "Failed to skip token";
              Alert.alert("Error", message);
            },
          });
        },
      },
    ]);
  };

  const handleSkipCurrentToken = () => {
    if (!queueStatus?.being_served_token_id || !queueStatus?.current_token)
      return;
    handleSkipToken(
      queueStatus.being_served_token_id,
      queueStatus.current_token,
    );
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
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Services Yet</Text>
          <Text style={styles.emptyText}>
            Create your first service to start managing queues.
          </Text>
          <TouchableOpacity
            style={styles.createServiceButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createServiceButtonText}>Create Service</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={["#6366f1"]}
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
                    {service.waiting_count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Queue Management */}
          {selectedService && (
            <View style={styles.queueSection}>
              {isLoadingQueue ? (
                <ActivityIndicator size="large" color="#6366f1" />
              ) : queueStatus ? (
                <>
                  {/* Current Token */}
                  <View style={styles.currentTokenCard}>
                    <Text style={styles.currentTokenLabel}>Now Serving</Text>
                    <Text style={styles.currentTokenNumber}>
                      {queueStatus.current_token
                        ? `#${queueStatus.current_token}`
                        : "None"}
                    </Text>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                      {queueStatus.current_token && (
                        <>
                          <TouchableOpacity
                            style={styles.completeButton}
                            onPress={handleCompleteToken}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#fff"
                            />
                            <Text style={styles.actionButtonText}>
                              Complete
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.skipCurrentButton}
                            onPress={handleSkipCurrentToken}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="#fff"
                            />
                            <Text style={styles.actionButtonText}>Skip</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.callNextButton}
                      onPress={handleCallNext}
                    >
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                      <Text style={styles.callNextText}>
                        {queueStatus.current_token
                          ? "Complete & Call Next"
                          : "Call Next"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Waiting Queue */}
                  <Text style={styles.sectionTitle}>
                    Waiting Queue ({queueStatus.waiting_count})
                  </Text>
                  {queueStatus.waiting_tokens.length === 0 ? (
                    <View style={styles.emptyQueue}>
                      <Ionicons
                        name="checkmark-circle"
                        size={48}
                        color="#10b981"
                      />
                      <Text style={styles.emptyQueueText}>No one waiting</Text>
                    </View>
                  ) : (
                    queueStatus.waiting_tokens.map((token, index) => (
                      <View key={token.id} style={styles.queueItem}>
                        <View style={styles.queueItemLeft}>
                          <Text style={styles.queuePosition}>{index + 1}</Text>
                          <View>
                            <Text style={styles.queueTokenNumber}>
                              Token #{token.token_number}
                            </Text>
                            <Text style={styles.queueTime}>
                              {new Date(token.created_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.skipButton}
                          onPress={() =>
                            handleSkipToken(token.id, token.token_number)
                          }
                        >
                          <Ionicons name="close" size={16} color="#ef4444" />
                          <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </>
              ) : null}
            </View>
          )}

          {!selectedService && (
            <View style={styles.selectPrompt}>
              <Ionicons name="arrow-up" size={32} color="#94a3b8" />
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
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., General Consultation"
            value={serviceName}
            onChangeText={setServiceName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe this service"
            value={serviceDesc}
            onChangeText={setServiceDesc}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Average Service Time (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            value={avgTime}
            onChangeText={setAvgTime}
            keyboardType="number-pad"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.createButton,
            isCreatingService && styles.createButtonDisabled,
          ]}
          onPress={handleCreateService}
          disabled={isCreatingService}
        >
          {isCreatingService ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Service</Text>
          )}
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    color: "#1e293b",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 12,
  },
  serviceScroll: {
    marginBottom: 24,
  },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#e2e8f0",
    borderRadius: 24,
    marginRight: 10,
    gap: 8,
  },
  serviceChipActive: {
    backgroundColor: "#6366f1",
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  serviceChipTextActive: {
    color: "#fff",
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
    color: "#fff",
  },
  queueSection: {
    flex: 1,
  },
  currentTokenCard: {
    backgroundColor: "#6366f1",
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
    color: "#fff",
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  skipCurrentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  callNextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  callNextText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  emptyQueue: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyQueueText: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "600",
    marginTop: 8,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
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
    backgroundColor: "#f1f5f9",
    textAlign: "center",
    lineHeight: 32,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  queueTokenNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  queueTime: {
    fontSize: 13,
    color: "#94a3b8",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    gap: 4,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ef4444",
  },
  selectPrompt: {
    alignItems: "center",
    paddingTop: 60,
  },
  selectPromptText: {
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1e293b",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  createButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: "60%",
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
    maxWidth: 280,
  },
  createServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  createServiceButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
