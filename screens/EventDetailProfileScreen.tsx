import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";

const BASE_URL = "http://10.0.2.2:8000";

type ProfileRouteProp = RouteProp<RootStackParamList, "EventDetailProfile">;

export default function EventDetailProfileScreen({ route }: { route: ProfileRouteProp }) {
  const { user } = route.params;
  const profile = user.profile;
  const rawPhoto = profile?.profile_photo;

  const profilePhotoUri =
    rawPhoto?.startsWith("http")
      ? rawPhoto
      : rawPhoto
      ? `${BASE_URL}${rawPhoto}`
      : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={profilePhotoUri ? { uri: profilePhotoUri } : require("../assets/default-avatar.png")}
        style={styles.avatar}
        resizeMode="cover"
        onError={() => console.warn("Failed to load avatar")}
      />
      <Text style={styles.name}>
        {profile.first_name} {profile.last_name}
      </Text>
      <Text style={styles.rating}>
        ⭐ {profile.rating?.toFixed(1) || "N/A"} ({profile.number_of_ratings} ratings)
      </Text>
      <Text style={styles.bio}>{profile.description || "No bio provided."}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
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
