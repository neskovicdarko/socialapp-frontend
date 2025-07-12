import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import api from "../api";
import { Event } from "../models/Event";
import EventRatingModal from "./EventRatingModal";
import { RootStackParamList } from "../navigation/RootNavigator";

const BASE_URL = "http://10.0.2.2:8000";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const [applications, setApplications] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingIds, setRevokingIds] = useState<Set<number>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ratingEvent, setRatingEvent] = useState<Event | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<NavigationProp>();

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentEvent, setCommentEvent] = useState<Event | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<
    { id: number; content: string; user: { id: number; name: string }; created_at: string }[]
  >([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchApplications(), fetchPastEvents()]);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    const res = await api.get("/applications/mine");
    setApplications(res.data);
  };

  const fetchPastEvents = async () => {
    const res = await api.get("/events/past");
    setPastEvents(res.data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  };

  const revokeApplication = async (eventId: number) => {
    setRevokingIds((prev) => new Set(prev).add(eventId));
    try {
      await api.delete(`/events/${eventId}/revoke`);
      fetchApplications();
    } catch (err) {
      console.error("Failed to revoke application", err);
    } finally {
      setRevokingIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const fetchComments = async (eventId: number) => {
    try {
      const res = await api.get(`/events/${eventId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  const openCommentModal = (event: Event) => {
    setCommentEvent(event);
    setCommentModalVisible(true);
    fetchComments(event.id);
  };

  const closeCommentModal = () => {
    setCommentModalVisible(false);
    setCommentEvent(null);
    setComment("");
    setComments([]);
  };

  const submitComment = async () => {
    if (!commentEvent) return;
    if (!comment.trim()) return;

    try {
      await api.post("/comments", {
        event_id: commentEvent.id,
        content: comment.trim(),
      });
      setComment("");
      fetchComments(commentEvent.id);
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const renderApplication = ({ item }: { item: Event }) => {
    if (!item.id) {
      console.warn("Application item missing id!", item);
    }
    const status = (item as any).pivot?.status;
    let statusText = "Unknown";
    let backgroundColor = "#f9f9f9";
    let isFinal = false;

    if (typeof status === "number") {
      const statusMap = ["Pending", "Accepted", "Rejected"];
      statusText = statusMap[status] ?? "Unknown";
      if (status === 1) {
        backgroundColor = "#e6f4ea";
        isFinal = true;
      }
      if (status === 2) {
        backgroundColor = "#fbeaea";
        isFinal = true;
      }
    }

    const isRevoking = revokingIds.has(item.id);
    const profile = item.owner?.profile;
    const rawPhoto = profile?.profile_photo;
    const profilePhotoUri =
      rawPhoto?.startsWith("http")
        ? rawPhoto
        : rawPhoto
        ? `${BASE_URL}${rawPhoto}`
        : null;

    return (
      <TouchableOpacity
        onPress={() => setSelectedEvent(item)}
        style={[styles.appCardTile, { backgroundColor }]}
      >
        <View style={styles.appCardContentTile}>
          <Image
            source={
              profilePhotoUri
                ? { uri: profilePhotoUri }
                : require("../assets/default-avatar.png")
            }
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>{item.title}</Text>
            <Text style={styles.appText}>
              Host: {profile?.first_name} {profile?.last_name}
            </Text>
            <Text style={styles.appText}>Status: {statusText}</Text>
            {item.category && (
              <Text style={styles.appText}>
                Category: {item.category.name.replace(/-/g, " ")}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => revokeApplication(item.id)}
            style={styles.revokeButton}
            disabled={isRevoking}
          >
            <Text style={styles.revokeButtonText}>
              {isRevoking ? "..." : isFinal ? "Delete" : "Revoke"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPastEvent = ({ item }: { item: Event }) => {
    if (!item.id) {
      console.warn("Past event item missing id!", item);
    }

    const profile = item.owner?.profile;
    const rawPhoto = profile?.profile_photo;
    const profilePhotoUri =
      rawPhoto?.startsWith("http")
        ? rawPhoto
        : rawPhoto
        ? `${BASE_URL}${rawPhoto}`
        : null;

    const alreadyRated = !!(item as any).is_rated;

    return (
      <View style={[styles.appCardTile, { backgroundColor: "#eee" }]}>
        {/* Glavni pritisak na event ide na detalje */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("EventDetail", { event: item })}
          style={styles.appCardContentTile}
        >
          <Image
            source={
              profilePhotoUri
                ? { uri: profilePhotoUri }
                : require("../assets/default-avatar.png")
            }
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>{item.title}</Text>
            <Text style={styles.appText}>
              Host: {profile?.first_name} {profile?.last_name}
            </Text>
            {item.category && (
              <Text style={styles.appText}>
                Category: {item.category.name.replace(/-/g, " ")}
              </Text>
            )}
            <Text style={styles.appText}>
              Completed:{" "}
              {item.ends_at ? new Date(item.ends_at).toLocaleString() : "N/A"}
            </Text>
            {typeof item.rating === "number" && (
              <Text style={styles.appText}>
                Rating: {item.rating.toFixed(1)} ⭐ ({item.number_of_ratings})
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Dugme Rate */}
        <TouchableOpacity
          style={[
            styles.rateButton,
            alreadyRated && { backgroundColor: "#ccc" },
          ]}
          disabled={alreadyRated}
          onPress={() => setRatingEvent(item)}
        >
          <Text style={styles.rateButtonText}>
            {alreadyRated ? "Already Rated" : "Rate"}
          </Text>
        </TouchableOpacity>

        {/* Ikonica komentara (donji desni ugao) */}
        <TouchableOpacity
          style={styles.commentIcon}
          onPress={() => openCommentModal(item)}
        >
          <Icon name="comment-alt" size={22} color="#00796B" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>My Applications</Text>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : applications.length === 0 ? (
          <Text>No applications yet.</Text>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderApplication}
            keyExtractor={(item) =>
              item.id ? `app-${item.id.toString()}` : `app-unknown-${Math.random()}`
            }
            scrollEnabled={false}
          />
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          Completed Events
        </Text>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : pastEvents.length === 0 ? (
          <Text>No past events yet.</Text>
        ) : (
          <FlatList
            data={pastEvents}
            renderItem={renderPastEvent}
            keyExtractor={(item) =>
              item.id ? `past-${item.id.toString()}` : `past-unknown-${Math.random()}`
            }
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Modal za detalje događaja */}
      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedEvent(null)}
        >
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
            <Text>{selectedEvent?.description || "No description."}</Text>
            <Text style={{ marginTop: 10 }}>
              Location: {selectedEvent?.location}
            </Text>
            <Text>Starts at: {selectedEvent?.starts_at}</Text>
            <Text>Ends at: {selectedEvent?.ends_at}</Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal za komentare */}
      <Modal
        visible={commentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCommentModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Comments for "{commentEvent?.title}"
            </Text>
            <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
              {comments.length === 0 && (
                <Text style={{ fontStyle: "italic", color: "#666" }}>
                  No comments yet.
                </Text>
              )}
              {comments.map((c) => (
                <View key={c.id} style={styles.commentBubble}>
                  <Text style={styles.commentUser}>{c.user.name}</Text>
                  <Text style={styles.commentText}>{c.content}</Text>
                  <Text style={styles.commentDate}>
                    {new Date(c.created_at).toLocaleString()}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              multiline
              placeholder="Write your comment here..."
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeCommentModal}>
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

      {/* Modal za ocenjivanje */}
      {ratingEvent && (
        <EventRatingModal
          event={ratingEvent}
          visible={!!ratingEvent}
          onClose={() => setRatingEvent(null)}
          onFinish={() => {
            setRatingEvent(null);
            onRefresh();
          }}
          currentUserId={1} //TODO
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: "bold",
  },
  appCardTile: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: "#fff",
    position: "relative",
  },
  appCardContentTile: {
    flexDirection: "row",
    alignItems: "center",
  },
  appTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  appText: {
    fontSize: 14,
    color: "#555",
  },
  revokeButton: {
    backgroundColor: "#f44336",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  revokeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  rateButton: {
    position: "absolute",
    top: 10,
    right: 50,
    backgroundColor: "#00796B",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  rateButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  commentIcon: {
    position: "absolute",
    bottom: 10,
    right: 12,
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
});
