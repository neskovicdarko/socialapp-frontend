import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Event } from "../models/Event";
import { User } from "../models/User";
import api from "../api";

type EventDetailRouteProp = RouteProp<RootStackParamList, "EventDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserWithStatus = User & { pivot: { status: number } };

interface Comment {
  id: number;
  content: string;
  user: { id: number; name: string };
  created_at?: string;
}

export default function EventDetailScreen({ route }: { route: EventDetailRouteProp }) {
  const { event: initialEvent } = route.params;
  const navigation = useNavigation<NavigationProp>();

  const [userId, setUserId] = useState<number | null>(null);
  const [fullEvent, setFullEvent] = useState<Event>(initialEvent);
  const [localUsers, setLocalUsers] = useState<UserWithStatus[]>(
    (initialEvent.users as UserWithStatus[]) || []
  );
  const [applications, setApplications] = useState<UserWithStatus[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [submittingIds, setSubmittingIds] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const acceptedCount = localUsers.filter((u) => u.pivot?.status === 1).length;

  useEffect(() => {
    const loadUserId = async () => {
      const storedId = await AsyncStorage.getItem("user_id");
      if (storedId) setUserId(parseInt(storedId));
    };
    loadUserId();
  }, []);

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/events/${initialEvent.id}`);
      setFullEvent(res.data);
      setLocalUsers(res.data.users || []);

      if (userId === res.data.owner_id) {
        await fetchApplications(res.data.id);
      }
    } catch (err) {
      console.error("Failed to fetch full event data:", err);
    }
  };

  const fetchApplications = async (eventId: number) => {
    try {
      setLoadingApplications(true);
      const res = await api.get(`/applications`, {
        params: { event_id: eventId },
      });
      setApplications(res.data.applications);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleDecision = async (targetUserId: number, status: number) => {
    setSubmittingIds((prev) => new Set(prev).add(targetUserId));
    try {
      await api.put(`/events/${fullEvent.id}/users/${targetUserId}`, { status });

      setLocalUsers((prev) => {
        const exists = prev.find((u) => u.id === targetUserId);
        if (exists) {
          return prev.map((u) =>
            u.id === targetUserId ? { ...u, pivot: { ...u.pivot, status } } : u
          );
        } else {
          return [...prev, { id: targetUserId, name: "", pivot: { status } } as UserWithStatus];
        }
      });

      fetchApplications(fullEvent.id);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setSubmittingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/events/${fullEvent.id}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        if (userId !== null) {
          await fetchEventDetails();
          await fetchComments();
        }
      };
      run();
    }, [initialEvent.id, userId])
  );

  if (userId === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{fullEvent.title}</Text>
      <Text style={styles.detail}>{fullEvent.starts_at}</Text>
      <Text style={styles.detail}>{fullEvent.location}</Text>

      {fullEvent.category && (
        <Text style={styles.detail}>
          Category: {fullEvent.category.name.replace(/-/g, " ")}
        </Text>
      )}

      <Text style={styles.description}>{fullEvent.description}</Text>

      <View style={styles.limitBox}>
        {fullEvent.min_required_participants !== undefined && (
          <Text style={styles.limitText}>
            Minimum participants: {fullEvent.min_required_participants}
          </Text>
        )}
        <Text style={styles.limitText}>
          Maximum participants:{" "}
          {fullEvent.max_participants ? fullEvent.max_participants : "Unlimited"}
        </Text>
        <Text style={styles.limitText}>Accepted: {acceptedCount}</Text>
      </View>

      <View style={styles.progressWrapper}>
        {fullEvent.max_participants ? (
          <>
            <Text style={styles.progressText}>
              {acceptedCount} of {fullEvent.max_participants} spots taken
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (acceptedCount / fullEvent.max_participants) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
          </>
        ) : (
          <Text style={styles.progressText}>No participant limit</Text>
        )}
      </View>

      {fullEvent.owner_id !== userId && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("EventDetailProfile", { user: fullEvent.owner })
          }
          style={styles.profileCTA}
        >
          <Text style={styles.profileCTAText}>
            View Host: {fullEvent.owner.profile.first_name} {fullEvent.owner.profile.last_name}
          </Text>
        </TouchableOpacity>
      )}

      {fullEvent.owner_id === userId && (
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
                  onPress={() =>
                    navigation.navigate("EventDetailProfile", { user: applicant })
                  }
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

      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Comments</Text>
        {loadingComments ? (
          <ActivityIndicator />
        ) : comments.length === 0 ? (
          <Text style={styles.noComments}>No comments yet.</Text>
        ) : (
          comments.map((comment) => (
            <View key={comment.id} style={styles.commentBubble}>
              <Text style={styles.commentAuthor}>{comment.user.name}</Text>
              <Text style={styles.commentContent}>{comment.content}</Text>
              {comment.created_at && (
                <Text style={styles.commentTimestamp}>
                  {new Date(comment.created_at).toLocaleString("sr-RS")}
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  detail: { fontSize: 16, color: "#666", marginBottom: 4 },
  description: { fontSize: 15, marginTop: 12, color: "#333" },
  limitBox: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  limitText: { fontSize: 14, color: "#444", marginBottom: 4 },
  progressWrapper: { marginBottom: 16 },
  progressText: { fontSize: 14, color: "#444", marginBottom: 6 },
  progressBar: {
    height: 10,
    width: "100%",
    backgroundColor: "#ddd",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#4CAF50" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  noApps: { color: "#888", fontStyle: "italic" },
  applicantCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  applicantInfo: { marginBottom: 8 },
  applicantName: { fontWeight: "600", fontSize: 16 },
  applicantStatus: { color: "#666", fontSize: 14 },
  actionRow: { flexDirection: "row", gap: 10 },
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
  disabledBtn: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "bold" },
  profileCTA: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#00796B",
    borderRadius: 8,
    alignItems: "center",
  },
  profileCTAText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  commentsSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 16,
  },
  commentsTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  noComments: { fontStyle: "italic", color: "#666" },
  commentBubble: {
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignSelf: "flex-start",
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  commentAuthor: { fontWeight: "700", marginBottom: 4 },
  commentContent: { fontSize: 14, color: "#333" },
  commentTimestamp: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
    textAlign: "right",
  },
});
