import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../api";
import axios from "axios";
import Geocoder from "react-native-geocoding";
import { Category } from "../models/Category";

Geocoder.init("AIzaSyB3h8R8S8DvbZMWSCf1McC4s2hrMUP_l34");

export default function CreateScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);

  const [categoryId, setCategoryId] = useState<Category["id"] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [minParticipants, setMinParticipants] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  const GOOGLE_API_KEY = "AIzaSyB3h8R8S8DvbZMWSCf1McC4s2hrMUP_l34";

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const formatToMysqlDatetime = (dateObj: Date, timeObj: Date): string => {
    const combined = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      timeObj.getHours(),
      timeObj.getMinutes(),
      timeObj.getSeconds()
    );

    const year = combined.getFullYear();
    const month = pad(combined.getMonth() + 1);
    const day = pad(combined.getDate());
    const hour = pad(combined.getHours());
    const minute = pad(combined.getMinutes());
    const second = pad(combined.getSeconds());

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  const isDateTimeValid = (dateObj: Date, timeObj: Date) => {
    const combined = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      timeObj.getHours(),
      timeObj.getMinutes()
    );
    return combined > new Date();
  };

  const handleCreate = async () => {
    if (!isDateTimeValid(startDate, startTime)) {
      return Alert.alert("Invalid Time", "Event must be set in the future.");
    }

    const startsAt = formatToMysqlDatetime(startDate, startTime);

    const min = minParticipants !== "" ? parseInt(minParticipants) : null;
    const max = maxParticipants !== "" ? parseInt(maxParticipants) : null;

    if ((min && isNaN(min)) || (max && isNaN(max))) {
      return Alert.alert("Validation Error", "Participants must be valid numbers.");
    }

    if (min && (min < 0 || min > 20)) {
      return Alert.alert("Validation Error", "Minimum must be between 0 and 20.");
    }

    if (max && (max < 0 || max > 20)) {
      return Alert.alert("Validation Error", "Maximum must be between 0 and 20.");
    }

    if (min !== null && max !== null && min > max) {
      return Alert.alert("Validation Error", "Minimum cannot be greater than maximum.");
    }

    setIsLoading(true);

    try {
      const geo = await Geocoder.from(location);
      if (!geo.results.length) {
        return Alert.alert("Error", "Invalid location");
      }
      const { lat, lng } = geo.results[0].geometry.location;

      await api.post("/events", {
        title,
        description,
        location,
        starts_at: startsAt,
        category_id: categoryId,
        latitude: lat,
        longitude: lng,
        ...(min !== null && { min_required_participants: min }),
        ...(max !== null && { max_participants: max }),
      });

      Alert.alert("Success", "Event created successfully!");
    } catch (error: any) {
      console.error("Create error:", error);
      Alert.alert("Error", error.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const searchAddress = async (input: string) => {
    setLocation(input);
    if (input.length < 3) return;

    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&key=${GOOGLE_API_KEY}`
      );
      const results = res.data.predictions.map((p: any) => p.description);
      setLocationSuggestions(results);
    } catch (err) {
      console.error("Autocomplete error", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={styles.rowInputs}>
        <View style={styles.halfInputGroup}>
          <Text style={styles.label}>Min Participants</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={minParticipants}
            onChangeText={(text) => {
              if (text === "") return setMinParticipants("");
              const val = parseInt(text);
              if (!isNaN(val) && val >= 0 && val <= 20) {
                setMinParticipants(text);
              }
            }}
            placeholder="0–20"
          />
        </View>

        <View style={styles.halfInputGroup}>
          <Text style={styles.label}>Max Participants</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={maxParticipants}
            onChangeText={(text) => {
              if (text === "") return setMaxParticipants("");
              const val = parseInt(text);
              if (!isNaN(val) && val >= 0 && val <= 20) {
                setMaxParticipants(text);
              }
            }}
            placeholder="0–20"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={searchAddress}
          placeholder="Enter address"
        />
        {locationSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setLocation(suggestion);
              setLocationSuggestions([]);
            }}
            style={styles.suggestionItem}
          >
            <Text>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowCategoryPicker(true)}
        >
          <Text>
            {categoryId
              ? categories.find((cat) => cat.id === categoryId)?.name.replace(/-/g, " ")
              : "Select category..."}
          </Text>
        </TouchableOpacity>

        {showCategoryPicker && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showCategoryPicker}
            onRequestClose={() => setShowCategoryPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        item.id === categoryId && styles.modalItemSelected,
                      ]}
                      onPress={() => {
                        setCategoryId(item.id);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text
                        style={
                          item.id === categoryId ? styles.modalItemTextSelected : undefined
                        }
                      >
                        {item.name.replace(/-/g, " ")}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowCategoryPicker(false)}
                >
                  <Text style={{ color: "#00796B", fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{startDate.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Start Time</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowTimePicker(true)}
        >
          <Text>
            {startTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setStartTime(selectedTime);
            }}
          />
        )}
      </View>

      {isLoading ? (
        <View style={[styles.button, { backgroundColor: "#ccc" }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create Event</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  inputGroup: { marginBottom: 12 },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  halfInputGroup: {
    flex: 1,
  },
  label: { fontWeight: "600", marginBottom: 4, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#00796B",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  suggestionItem: {
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    maxHeight: "70%",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemSelected: {
    backgroundColor: "#e0f2f1",
  },
  modalItemTextSelected: {
    color: "#00796B",
    fontWeight: "600",
  },
  modalCancel: {
    marginTop: 10,
    alignItems: "center",
  },
});
