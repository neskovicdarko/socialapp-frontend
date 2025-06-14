import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Event } from "../models/Event";
import { User } from "../models/User";
import api from "../api";

// Types

type EventDetailRouteProp = RouteProp<RootStackParamList, "EventDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserWithStatus = User & { pivot: { status: number } };

export default function EventDetailScreen({ route }: { route: EventDetailRouteProp }) {
  const { event } = route.params;
  const navigation = useNavigation<NavigationProp>();

  const [userId, setUserId] = useState<number | null>(null);
  const [applications, setApplications] = useState<UserWithStatus[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [submittingIds, setSubmittingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadUserId = async () => {
      const storedId = await AsyncStorage.getItem("user_id");
      if (storedId) setUserId(parseInt(storedId));
    };

    loadUserId();
  }, []);

  useEffect(() => {
    if (userId !== null && event.owner_id === userId) {
      fetchApplications();
    }
  }, [userId]);

  const fetchApplications = async () => {
    try {
      setLoadingApplications(true);
      const res = await api.get(`/applications`, {
        params: { event_id: event.id },
      });
      setApplications(res.data.applications);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleDecision = async (userId: number, status: number) => {
    setSubmittingIds((prev) => new Set(prev).add(userId));
    try {
      await api.put(`/events/${event.id}/users/${userId}`, { status });
      fetchApplications();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setSubmittingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (userId === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.detail}>{event.starts_at}</Text>
      <Text style={styles.detail}>{event.location}</Text>
      <Text style={styles.description}>{event.description}</Text>

      {event.owner_id !== userId && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("EventDetailProfile", { user: event.owner })
          }
          style={styles.profileCTA}
        >
          <Text style={styles.profileCTAText}>
            View Host: {event.owner.profile.first_name} {event.owner.profile.last_name}
          </Text>
        </TouchableOpacity>
      )}

      {event.owner_id === userId && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Applications</Text>
          {loadingApplications ? (
            <ActivityIndicator />
          ) : applications.length === 0 ? (
            <Text style={styles.noApps}>No applications yet.</Text>
          ) : (
            applications.map((applicant) => {
              const isSubmitting = submittingIds.has(applicant.id);
              const profile = applicant.profile ?? {};
              const status = applicant.pivot.status;
              const backgroundColor =
                status === 1 ? "#e6f4ea" : status === 2 ? "#fbeaea" : "#f4f4f4";

              return (
                <TouchableOpacity
                  key={applicant.id}
                  onPress={() => navigation.navigate("EventDetailProfile", { user: applicant })}
                  style={[styles.applicantCard, { backgroundColor }]}
                  disabled={isSubmitting}
                >
                  <View style={styles.applicantInfo}>
                    <Text style={styles.applicantName}>
                      {profile.first_name ?? "Unknown"} {profile.last_name ?? ""}
                    </Text>
                    <Text style={styles.applicantStatus}>
                      Status: {["Pending", "Accepted", "Rejected"][status]}
                    </Text>
                  </View>

                  <View style={styles.actionRow}>
                    {(status === 0 || status === 2) && (
                      <TouchableOpacity
                        onPress={() => handleDecision(applicant.id, 1)}
                        style={[styles.acceptBtn, isSubmitting && styles.disabledBtn]}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.btnText}>Accept</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {(status === 0 || status === 1) && (
                      <TouchableOpacity
                        onPress={() => handleDecision(applicant.id, 2)}
                        style={[styles.rejectBtn, isSubmitting && styles.disabledBtn]}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.btnText}>Decline</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  detail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    marginTop: 12,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  noApps: {
    color: "#888",
    fontStyle: "italic",
  },
  applicantCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  applicantInfo: {
    marginBottom: 8,
  },
  applicantName: {
    fontWeight: "600",
    fontSize: 16,
  },
  applicantStatus: {
    color: "#666",
    fontSize: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  rejectBtn: {
    backgroundColor: "#f44336",
    padding: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  profileCTA: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#00796B",
    borderRadius: 8,
    alignItems: "center",
  },
  profileCTAText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});