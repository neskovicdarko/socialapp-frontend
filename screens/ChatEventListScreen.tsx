import React, { useEffect, useState, useRef } from "react";
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
                <View style={styles.messageBubble}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.lastMessage}>
                      {event.last_message.user?.profile?.first_name} {event.last_message.user?.profile?.last_name}:
                    </Text>
                    <Text style={styles.messageTime}>
                      {new Date(event.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.lastMessageContent}>{event.last_message.content}</Text>
                </View>
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
    borderRadius: 12,
    backgroundColor: "#E0F2F1",
    marginBottom: 12,
    borderLeftWidth: 6,
    borderLeftColor: "#00796B",
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#00796B",
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 12,
    color: "#555",
    marginBottom: 6,
  },
  messageBubble: {
    backgroundColor: "#C8E6C9",
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 13,
    fontWeight: "600",
    color: "#004D40",
  },
  messageTime: {
    fontSize: 12,
    color: "#004D40",
    marginLeft: 8,
  },
  lastMessageContent: {
    fontSize: 14,
    color: "#212121",
  },
});
