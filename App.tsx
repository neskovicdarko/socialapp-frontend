import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import RootNavigator from './navigation/RootNavigator';

import { LoadingProvider, useLoading } from './context/LoadingContext';
import LoadingOverlay from './components/LoadingOverlay';

const Stack = createNativeStackNavigator();

// Wrapper that listens to loading state
const AppWrapper = () => {
  const { loading } = useLoading();

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="MainApp"
            component={RootNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <LoadingOverlay visible={loading} />
    </>
  );
};

const App = () => (
  <LoadingProvider>
    <AppWrapper />
  </LoadingProvider>
);

export default App;
