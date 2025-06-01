import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import Navigation from './components/Navigation';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import Activities from './components/Activities';
import ActivityDetail from './components/ActivityDetail';
import PersonalRecords from './components/PersonalRecords';
import Achievements from './components/Achievements';
import LoadingSpinner from './components/LoadingSpinner';

// Services
import localStorageAPI from './services/localStorage';
import { initializeDemoData } from './utils/demoData';

function App() {
  // State management
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('welcome');
  const [dashboardData, setDashboardData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize demo data for GitHub Pages
      initializeDemoData();
      
      // Load data from localStorage
      const demoData = localStorageAPI.getData();
      
      // Check if user was previously logged in
      const savedUser = localStorage.getItem('fittracker_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setCurrentView('dashboard');
          loadDashboardData();
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('fittracker_user');
        }
      }
      
      // Set initial data
      setActivities(demoData.activities || []);
      setAchievements(demoData.achievements || []);
      
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const handleDemoLogin = () => {
    try {
      setIsLoading(true);
      const demoData = localStorageAPI.getData();
      
      const userData = {
        user_id: 'demo_user',
        athlete: {
          id: 'demo_athlete',
          name: demoData.user?.name || 'Demo User'
        }
      };
      
      setUser(userData);
      localStorage.setItem('fittracker_user', JSON.stringify(userData));
      setCurrentView('dashboard');
      loadDashboardData();
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = () => {
    try {
      const data = localStorageAPI.getData();
      const activities = data.activities || [];
      
      const dashboardStats = {
        total_activities: activities.length,
        total_distance: activities.reduce((sum, act) => sum + (act.distance || 0), 0),
        total_time: activities.reduce((sum, act) => sum + (act.duration || 0), 0),
        total_elevation: activities.reduce((sum, act) => sum + (act.elevation_gain || 0), 0),
        recent_activities: activities.slice(0, 5),
        stats: data.stats || { thisWeek: { activities: 0, distance: 0 } },
        activities_by_sport: getActivitiesBySport(activities),
        monthly_distance: getMonthlyDistance(activities),
        heartrate_zones: { zone1: 20, zone2: 30, zone3: 25, zone4: 15, zone5: 10 },
        personal_records: [
          { type: 'Longest Run', sport: 'Run', date: '2024-05-26', value: '15.2', unit: 'km' },
          { type: 'Fastest 5K', sport: 'Run', date: '2024-04-12', value: '21:30', unit: 'time' },
          { type: 'Longest Ride', sport: 'Ride', date: '2024-05-20', value: '45.8', unit: 'km' }
        ],
        recent_achievements: data.achievements?.slice(0, 3) || [
          { icon: '🏆', name: 'First Steps', description: 'Completed first activity', date: '2024-01-16' },
          { icon: '⚡', name: 'Speed Demon', description: 'Achieved 20+ km/h average', date: '2024-04-12' },
          { icon: '🌅', name: 'Early Bird', description: '10 morning workouts', date: '2024-04-20' }
        ]
      };
      
      setDashboardData(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const getActivitiesBySport = (activities) => {
    return activities.reduce((acc, activity) => {
      const sport = activity.type || activity.sport_type || 'Other';
      acc[sport] = (acc[sport] || 0) + 1;
      return acc;
    }, {});
  };

  const getMonthlyDistance = (activities) => {
    const monthlyData = {};
    activities.forEach(activity => {
      const month = new Date(activity.date).toLocaleDateString('en-US', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + (activity.distance || 0);
    });
    
    return Object.entries(monthlyData).map(([month, distance]) => ({
      month,
      distance: Math.round(distance * 100) / 100
    }));
  };

  const navigateToView = (viewName, data = null) => {
    setCurrentView(viewName);
    if (data && viewName === 'activity-detail') {
      setSelectedActivity(data);
    }
  };

  const loadActivities = () => {
    try {
      setIsLoading(true);
      const data = localStorageAPI.getData();
      setActivities(data.activities || []);
      navigateToView('activities');
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonalRecords = () => {
    try {
      setIsLoading(true);
      const activities = localStorageAPI.getData().activities || [];
      
      const records = [
        {
          id: 1,
          type: 'Longest Run',
          value: Math.max(...activities.filter(a => a.type === 'Run').map(r => r.distance || 0), 0).toFixed(1),
          unit: 'km',
          sport: 'Run',
          date: '2024-05-26',
          activity_name: 'Long Weekend Run'
        },
        {
          id: 2,
          type: 'Fastest 5K',
          value: '21:30',
          unit: 'time',
          sport: 'Run',
          date: '2024-04-12',
          activity_name: 'Speed Training'
        },
        {
          id: 3,
          type: 'Longest Ride',
          value: Math.max(...activities.filter(a => a.type === 'Ride').map(r => r.distance || 0), 0).toFixed(1),
          unit: 'km',
          sport: 'Ride',
          date: '2024-05-20',
          activity_name: 'Century Challenge'
        }
      ];
      
      setPersonalRecords(records);
      navigateToView('records');
    } catch (error) {
      console.error('Failed to load personal records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAchievements = () => {
    try {
      setIsLoading(true);
      const data = localStorageAPI.getData();
      setAchievements(data.achievements || []);
      navigateToView('achievements');
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityDetail = (activityId) => {
    try {
      setIsLoading(true);
      const data = localStorageAPI.getData();
      const activity = data.activities.find(a => a.id === activityId.toString());
      
      if (activity) {
        const detailedActivity = {
          ...activity,
          streams: {
            time: Array.from({length: 20}, (_, i) => i * 60),
            altitude: Array.from({length: 20}, (_, i) => 100 + Math.sin(i * 0.5) * 20),
            heartrate: Array.from({length: 20}, (_, i) => 140 + Math.sin(i * 0.3) * 25)
          },
          laps: [
            { lap_index: 1, distance: 2500, moving_time: 900, average_speed: 2.78, average_heartrate: 145 }
          ]
        };
        
        setSelectedActivity(detailedActivity);
        navigateToView('activity-detail');
      }
    } catch (error) {
      console.error('Failed to load activity detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    try {
      const data = localStorageAPI.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setDashboardData(null);
    setSelectedActivity(null);
    setCurrentView('welcome');
    localStorage.removeItem('fittracker_user');
  };

  // Don't render until initialized
  if (!isInitialized) {
    return <LoadingSpinner message="Initializing FitTracker Pro..." />;
  }

  const commonProps = {
    user,
    isLoading,
    navigateToView,
    loadActivities,
    loadPersonalRecords,
    loadAchievements,
    loadActivityDetail,
    exportData,
    handleLogout
  };

  return (
    <div className="App min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {currentView === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WelcomeScreen 
              onLogin={handleDemoLogin}
              isLoading={isLoading}
            />
          </motion.div>
        )}

        {currentView !== 'welcome' && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Navigation 
              currentView={currentView}
              {...commonProps}
            />
            
            <main className="container mx-auto px-4 py-8">
              <AnimatePresence mode="wait">
                {currentView === 'dashboard' && (
                  <Dashboard 
                    key="dashboard"
                    dashboardData={dashboardData}
                    {...commonProps}
                  />
                )}
                
                {currentView === 'activities' && (
                  <Activities 
                    key="activities"
                    activities={activities}
                    {...commonProps}
                  />
                )}
                
                {currentView === 'activity-detail' && selectedActivity && (
                  <ActivityDetail 
                    key="activity-detail"
                    activity={selectedActivity}
                    {...commonProps}
                  />
                )}
                
                {currentView === 'records' && (
                  <PersonalRecords 
                    key="records"
                    records={personalRecords}
                    {...commonProps}
                  />
                )}
                
                {currentView === 'achievements' && (
                  <Achievements 
                    key="achievements"
                    achievements={achievements}
                    {...commonProps}
                  />
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;