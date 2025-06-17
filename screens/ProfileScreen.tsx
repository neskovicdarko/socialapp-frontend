import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import api from "../api";
import { User } from "../models/User";
import { useFocusEffect } from "@react-navigation/native";
import { useLoading } from "../context/LoadingContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/FontAwesome5";
import axios from "axios";

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User["profile"]>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const { setLoading } = useLoading();

  const GOOGLE_API_KEY = "AIzaSyB3h8R8S8DvbZMWSCf1McC4s2hrMUP_l34";

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            await api.post("/logout");
          } catch {}
          await AsyncStorage.removeItem("token");
          navigation.replace("Login");
        },
      },
    ]);
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile");
      setUser(res.data);
      setForm(res.data.profile);
    } catch (error: any) {
      console.error("Load failed", error.response?.status);
      Alert.alert("Error", `${error}`);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsEditing(false);
      fetchUser();
    }, [])
  );

  const handleImageUpload = () => {
    launchImageLibrary({ mediaType: "photo" }, async (response) => {
      if (response.didCancel || response.errorCode || !response.assets?.[0]) return;
      const asset = response.assets[0];
      const formData = new FormData();
      formData.append("photo", {
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.fileName || "profile.jpg",
      } as any);

      try {
        const res = await api.post("/profile/photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setUser((prev) =>
          prev
            ? {
                ...prev,
                profile: {
                  ...prev.profile,
                  profile_photo: res.data.profile_photo,
                },
              }
            : null
        );
      } catch {
        Alert.alert("Error", "Failed to upload image.");
      }
    });
  };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      delete (payload as any).profile_photo;

      const res = await api.patch("/profile", payload);
      setUser(res.data);
      setForm(res.data.profile);
      setIsEditing(false);
      setLocationResults([]);
    } catch (error: any) {
      console.error("Profile update failed", error.response?.data);
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile.");
    }
  };

  const searchLocation = async (text: string) => {
    setForm({ ...form, location: text });
    if (text.length < 3) return;
    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&types=(cities)&key=${GOOGLE_API_KEY}`
      );
      const results = res.data.predictions
        .map((p: any) => p.description)
        .filter((desc: any) => typeof desc === "string");
      setLocationResults(results);
    } catch (err) {
      console.error("Location fetch error", err);
    }
  };

  const formatDateLocalized = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("sr-RS", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!user || !user.profile) return null;
  const profile = user.profile;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarContainer}>
          <Image
            source={
              profile?.profile_photo
                ? { uri: profile.profile_photo }
                : require("../assets/default-avatar.png")
            }
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.avatarEditIcon} onPress={handleImageUpload}>
            <Icon name="camera" size={16} color="#00796B" />
          </TouchableOpacity>
        </View>

        <View style={styles.centeredInfo}>
          <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
          <Text style={styles.infoText}>{formatDateLocalized(profile.date_of_birth)}</Text>
          {profile.location && (
            <Text style={styles.infoText}>{profile.location}</Text>
          )}
          <Text style={styles.infoText}>{user.email}</Text>
          {profile.description && <Text style={styles.description}>{profile.description}</Text>}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>{profile.rating?.toFixed(1)} ⭐ ({profile.number_of_ratings})</Text>
          </View>
        </View>

        {isEditing && (
          <View style={styles.editSection}>
            {["first_name", "last_name", "description"].map((key) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.label}>{key.replace("_", " ")}</Text>
                <TextInput
                  style={styles.input}
                  value={(form as any)[key]}
                  onChangeText={(val) => setForm({ ...form, [key]: val })}
                />
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={typeof form.location === "string" ? form.location : ""}
                onChangeText={searchLocation}
                placeholder="City, Country"
              />
              {locationResults.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {locationResults.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.locationSuggestion}
                      onPress={() => {
                        setForm({ ...form, location: item });
                        setLocationResults([]);
                      }}
                    >
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={[styles.input, { justifyContent: "center" }]}
                onPress={() => setShowDatePicker(true)}>
                <Text>{formatDateLocalized(form.date_of_birth)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.date_of_birth ? new Date(form.date_of_birth) : new Date("2000-01-01")}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(e, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setForm({
                        ...form,
                        date_of_birth: date.toISOString().split("T")[0],
                      });
                    }
                  }}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        {isEditing ? (
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsEditing(true)}>
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("ChangePassword")}
            >
              <Text style={styles.secondaryButtonText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 24, paddingBottom: 40 },
  avatarContainer: { alignItems: "center", marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarEditIcon: {
    position: "absolute",
    bottom: 0,
    right: "38%",
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 20,
    elevation: 4,
  },
  centeredInfo: { alignItems: "center", marginBottom: 20 },
  name: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  infoText: { color: "#555", fontSize: 14, marginBottom: 2 },
  description: {
    marginTop: 10,
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  ratingRow: {
    marginTop: 8,
    backgroundColor: "#f3f3f3",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ratingText: { fontSize: 16, fontWeight: "600", color: "#333" },
  editSection: { marginTop: 10 },
  inputGroup: { marginBottom: 12 },
  label: { fontWeight: "600", marginBottom: 4, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 20, backgroundColor: "#fff" },
  button: {
    backgroundColor: "#00796B",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  secondaryButton: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#00796B",
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#00796B", fontWeight: "600" },
  logoutButton: {
    marginTop: 12,
    backgroundColor: "#e57373",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  locationSuggestion: {
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
    marginTop: -10,
    zIndex: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
});