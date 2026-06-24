const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to include ttf font assets
config.resolver.assetExts.push('ttf');

// Explicitly tell Metro where to find the vector icon fonts
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

config.watchFolders = [
  path.resolve(__dirname, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts'),
];

module.exports = config;