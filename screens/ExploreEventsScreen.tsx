import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AxiosError } from "axios";
import Geocoder from "react-native-geocoding";
import Icon from "react-native-vector-icons/MaterialIcons";

import api from "../api";
import { Event } from "../models/Event";
import { Category } from "../models/Category";
import { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

Geocoder.init("AIzaSyB3h8R8S8DvbZMWSCf1McC4s2hrMUP_l34");

export default function EventScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [submittingIds, setSubmittingIds] = useState<Set<number>>(new Set());

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [startsAfter, setStartsAfter] = useState<Date | undefined>();
  const [startsBefore, setStartsBefore] = useState<Date | undefined>();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [filtersVisible, setFiltersVisible] = useState(false);

  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(50);

  const [favoritesOnly, setFavoritesOnly] = useState(false);
  
  const GOOGLE_API_KEY = "AIzaSyB3h8R8S8DvbZMWSCf1McC4s2hrMUP_l34";

  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchEvents();
  }, [query, selectedCategoryId, startsAfter, startsBefore, selectedLocation, radius, favoritesOnly]);

  useFocusEffect(
    useCallback(() => {
      fetchMyApplications();
      fetchCategories();
    }, [])
  );

  const fetchCategories = async () => {
    try {
      const response = await api.get<Category[]>("/categories");
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to load categories");
    }
  };

  const searchLocation = async (text: string) => {
    setLocationQuery(text);
    if (text.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    try {
      const res = await api.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&types=(cities)&key=${GOOGLE_API_KEY}`
      );
      const results = res.data.predictions;
      setLocationSuggestions(results);
    } catch (err) {
      setLocationSuggestions([]);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (query.trim() !== "") {
        params.q = query;
      }
      if (selectedCategoryId) {
        params.category_id = selectedCategoryId;
      }
      if (startsAfter) {
        params.starts_after = startsAfter.toISOString().split("T")[0];
      }
      if (startsBefore) {
        params.starts_before = startsBefore.toISOString().split("T")[0];
      }
      if (selectedLocation) {
        params.lat = selectedLocation.lat;
        params.lng = selectedLocation.lng;
        params.radius = radius;
      }

      if (favoritesOnly) {
        params.favorites_only = true;
      } else {
        delete params.favorites_only;
      }

      const response = await api.get<Event[]>("/events/search", { params });
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const error = err as AxiosError;
      console.error("Failed to load events", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await api.get<Event[]>("/applications/mine");
      setAppliedIds(response.data.map((event) => event.id));
    } catch (err) {
      console.error("Failed to load applications");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchEvents(), fetchMyApplications()]);
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  };

  const addSubmitting = (id: number) => {
    setSubmittingIds((prev) => new Set(prev).add(id));
  };

  const removeSubmitting = (id: number) => {
    setSubmittingIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

  const applyToEvent = async (eventId: number) => {
    addSubmitting(eventId);
    try {
      await api.post(`/events/${eventId}/apply`);
      setAppliedIds((prev) => [...prev, eventId]);
    } catch (err) {
      console.error("Apply failed", err);
    } finally {
      removeSubmitting(eventId);
    }
  };

  const revokeApplication = async (eventId: number) => {
    addSubmitting(eventId);
    try {
      await api.delete(`/events/${eventId}/revoke`);
      setAppliedIds((prev) => prev.filter((id) => id !== eventId));
    } catch (err) {
      console.error("Revoke failed", err);
    } finally {
      removeSubmitting(eventId);
    }
  };

  const resetFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategoryId(null);
    setStartsAfter(undefined);
    setStartsBefore(undefined);
    setQuery("");
    setLocationQuery("");
    setLocationSuggestions([]);
    setSelectedLocation(null);
    setRadius(50);
    setFavoritesOnly(false);
    setFiltersVisible(false);
  };

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersVisible((prev) => !prev);
  };

  const toggleFavoritesFilter = () => {
    setFavoritesOnly(!favoritesOnly);
  };

  const isFiltersEmpty = () => {
    return (
      !query.trim() &&
      selectedCategoryId === null &&
      !startsAfter &&
      !startsBefore &&
      !selectedLocation &&
      !favoritesOnly
    );
  };

  const renderItem = ({ item }: { item: Event }) => {
    const isApplied = appliedIds.includes(item.id);
    const isSubmitting = submittingIds.has(item.id);

    return (
      <View style={styles.eventCard}>
        <TouchableOpacity onPress={() => navigation.navigate("EventDetail", { event: item })}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDetail}>{item.starts_at}</Text>
          <Text style={styles.eventDetail}>{item.location}</Text>
          <Text style={styles.eventDetail}>
            Category: {item.category ? item.category.name.replace(/-/g, " ") : "Uncategorized"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isApplied ? styles.revoke : styles.apply]}
          onPress={() => (isApplied ? revokeApplication(item.id) : applyToEvent(item.id))}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isApplied ? "REVOKE" : "APPLY"}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar with favorites star */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by title or description..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={[styles.starButton, favoritesOnly && styles.starButtonActive]}
          onPress={toggleFavoritesFilter}
        >
          <Icon 
            name={favoritesOnly ? "star" : "star-border"} 
            size={24} 
            color={favoritesOnly ? "#FFD700" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>

      {!filtersVisible && (
        <TouchableOpacity style={styles.toggleButton} onPress={toggleFilters}>
          <Text style={styles.toggleButtonText}>Show Filters ▼</Text>
        </TouchableOpacity>
      )}

      {filtersVisible && (
        <View style={styles.filterContainer}>
          <RNPickerSelect
            onValueChange={(value) => setSelectedCategoryId(value)}
            value={selectedCategoryId}
            placeholder={{ label: "Select Category...", value: null }}
            items={categories.map((c) => ({
              label: c.name.replace(/-/g, " "),
              value: c.id,
            }))}
            style={pickerSelectStyles}
          />

          <TextInput
            placeholder="Enter location..."
            value={locationQuery}
            onChangeText={searchLocation}
            style={styles.searchInput}
          />

          {locationSuggestions.length > 0 && (
            <View style={{ backgroundColor: "#fff", borderRadius: 8, elevation: 2 }}>
              {locationSuggestions.map((loc, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={async () => {
                    const detailsRes = await api.get(
                      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${loc.place_id}&key=${GOOGLE_API_KEY}`
                    );
                    const geometry = detailsRes.data.result.geometry.location;
                    setSelectedLocation({ lat: geometry.lat, lng: geometry.lng });
                    setLocationQuery(loc.description);
                    setLocationSuggestions([]);
                  }}
                  style={{ padding: 8 }}
                >
                  <Text>{loc.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Text style={{ marginRight: 8 }}>Radius (km):</Text>
            <TextInput
              style={[styles.searchInput, { width: 80 }]}
              keyboardType="numeric"
              value={radius.toString()}
              onChangeText={(text) => setRadius(Number(text))}
            />
          </View>

          <View style={styles.dateFilterRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.filterButtonText}>
                {startsAfter ? startsAfter.toDateString() : "Starts After"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.filterButtonText}>
                {startsBefore ? startsBefore.toDateString() : "Starts Before"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, styles.resetButton]}
              onPress={() => {
                resetFilters();
              }}
            >
              <Text style={styles.filterButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleFilters}
          >
            <Text style={styles.toggleButtonText}>Hide Filters ▲</Text>
          </TouchableOpacity>
        </View>
      )}

      {showStartPicker && (
        <DateTimePicker
          value={startsAfter || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(Platform.OS === "ios");
            if (date) setStartsAfter(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={startsBefore || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(Platform.OS === "ios");
            if (date) setStartsBefore(date);
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#00796B" style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={events.filter(e => e && e.id)}
          renderItem={renderItem}
          keyExtractor={(item, idx) => (item && item.id ? item.id.toString() : `event-${idx}`)}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#333",
  },
  starButton: {
    marginLeft: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  starButtonActive: {
    backgroundColor: "#fff3cd",
    borderColor: "#FFD700",
  },
  toggleButton: {
    backgroundColor: "#007f6e",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  filterContainer: {
    marginBottom: 16,
  },
  dateFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#00796B",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: "#666",
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  eventCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: "#222",
  },
  eventDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  actionButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  apply: {
    backgroundColor: "#00796B",
  },
  revoke: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
});