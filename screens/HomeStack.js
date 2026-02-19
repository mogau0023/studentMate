import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ModulesScreen from './ModulesScreen';
import AddModulesScreen from './AddModulesScreen';
import ModuleDashboardScreen from './ModuleDashboardScreen';
import PracticeTopicsScreen from './PracticeTopicsScreen';
import PracticePapersScreen from './PracticePapersScreen';
import AssessmentListScreen from './AssessmentListScreen';
import AssessmentViewerScreen from './AssessmentViewerScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Modules" component={ModulesScreen} />
      <Stack.Screen name="AddModules" component={AddModulesScreen} />
      <Stack.Screen name="ModuleDashboard" component={ModuleDashboardScreen} />
      <Stack.Screen name="PracticeTopics" component={PracticeTopicsScreen} />
      <Stack.Screen name="PracticePapers" component={PracticePapersScreen} />
      <Stack.Screen name="AssessmentList" component={AssessmentListScreen} />
      <Stack.Screen name="AssessmentViewer" component={AssessmentViewerScreen} />
    </Stack.Navigator>
  );
}

