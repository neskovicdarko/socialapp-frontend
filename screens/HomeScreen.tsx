import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState("home");

  const tabs = [
    { key: "home", icon: "home", label: "Home" },
    { key: "map", icon: "map-marked-alt", label: "Map" },
    { key: "create", icon: "plus-circle", label: "Create" },
    { key: "events", icon: "calendar-alt", label: "Event" },
    { key: "chat", icon: "comments", label: "Chat" },
  ];

  const screenTitleMap = {
    home: "Home",
    map: "Map",
    create: "Create Event",
    events: "Events",
    chat: "Chat",
    profile: "Profile",
  };

  return (
    <View style={{ flex: 1 }}>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={{ fontSize: 24 }}>
          Welcome to {screenTitleMap[activeTab]} Screen
        </Text>
      </View>

      
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
  },
  tabItem: {
    alignItems: "center",
  },
});
