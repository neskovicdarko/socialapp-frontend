import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api";
import { Event } from "../models/Event";
import { RootStackParamList } from "../navigation/RootNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export default function ChatEventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    fetchChatEvents();
  }, []);

  const fetchChatEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/chat/events");
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch chat events", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchChatEvents();
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePress = (eventId: number) => {
    navigation.getParent()?.navigate("Chat", { eventId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Event Chats</Text>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventItem}
              onPress={() => handlePress(event.id)}
            >
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMeta}>{event.starts_at}</Text>
              {event.last_message && (
                <Text style={styles.lastMessage}>
                  {event.last_message.user?.profile?.first_name} {event.last_message.user?.profile?.last_name}: {event.last_message.content}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  eventItem: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  lastMessage: {
    fontSize: 13,
    color: "#333",
  },
});
