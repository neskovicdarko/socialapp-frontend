import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/ProfileScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import SelectFavoriteCategoryScreen from "../screens/SelectFavoriteCategoryScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: "Profile" }} 
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={{ title: "Change Password" }} 
      />
      <Stack.Screen 
        name="SelectFavoriteCategory" 
        component={SelectFavoriteCategoryScreen} 
        options={{ title: "Select Favorite Categories" }} 
      />
    </Stack.Navigator>
  );
}