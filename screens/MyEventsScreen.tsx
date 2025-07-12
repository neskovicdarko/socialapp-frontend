import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AxiosError } from "axios";

import api from "../api";
import { Event } from "../models/Event";
import { RootStackParamList } from "../navigation/RootNavigator";
import Icon from "react-native-vector-icons/FontAwesome5";

const currentUserId = 1;

const SCREEN_WIDTH = Dimensions.get("window").width;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface Comment {
  id: number;
  content: string;
  user: { id: number; name: string };
  created_at: string;
}

export default function MyEventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [applicationStats, setApplicationStats] = useState<{
    [key: number]: { pending: number; accepted: number };
  }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMyEvents(), fetchPendingCounts()]);
    } catch (err) {
      console.error("Initial load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchMyEvents(), fetchPendingCounts()]);
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const response = await api.get<Event[]>("/events/my");
      const responseJoined = await api.get<Event[]>("/events/joined");
      const allEvents = [...response.data, ...responseJoined.data];
      const uniqueEvents = Array.from(
        new Map(allEvents.map(event => [event.id, event])).values()
      );
      setEvents(uniqueEvents);
    } catch (err) {
      console.error("Failed to load my events", err as AxiosError);
    }
  };

  const fetchPendingCounts = async () => {
    try {
      const response = await api.get("/applications/pending-count");
      const counts: {
        [key: number]: { pending: number; accepted: number };
      } = {};
      response.data.forEach((e: any) => {
        counts[e.id] = {
          pending: e.pending_applications_count,
          accepted: e.accepted_applications_count,
        };
      });
      setApplicationStats(counts);
    } catch (err) {
      console.error("Failed to load pending counts", err);
    }
  };

  const fetchComments = async (eventId: number) => {
    try {
      const response = await api.get(`/events/${eventId}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  const submitComment = async () => {
    if (!selectedEvent) return;
    try {
      await api.post("/comments", {
        event_id: selectedEvent.id,
        content: comment,
      });
      setComment("");
      fetchComments(selectedEvent.id);
      setSelectedEvent(null);
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const revokeParticipation = async (eventId: number) => {
    try {
      await api.delete(`/events/${eventId}/revoke`);
      Alert.alert("Success", "You have left the event.");
      fetchAll();
    } catch (err) {
      console.error("Failed to revoke participation", err);
    }
  };

  const now = new Date();
  const filteredEvents = events.filter((e) => {
    const startDate = new Date(e.starts_at);
    return filter === "upcoming" ? startDate > now : startDate <= now;
  });

  const renderItem = ({ item }: { item: Event }) => {
    const stats = applicationStats[item.id] || { pending: 0, accepted: 0 };
    const isHost = item.owner_id === currentUserId;

    return (
      <View style={styles.eventCard}>
        <TouchableOpacity onPress={() => navigation.navigate("EventDetail", { event: item })}>
          <View style={styles.cardHeader}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.statsRow}>
              {stats.pending > 0 && (
                <View style={[styles.badge, { backgroundColor: "red" }]}>
                  <Text style={styles.badgeText}>{stats.pending}</Text>
                </View>
              )}
              {isHost && <Text style={styles.hostLabel}>Host</Text>}
            </View>
          </View>

          <Text style={styles.eventDetail}>{item.starts_at}</Text>
          <Text style={styles.eventDetail}>{item.location}</Text>

          {item.category && (
            <Text style={styles.eventDetail}>
              Category: {item.category.name.replace(/-/g, " ")}
            </Text>
          )}

          {stats.accepted > 0 && (
            <View style={styles.participantBadge}>
              <Text style={styles.participantBadgeText}>
                {stats.accepted} participant{stats.accepted > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {!isHost && filter === "upcoming" && (
          <TouchableOpacity onPress={() => revokeParticipation(item.id)} style={styles.revokeButton}>
            <Text style={styles.revokeButtonText}>Revoke</Text>
          </TouchableOpacity>
        )}

        {filter === "past" && (
          <TouchableOpacity
            style={styles.commentIcon}
            onPress={() => {
              setSelectedEvent(item);
              fetchComments(item.id);
            }}
          >
            <Icon name="comment-alt" size={18} color="#00796B" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#00796B" style={{ marginTop: 100 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        {["upcoming", "past"].map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.toggleButton, filter === key && styles.selectedToggle]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setFilter(key as "upcoming" | "past");
            }}
          >
            <Text style={[styles.toggleText, filter === key && styles.selectedToggleText]}>
              {key === "upcoming" ? "Upcoming Events" : "Past Events"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00796B" style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
      <Modal visible={!!selectedEvent} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Leave a Comment for "{selectedEvent?.title}"</Text>

            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              multiline
              placeholder="Type your comment here"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => {
                setSelectedEvent(null);
                setComment("");
              }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={submitComment}
              >
                <Text style={styles.modalSubmitText}>Leave a Comment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00796B",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  selectedToggle: {
    backgroundColor: "#00796B",
  },
  toggleText: {
    color: "#00796B",
    fontWeight: "600",
  },
  selectedToggleText: {
    color: "#fff",
  },
  eventCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    flex: 1,
  },
  hostLabel: {
    marginLeft: 8,
    color: "#00796B",
    fontWeight: "600",
    fontSize: 12,
  },
  eventDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  badge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  participantBadge: {
    backgroundColor: "#00796B",
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  participantBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  revokeButton: {
    marginTop: 8,
    backgroundColor: "#eee",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  revokeButtonText: {
    color: "#444",
    fontWeight: "500",
  },
  commentIcon: {
    position: "absolute",
    bottom: 14,
    right: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "100%",
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  commentInput: {
    height: 100,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelText: {
    color: "#999",
    fontWeight: "600",
  },
  modalSubmitButton: {
    backgroundColor: "#00796B",
    padding: 10,
    borderRadius: 6,
  },
  modalSubmitText: {
    color: "white",
    fontWeight: "600",
  },
  commentBubble: {
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  commentUser: {
    fontWeight: "600",
    color: "#333",
  },
  commentText: {
    marginTop: 4,
    fontSize: 14,
    color: "#555",
  },
  commentDate: {
    marginTop: 6,
    fontSize: 12,
    color: "#888",
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
