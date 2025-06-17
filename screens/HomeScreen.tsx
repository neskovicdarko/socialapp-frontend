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
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Event } from "../models/Event";
import api from "../api";

const BASE_URL = "http://10.0.2.2:8000";

export default function HomeScreen() {
  const [applications, setApplications] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingIds, setRevokingIds] = useState<Set<number>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/applications/mine");
      setApplications(res.data);
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
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

  const renderApplication = ({ item }: { item: Event }) => {
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
      <TouchableOpacity onPress={() => setSelectedEvent(item)} style={[styles.appCardTile, { backgroundColor }]}>
        <View style={styles.appCardContentTile}>
          <Image
            source={
              profilePhotoUri
                ? { uri: profilePhotoUri }
                : require("../assets/default-avatar.png")
            }
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            resizeMode="cover"
            onError={() => console.warn("Failed to load profile image")}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>{item.title}</Text>
            <Text style={styles.appText}>
              Host: {profile?.first_name} {profile?.last_name}
            </Text>
            <Text style={styles.appText}>Status: {statusText}</Text>
          </View>
          <TouchableOpacity
            onPress={() => revokeApplication(item.id)}
            style={styles.revokeButton}
            disabled={isRevoking}
          >
            <Text style={styles.revokeButtonText}>
              {isRevoking ? "..." : isFinal ? "Delete Application" : "Revoke"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.content}>
        <Text style={{ fontSize: 20, marginBottom: 12 }}>My Applications</Text>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : applications.length === 0 ? (
          <Text>No applications yet.</Text>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderApplication}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedEvent(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Image
              source={
                selectedEvent?.owner?.profile?.profile_photo
                  ? {
                      uri: selectedEvent.owner.profile.profile_photo.startsWith("http")
                        ? selectedEvent.owner.profile.profile_photo
                        : `${BASE_URL}${selectedEvent.owner.profile.profile_photo}`,
                    }
                  : require("../assets/default-avatar.png")
              }
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                alignSelf: "center",
                marginBottom: 12,
              }}
              resizeMode="cover"
              onError={() => console.warn("Failed to load avatar")}
            />
            <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
            <Text style={styles.modalRating}>
              ⭐ {selectedEvent?.owner?.profile?.rating?.toFixed(1) ?? "N/A"} (
              {selectedEvent?.owner?.profile?.number_of_ratings ?? 0} ratings)
            </Text>
            <Text>{selectedEvent?.description || "No description."}</Text>
            <Text style={{ marginTop: 10 }}>Location: {selectedEvent?.location}</Text>
            <Text>Starts at: {selectedEvent?.starts_at}</Text>
            <Text>Ends at: {selectedEvent?.ends_at}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
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
  modalRating: {
    fontSize: 16,
    color: "gray",
    marginBottom: 10,
    textAlign: "center",
  },
});
