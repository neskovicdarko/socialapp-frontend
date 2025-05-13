import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";

const mockEvents = [
  { id: "1", title: "Beach Volleyball", date: "May 20, 2025", location: "Santa Monica" },
  { id: "2", title: "Online Coding Meetup", date: "May 22, 2025", location: "Zoom" },
  { id: "3", title: "Hiking Group", date: "May 25, 2025", location: "Griffith Park" },
];

export default function EventScreen() {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDetail}>{item.date}</Text>
      <Text style={styles.eventDetail}>{item.location}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Events</Text>
      <FlatList
        data={mockEvents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  eventCard: {
    padding: 16,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  eventDetail: {
    fontSize: 14,
    color: "gray",
  },
});
