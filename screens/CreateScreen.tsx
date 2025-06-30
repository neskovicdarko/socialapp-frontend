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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../api";
import { Category } from "../models/Category";

export default function CreateScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState<Category["id"] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    api.get("/categories")
      .then(res => setCategories(res.data))
      .catch(err => console.error("Failed to load categories", err));
  }, []);

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

  const handleCreate = async () => {
    const startsAt = formatToMysqlDatetime(startDate, startTime);
    const now = new Date();

    if (new Date(startsAt) <= now) {
      Alert.alert("Invalid Time", "Event must be set in the future.");
      return;
    }

    try {
      await api.post("/events", {
        title,
        description,
        location,
        starts_at: startsAt,
        category_id: categoryId,
      });

      Alert.alert("Success", "Event created successfully!");
    } catch (error: unknown) {
      const err = error as any;
      console.error("Create error:", err.response || err.message);
      Alert.alert("Error", err.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.touchableInput} value={title} onChangeText={setTitle} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.touchableInput}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.touchableInput}
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.touchableInput}
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
                          item.id === categoryId ? styles.modalItemTextSelected : null
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
          style={styles.touchableInput}
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
          style={styles.touchableInput}
          onPress={() => setShowTimePicker(true)}
        >
          <Text>
            {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
  touchableInput: {
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
