import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { User } from "../models/User";

type ProfileRouteProp = RouteProp<RootStackParamList, "EventDetailProfile">;

export default function EventDetailProfileScreen({ route }: { route: ProfileRouteProp }) {
  const { user } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {user.profile.profile_photo && (
        <Image source={{ uri: user.profile.profile_photo }} style={styles.avatar} />
      )}
      <Text style={styles.name}>
        {user.profile.first_name} {user.profile.last_name}
      </Text>
      <Text style={styles.rating}>
        ⭐ {user.profile.rating.toFixed(1)} ({user.profile.number_of_ratings} ratings)
      </Text>
      <Text style={styles.bio}>{user.profile.description || "No bio provided."}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
  },
  rating: {
    fontSize: 16,
    color: "gray",
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
    color: "#333",
  },
});
