import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  LatLng,
} from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import api from "../api";
import Geocoder from "react-native-geocoding";

Geocoder.init("AIzaSyB3h8R8S8DvbZMWSCf1McC4s2hrMUP_l34");

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [marker, setMarker] = useState<LatLng | null>(null);
  const [profileLocation, setProfileLocation] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const requestPermissionAndTrack = async () => {
      try {
        if (Platform.OS === "android") {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permission denied", "Cannot access location.");
            return;
          }
        }

        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const coords = { latitude, longitude };
            setUserLocation(coords);
            centerMapOn(coords);
          },
          (error) => Alert.alert("Location error", error.message),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (err) {
        if (err instanceof Error) {
          Alert.alert("Error requesting location permission", err.message);
        } else {
          Alert.alert("Unknown error occurred");
        }
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        const loc = res.data.profile?.location;
        if (loc) setProfileLocation(loc);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    requestPermissionAndTrack();
    fetchProfile();
  }, []);

  const centerMapOn = (coords: LatLng) => {
    mapRef.current?.animateToRegion(
      {
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
  };

  const zoom = async (direction: "in" | "out") => {
    const camera = await mapRef.current?.getCamera();
    if (camera) {
      const zoomAmount = direction === "in" ? 1 : -1;
      if (camera.zoom !== undefined) {
        camera.zoom += zoomAmount;
        mapRef.current?.animateCamera(camera, { duration: 300 });
      }
    }
  };

  const centerOnUser = () => {
    if (userLocation) centerMapOn(userLocation);
  };

  const centerOnHome = async () => {
    if (!profileLocation) {
      Alert.alert("No home location", "Set your location in your profile.");
      return;
    }
    try {
      const geo = await Geocoder.from(profileLocation);
      const loc = geo.results[0].geometry.location;
      centerMapOn({ latitude: loc.lat, longitude: loc.lng });
    } catch (err) {
      Alert.alert("Error", "Could not geocode home location.");
      console.warn("Geocoding error", err);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={handleMapPress}
        initialRegion={{
          latitude: 44.7866,
          longitude: 20.4489,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {marker && <Marker coordinate={marker} />}
      </MapView>

      {/* Center on user */}
      <TouchableOpacity onPress={centerOnUser} style={styles.centerButton}>
        <Text style={styles.buttonText}>🎯</Text>
      </TouchableOpacity>

      {/* Center on home (profile) */}
      <TouchableOpacity onPress={centerOnHome} style={styles.homeButton}>
        <Text style={styles.buttonText}>🏠</Text>
      </TouchableOpacity>

      {/* Zoom buttons */}
      <View style={styles.zoomControls}>
        <TouchableOpacity onPress={() => zoom("in")} style={styles.zoomButton}>
          <Text style={styles.buttonText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => zoom("out")} style={styles.zoomButton}>
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  zoomControls: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
  zoomButton: {
    backgroundColor: "white",
    borderRadius: 25,
    width: 50,
    height: 50,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  centerButton: {
    position: "absolute",
    bottom: 180,
    right: 20,
    backgroundColor: "white",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  homeButton: {
    position: "absolute",
    bottom: 110,
    left: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  buttonText: {
    fontSize: 22,
  },
});
