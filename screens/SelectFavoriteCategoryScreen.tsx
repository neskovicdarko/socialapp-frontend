import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../api';
import { Category } from '../models/Category';

const SelectFavoriteCategoryScreen = ({ navigation, route }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { isFirstTime = false } = route?.params || {};

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const categoriesResponse = await api.get<Category[]>('/categories');
      setCategories(categoriesResponse.data);

      try {
        const profileResponse = await api.get('/profile');
        if (profileResponse.data && profileResponse.data.favorite_categories) {
          setSelectedCategories(profileResponse.data.favorite_categories);
        }
      } catch (profileError) {
        console.log('No existing profile or favorites found');
        setSelectedCategories([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load categories. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const saveFavoriteCategories = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Error', 'Please select at least one category');
      return;
    }

    setSaving(true);
    try {
      await api.post('/profile/favorite-categories', {
        favorite_categories: selectedCategories
          .map(Number)
          .filter(id => Number.isInteger(id) && id > 0)
      });

      Alert.alert(
        'Success', 
        'Favorite categories saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (isFirstTime) {
                navigation.replace('MainTabs');
              } else {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving favorite categories:', error.response?.data || error);
      Alert.alert('Error', 'Failed to save favorite categories. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const isSelected = selectedCategories.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.selectedCategory]}
        onPress={() => toggleCategory(item.id)}
      >
        <Text style={[styles.categoryText, isSelected && styles.selectedText]}>
          {item.name.replace(/-/g, ' ')}
        </Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00796B" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Favorite Categories</Text>
        <Text style={styles.subtitle}>
          Choose categories you're interested in to see personalized events
        </Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedCategories.length} categories selected
        </Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            selectedCategories.length === 0 && styles.disabledButton
          ]}
          onPress={saveFavoriteCategories}
          disabled={saving || selectedCategories.length === 0}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  list: {
    flex: 1,
    padding: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedCategory: {
    borderColor: '#00796B',
    backgroundColor: '#f0f8ff',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedText: {
    color: '#00796B',
  },
  checkmark: {
    fontSize: 18,
    color: '#00796B',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#00796B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SelectFavoriteCategoryScreen;