import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import ExploreEventsScreen from "./ExploreEventsScreen";
import MyEventsScreen from "./MyEventsScreen";

const Tab = createMaterialTopTabNavigator();

export default function EventsTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#00796B",
        tabBarLabelStyle: { fontWeight: "600" },
        tabBarIndicatorStyle: { backgroundColor: "#00796B" },
      }}
    >
      <Tab.Screen name="Explore" component={ExploreEventsScreen} />
      <Tab.Screen name="My Events" component={MyEventsScreen} />
    </Tab.Navigator>
  );
}
