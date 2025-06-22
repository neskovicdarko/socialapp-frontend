import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../api";
import axios from "axios";
import Geocoder from "react-native-geocoding";

Geocoder.init("AIzaSyB3h8R8S8DvbZMWSCf1McC4s2hrMUP_l34");


export default function CreateScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [startTime, setStartTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);



  const GOOGLE_API_KEY = "AIzaSyB3h8R8S8DvbZMWSCf1McC4s2hrMUP_l34";

  const formatToMysqlDatetime = (dateObj: Date, timeObj: Date): string => {
    const combined = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      timeObj.getHours(),
      timeObj.getMinutes()
    );
    return combined.toISOString().replace("T", " ").substring(0, 19);
  };

  // const handleCreate = async () => {
  //   const startsAt = formatToMysqlDatetime(startDate, startTime);
  //   const now = new Date();

  //   const eventDate = new Date(startsAt);
  //   if (eventDate <= now) {
  //     Alert.alert("Invalid Time", "Event must be set in the future.");
  //     return;
  //   }

  //   const geo = await Geocoder.from(location);
  //   if (geo.results.length === 0) {
  //     Alert.alert("Error", "Invalid location");
  //     return;
  //   }

  //   const coords = geo.results[0].geometry.location;
  //   setLatitude(coords.lat);
  //   setLongitude(coords.lng);


  //   try {
  //     await api.post("/events", {
  //       title,
  //       description,
  //       location,
  //       starts_at: startsAt,
  //       latitude: coords.lat,
  //       longitude: coords.lng,
  //     });

  //     Alert.alert("Success", "Event created successfully!");
  //   } catch (error: any) {
  //     console.error("Create error:", error.response || error.message);
  //     Alert.alert("Error", error.response?.data?.message || "Something went wrong.");
  //   }
  // };
  const handleCreate = async () => {
    const startsAt = formatToMysqlDatetime(startDate, startTime);
    if (new Date(startsAt) <= new Date()) {
      return Alert.alert("Invalid Time", "Event must be in the future.");
    }

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
        latitude: lat,
        longitude: lng,
      });

      Alert.alert("Success", "Event created successfully!");
    } catch (error: any) {
      console.error("Create error:", error);
      Alert.alert("Error", error.response?.data?.message || "Something went wrong.");
    }
  };


  const searchAddress = async (input: string) => {
    setLocation(input);
    if (input.length < 3) return;

    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${GOOGLE_API_KEY}`
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
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
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
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text>
            {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={true}
            minimumDate={new Date()}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setStartTime(selectedTime);
            }}
          />
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Create Event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  inputGroup: { marginBottom: 12 },
  label: { fontWeight: "600", marginBottom: 4, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
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
});
