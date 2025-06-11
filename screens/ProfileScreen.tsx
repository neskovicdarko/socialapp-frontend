import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import api from "../api";
import { User } from "../models/User";
import { useFocusEffect } from "@react-navigation/native";
import { useLoading } from '../context/LoadingContext';
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:8000"; //TODO

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User["profile"]>>({});
  const [isEditing, setIsEditing] = useState(false);
  const { setLoading } = useLoading();
  
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post("/logout");
            } catch (err) {
              // ignoriši backend grešku, idemo dalje
            } finally {
              await AsyncStorage.removeItem("token");
              navigation.replace("Login");
            }
          },
        },
      ]
    );
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
        setUser((prev) => prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                profile_photo: `${BASE_URL}${res.data.profile_photo}`,
              }
            }
          : null
        );
      } catch (error) {
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
      console.log("Profile updated:", res.data);
    } catch (error: any) {
      console.error("Profile update failed", error.response?.data);
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile.");
    }
  };

  if (!user || !user.profile) return null;

  const profile = user.profile;

  const profilePhotoUri =
    profile?.profile_photo?.startsWith("http")
      ? profile.profile_photo
      : profile?.profile_photo
      ? `${BASE_URL}${profile.profile_photo}`
      : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Image
          source={
            profile?.profile_photo
              ? { uri: profile.profile_photo }
              : require("../assets/default-avatar.png")
          }
          onError={() =>
            setUser(prev =>
              prev
                ? {
                    ...prev,
                    profile: {
                      ...prev.profile,
                      profile_photo: undefined,
                    },
                  }
                : null
            )
          }
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.editAvatar} onPress={handleImageUpload}>
          <Text style={styles.editAvatarText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {[
        { key: "first_name", label: "First Name" },
        { key: "last_name", label: "Last Name" },
        { key: "description", label: "Description" },
        { key: "date_of_birth", label: "Date of Birth" },
      ].map(({ key, label }) => (
        <View key={key} style={styles.inputGroup}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            editable={isEditing}
            value={(form as any)[key]}
            onChangeText={(val) => setForm({ ...form, [key]: val })}
          />
        </View>
      ))}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#f0f0f0" }]}
          editable={false}
          value={user.email}
        />
      </View>

      {isEditing ? (
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => setIsEditing(true)}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("ChangePassword")}
      >
        <Text style={styles.secondaryButtonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  loading: {
    marginTop: 100,
    textAlign: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatar: {
    position: "absolute",
    right: 110 / 2 - 20,
    bottom: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    elevation: 3,
  },
  editAvatarText: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#00796B",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#00796B",
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#00796B",
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 12,
    backgroundColor: "#e57373",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
