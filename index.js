/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken('sk.eyJ1IjoibG9zaG1pOTk3IiwiYSI6ImNtYXk1MTJjaTA2YjEybXNoZnkzOGlicnQifQ.OIrbSzFk5Q5jmZcC-Bun-Q');

AppRegistry.registerComponent(appName, () => App);
