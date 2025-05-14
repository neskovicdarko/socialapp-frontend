import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome5";
import { TouchableOpacity } from "react-native";

// Screens
import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import CreateScreen from "../screens/CreateScreen";
import EventScreen from "../screens/EventScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const icons = {
  Home: "home",
  Map: "map-marked-alt",
  Create: "plus-circle",
  Events: "calendar-alt",
  Chat: "comments",
} as const;

type TabRouteName = keyof typeof icons; // "Home" | "Map" | ...

export default function AppNavigator({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeName = route.name as TabRouteName;

        return {
          tabBarIcon: ({ color, size }) => (
            <Icon name={icons[routeName]} size={size} color={color} />
          ),
          tabBarActiveTintColor: "green",
          tabBarInactiveTintColor: "gray",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={{ marginRight: 16 }}
            >
              <Icon name="user" size={20} color="gray" />
            </TouchableOpacity>
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Events" component={EventScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
    </Tab.Navigator>
  );
}
