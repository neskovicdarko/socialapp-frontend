import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

type TabKey = "home" | "map" | "create" | "events" | "chat";

const screenTitleMap: Record<TabKey, string> = {
  home: "Home",
  map: "Map",
  create: "Create Event",
  events: "Events",
  chat: "Chat",
};

const tabs: { key: TabKey; icon: string; label: string }[] = [
  { key: "home", icon: "home", label: "Home" },
  { key: "map", icon: "map-marked-alt", label: "Map" },
  { key: "create", icon: "plus-circle", label: "Create" },
  { key: "events", icon: "calendar-alt", label: "Events" },
  { key: "chat", icon: "comments", label: "Chat" },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header /}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{screenTitleMap[activeTab]}</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Icon name="user" size={20} color="gray" />
        </TouchableOpacity>
      </View>

      {/ Main Content */}
      <View style={styles.content}>
        <Text style={{ fontSize: 24 }}>
          Welcome to {screenTitleMap[activeTab]} Screen
        </Text>
      </View>
    </SafeAreaView>
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
