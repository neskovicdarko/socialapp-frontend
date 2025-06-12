// navigation/RootNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppNavigator from "./AppNavigator";
import EventDetailScreen from "../screens/EventDetailScreen";
import { Event } from "../models/Event";
import { User } from "../models/User";
import EventDetailProfileScreen from "../screens/EventDetailProfileScreen";
import ProfileStackNavigator from "./ProfileStackNavigator";

export type RootStackParamList = {
  Tabs: undefined;
  EventDetail: { event: Event };
  EventDetailProfile: { user: User };
  ProfileStack: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={AppNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="EventDetailProfile" component={EventDetailProfileScreen} />
      <Stack.Screen name="ProfileStack" component={ProfileStackNavigator} options={{ headerShown: false }} />

    </Stack.Navigator>
  );
}
