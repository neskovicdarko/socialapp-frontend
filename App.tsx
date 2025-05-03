import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import api from './api';

const App = () => {
  useEffect(() => {
    api.get('/ping')
      .then((res: { data: string; }) => console.log('PingpongSuccess', res.data))
      .catch((err: { message: string; }) => console.log('PingpongError', err.message));
  }, []);

  return (
    <View>
      <Text>Ping Test</Text>
    </View>
  );
};

export default App;
