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
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get<Event[]>("/events/my");
      setEvents(response.data);
    } catch (err) {
      const error = err as AxiosError;
      console.error("Failed to load my events", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Event }) => {
    return (
      <View style={styles.eventCard}>
        <TouchableOpacity onPress={() => navigation.navigate("EventDetail", { event: item })}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDetail}>{item.starts_at}</Text>
          <Text style={styles.eventDetail}>{item.location}</Text>
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
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: "#222",
  },
  eventDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
});
