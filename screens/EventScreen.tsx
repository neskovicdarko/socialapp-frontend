import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AxiosError } from "axios";

import api from "../api";
import { Event } from "../models/Event";
import { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

export default function EventScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [submittingIds, setSubmittingIds] = useState<Set<number>>(new Set());

  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchEvents();
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      fetchMyApplications();
    }, [])
  );

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get<Event[]>("/events/search", {
        params: query.trim() !== "" ? { q: query } : {},
      });
      setEvents(response.data);
    } catch (err) {
      const error = err as AxiosError;
      console.error("Failed to load events", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await api.get<Event[]>("/applications/mine");
      setAppliedIds(response.data.map((event) => event.id));
    } catch (err) {
      console.error("Failed to load applications");
    }
  };

  const addSubmitting = (id: number) => {
    setSubmittingIds((prev) => new Set(prev).add(id));
  };

  const removeSubmitting = (id: number) => {
    setSubmittingIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

  const applyToEvent = async (eventId: number) => {
    addSubmitting(eventId);
    try {
      await api.post(`/events/${eventId}/apply`);
      setAppliedIds((prev) => [...prev, eventId]);
    } catch (err) {
      console.error("Apply failed", err);
    } finally {
      removeSubmitting(eventId);
    }
  };

  const revokeApplication = async (eventId: number) => {
    addSubmitting(eventId);
    try {
      await api.delete(`/events/${eventId}/revoke`);
      setAppliedIds((prev) => prev.filter((id) => id !== eventId));
    } catch (err) {
      console.error("Revoke failed", err);
    } finally {
      removeSubmitting(eventId);
    }
  };

  const renderItem = ({ item }: { item: Event }) => {
    const isApplied = appliedIds.includes(item.id);
    const isSubmitting = submittingIds.has(item.id);

    return (
      <View style={styles.eventCard}>
        <TouchableOpacity onPress={() => navigation.navigate("EventDetail", { event: item })}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDetail}>{item.starts_at}</Text>
          <Text style={styles.eventDetail}>{item.location}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isApplied ? styles.revoke : styles.apply]}
          onPress={() =>
            isApplied ? revokeApplication(item.id) : applyToEvent(item.id)
          }
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isApplied ? "REVOKE" : "APPLY"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search by title or description..."
        value={query}
        onChangeText={setQuery}
        style={styles.searchInput}
      />
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 4,
  },
  eventDetail: {
    fontSize: 14,
    color: "gray",
    marginBottom: 2,
  },
  actionButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  apply: {
    backgroundColor: "#007bff",
  },
  revoke: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
