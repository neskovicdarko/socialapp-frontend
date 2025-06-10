import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Event } from "../models/Event";
import api from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AxiosError } from "axios";

type EventDetailRouteProp = RouteProp<RootStackParamList, "EventDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EventDetailScreen({
  route,
}: {
  route: EventDetailRouteProp;
}) {
  const { event } = route.params;
  const navigation = useNavigation<NavigationProp>();

  const [isApplied, setIsApplied] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkIfApplied();
    checkIfOwner();
  }, []);

  const checkIfOwner = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (userId && userId === event.owner.id.toString()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error("Owner check failed", err);
    }
  };

  const checkIfApplied = async () => {
    try {
      const response = await api.get<Event[]>("/applications/mine");
      const appliedIds = response.data.map((e) => e.id);
      setIsApplied(appliedIds.includes(event.id));
    } catch (err) {
      console.error("Check applied failed", err);
      setIsApplied(false);
    } finally {
      setLoading(false);
    }
  };

  const applyToEvent = async () => {
    setSubmitting(true);
    try {
      await api.post(`/events/${event.id}/apply`);
      setIsApplied(true);
    } catch (err) {
      const error = err as AxiosError;
      console.error("Apply failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  const revokeApplication = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/events/${event.id}/revoke`);
      setIsApplied(false);
    } catch (err) {
      const error = err as AxiosError;
      console.error("Revoke failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{event.title}</Text>

      <Text style={styles.label}>Date:</Text>
      <Text style={styles.value}>{event.starts_at}</Text>

      {event.ends_at && (
        <>
          <Text style={styles.label}>Ends:</Text>
          <Text style={styles.value}>{event.ends_at}</Text>
        </>
      )}

      <Text style={styles.label}>Location:</Text>
      <Text style={styles.value}>{event.location || "N/A"}</Text>

      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>
        {event.description || "No description provided."}
      </Text>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("EventDetailProfile", { user: event.owner })
        }
        style={styles.profileCTA}
      >
        <Text style={styles.profileCTAText}>
          View Host: {event.owner.profile.first_name}{" "}
          {event.owner.profile.last_name}
        </Text>
      </TouchableOpacity>

      {!isOwner && (
        loading ? (
          <ActivityIndicator size="large" color="#00796B" style={{ marginTop: 20 }} />
        ) : (
          <View style={{ marginTop: 24 }}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isApplied ? styles.revoke : styles.apply,
              ]}
              onPress={() =>
                isApplied ? revokeApplication() : applyToEvent()
              }
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isApplied ? "REVOKE" : "APPLY"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    color: "#222",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    color: "#555",
  },
  value: {
    fontSize: 15,
    color: "#333",
    marginTop: 4,
  },
  actionButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    width: "100%",
  },
  apply: {
    backgroundColor: "#00796B",
  },
  revoke: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
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
