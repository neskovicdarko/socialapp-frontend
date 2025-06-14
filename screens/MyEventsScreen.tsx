import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AxiosError } from "axios";

import api from "../api";
import { Event } from "../models/Event";
import { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

export default function MyEventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [applicationStats, setApplicationStats] = useState<{
    [key: number]: { pending: number; accepted: number };
  }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setEvents(response.data);
    } catch (err) {
      const error = err as AxiosError;
      console.error("Failed to load my events", error);
    }
  };

  const fetchPendingCounts = async () => {
    try {
      const response = await api.get("/applications/pending-count");
      const counts: {
        [key: number]: { pending: number; accepted: number };
      } = {};
      response.data.forEach((e: {
        id: number;
        pending_applications_count: number;
        accepted_applications_count: number;
      }) => {
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

  const renderItem = ({ item }: { item: Event }) => {
    const stats = applicationStats[item.id] || { pending: 0, accepted: 0 };

    return (
      <View style={styles.eventCard}>
        <TouchableOpacity onPress={() => navigation.navigate("EventDetail", { event: item })}>
          <View style={styles.cardHeader}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            {stats.pending > 0 && (
              <View style={[styles.badge, { backgroundColor: "red" }]}> 
                <Text style={styles.badgeText}>{stats.pending}</Text>
              </View>
            )}
          </View>
          <Text style={styles.eventDetail}>{item.starts_at}</Text>
          <Text style={styles.eventDetail}>{item.location}</Text>
          {stats.accepted > 0 && (
            <View style={styles.participantBadge}>
              <Text style={styles.participantBadgeText}>{stats.accepted} participant{stats.accepted > 1 ? 's' : ''}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00796B" style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
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
    alignSelf: "flex-end",
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
});
