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
  Region,
} from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import api from "../api";
import Geocoder from "react-native-geocoding";

Geocoder.init("AIzaSyB3h8R8S8DvbZMWSCf1McC4s2hrMUP_l34");

interface EventItem {
  id: number;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
}

const INITIAL_REGION={
          latitude: 44.7866,
          longitude: 20.4489,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [marker, setMarker] = useState<LatLng | null>(null);
  const [profileLocation, setProfileLocation] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
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
          position => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLocation(coords);
            centerMapOn(coords);
          },
          error => Alert.alert("Location error", error.message),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (err) {
        Alert.alert("Error requesting location permission", (err as Error).message);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        setProfileLocation(res.data.profile?.location);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data);
        console.log("Fetched events:", res.data)
        if (res.data.length > 0) {
          const first = res.data[0];
          centerMapOn({ latitude: parseFloat(first.latitude), longitude: parseFloat(first.longitude) });
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    };

    requestPermissionAndTrack();
    fetchProfile();
    fetchEvents();
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
    if (camera?.zoom !== undefined) {
      camera.zoom += direction === "in" ? 1 : -1;
      mapRef.current?.animateCamera(camera, { duration: 300 });
    }
  };

  const centerOnUser = () => userLocation && centerMapOn(userLocation);

  const centerOnHome = async () => {
    if (!profileLocation) {
      return Alert.alert("No home location", "Set your location in profile.");
    }
    try {
      const geo = await Geocoder.from(profileLocation);
      const loc = geo.results[0].geometry.location;
      centerMapOn({ latitude: loc.lat, longitude: loc.lng });
    } catch (err) {
      Alert.alert("Error", "Could not geocode home location.");
      console.warn(err);
    }
  };

  const onMarkerSelected = (marker: any) => {
    Alert.alert(marker.name);
  }

  return (
    <View style={styles.container}>
      <MapView
        key="map-instance"
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION}
        showsUserLocation={true}
        showsMyLocationButton
        ref={mapRef}
        onPress={handleMapPress}
      >
        {marker && <Marker coordinate={marker} />}
        {events.map(ev => {
          console.log("Rendering event marker:", ev);
          return(
          <Marker
            key={ev.id}
            coordinate={{ latitude: ev.latitude, longitude: ev.longitude }}
            pinColor="green"
            title={ev.title}
            description={ev.location}
          />
          );
        })}
      </MapView>

      <TouchableOpacity onPress={centerOnUser} style={styles.centerButton}>
        <Text style={styles.buttonText}>🎯</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={centerOnHome} style={styles.homeButton}>
        <Text style={styles.buttonText}>🏠</Text>
      </TouchableOpacity>

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
    marginBottom: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  centerButton: {
    position: "absolute",
    bottom: 250,
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
  buttonText: { fontSize: 22 },
});
