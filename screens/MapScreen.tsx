import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapboxGL from "@rnmapbox/maps";

export default function MapScreen() {
  
  const belgradeCoords = [20.457273, 44.787197]; // [longitude, latitude]

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map}>
        <MapboxGL.Camera
          zoomLevel={12}
          centerCoordinate={belgradeCoords}
        />
        <MapboxGL.PointAnnotation coordinate={belgradeCoords} id="belgrade" />
      </MapboxGL.MapView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
