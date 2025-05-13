import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

export default function ProfileScreen({ navigation }) {
  const handleLogout = () => {
    // Replace with real logout logic
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <Icon name="user-circle" size={80} color="gray" />
      <Text style={styles.name}>John Doe</Text>
      <Text style={styles.email}>john.doe@example.com</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 16,
  },
  email: {
    fontSize: 16,
    color: "gray",
    marginBottom: 30,
  },
  button: {
    marginTop: 20,
    backgroundColor: "green",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
