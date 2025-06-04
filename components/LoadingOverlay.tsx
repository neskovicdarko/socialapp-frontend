import React from "react";
import { View, ActivityIndicator, StyleSheet, Modal } from "react-native";

const LoadingOverlay = ({ visible }: { visible: boolean }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    </Modal>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
