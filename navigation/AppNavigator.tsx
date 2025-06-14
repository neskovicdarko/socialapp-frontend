import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import CreateScreen from "../screens/CreateScreen";
import ChatScreen from "../screens/ChatScreen";
import EventsTabs from "../screens/EventsTabs";

const Tab = createBottomTabNavigator();

type AnimatedTabIconProps = {
  name: string;
  focused: boolean;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
};


function AnimatedTabIcon({
  name,
  focused,
  size = 24,
  activeColor = "#004D40",
  inactiveColor = "#00796B",
}: AnimatedTabIconProps){
  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      friction: 4,
      tension: 100,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Icon
        name={name}
        size={size}
        color={focused ? activeColor : inactiveColor}
      />
    </Animated.View>
  );
}

function AnimatedCreateTabIcon({ focused }: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      friction: 4,
      tension: 100,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={[styles.createButton, { transform: [{ scale: scaleAnim }] }]}>
      <Icon name="add" size={28} color="#fff" />
    </Animated.View>
  );
}

export default function AppNavigator({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeName = route.name;

        const getIcon = () => {
          switch (routeName) {
            case "Home":
              return "home-outline";
            case "Map":
              return "map-outline";
            case "Events":
              return "calendar-outline";
            case "Chat":
              return "chatbubbles-outline";
            case "Create":
              return "add";
            default:
              return "ellipse-outline";
          }
        };

        return {
          tabBarShowLabel: false,
          tabBarStyle: {
            height: Platform.OS === "ios" ? 90 : 60,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            position: "absolute",
          },
          tabBarIcon: ({ focused }) => {
            const iconName = getIcon();
            const isCreate = routeName === "Create";

            if (isCreate) {
              return <AnimatedCreateTabIcon focused={focused} />;
            }

            return (
              <AnimatedTabIcon name={iconName} focused={focused} size={24} />
            );
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ProfileStack", { screen: "ProfileMain" })
              }
              style={{ marginRight: 16 }}
            >
              <Icon name="person-circle-outline" size={26} color="#00796B" />
            </TouchableOpacity>
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Events" component={EventsTabs} />
      <Tab.Screen name="Chat" component={ChatScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: "#00796B",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Platform.OS === "ios" ? 20 : 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
});
