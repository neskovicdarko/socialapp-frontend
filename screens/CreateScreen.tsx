import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function CreateScreen() {
  const handleCreate = () => {
    // TODO: implement actual create event logic
    alert("Event creation will be available soon.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Event</Text>

      {/* Placeholder for form fields */}
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>[Form inputs will go here]</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Create Event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  placeholderBox: {
    width: "100%",
    height: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  placeholderText: {
    color: "gray",
  },
  button: {
    backgroundColor: "green",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
