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

import api from "../api";
import { Event } from "../models/Event";
import { Category } from "../models/Category";
import { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchEvents();
  }, [query, selectedCategoryId, startsAfter, startsBefore]);

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

      const response = await api.get<Event[]>("/events/search", { params });
      setEvents(response.data);
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
    setFiltersVisible(false);
  };

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersVisible((prev) => !prev);
  };

  const isFiltersEmpty = () => {
    return (
      !query.trim() &&
      selectedCategoryId === null &&
      !startsAfter &&
      !startsBefore
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
      <TextInput
        placeholder="Search by title or description..."
        value={query}
        onChangeText={setQuery}
        style={styles.searchInput}
        placeholderTextColor="#888"
      />

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
                if (isFiltersEmpty()) {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setFiltersVisible(false);
                } else {
                  resetFilters();
                }
              }}
            >
              <Text style={styles.filterButtonText}>
                {isFiltersEmpty() ? "Hide" : "Reset"}
              </Text>
            </TouchableOpacity>
          </View>
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
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
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
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 16,
    color: "#333",
  },
  toggleButton: {
    backgroundColor: "#00796B",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
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
